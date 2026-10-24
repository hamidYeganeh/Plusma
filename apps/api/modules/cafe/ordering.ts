import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import type {
  CafeMenuInput,
  CafeMenuItem,
  CafeOrder,
  CafeOrderInput,
  CafeOrderStatus,
} from "@repo/contracts";
import { Database, Transaction } from "../database";
import { Access } from "../access";
import { date, integer, key, uuid } from "./booking";
type Row = Record<string, any>;
function menu(row: Row): CafeMenuItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    priceRials: row.price_rials,
    isAvailable: row.is_available,
    version: row.version,
  };
}
// Read persisted line snapshots in one database round trip for both commands and lists.
const orderProjection = `SELECT o.*,r.table_id,r.guest_name,
  (SELECT jsonb_agg(jsonb_build_object('menuItemId',l.menu_item_id,'name',l.name,
    'quantity',l.quantity,'unitPriceRials',l.unit_price_rials) ORDER BY l.menu_item_id)
    FROM cafe_order_lines l WHERE l.order_id=o.id) AS items
  FROM cafe_orders o JOIN reservations r ON r.id=o.reservation_id`;
function order(row: Row): CafeOrder {
  return {
    id: row.id,
    code: row.code,
    reservationId: row.reservation_id,
    tableId: row.table_id,
    guestName: row.guest_name,
    status: row.status,
    totalRials: Number(row.total_rials),
    createdAt: row.created_at.toISOString(),
    items: row.items ?? [],
  };
}
function menuInput(input: CafeMenuInput) {
  if (
    typeof input.name !== "string" ||
    !input.name.trim() ||
    input.name.trim().length > 100 ||
    typeof input.category !== "string" ||
    !input.category.trim() ||
    input.category.trim().length > 60 ||
    typeof input.isAvailable !== "boolean"
  )
    throw new BadRequestException("Invalid menu item");
  integer(input.priceRials, "price", 1000000000);
  if (input.priceRials % 10 !== 0)
    throw new BadRequestException("Price must be in whole toman (10 IRR)");
  return {
    ...input,
    id: uuid(input.id),
    name: input.name.trim(),
    category: input.category.trim(),
  };
}
const sameMenu = (row: Row, input: CafeMenuInput) =>
  row.name === input.name &&
  row.category === input.category &&
  row.price_rials === input.priceRials &&
  row.is_available === input.isAvailable;
const digest = (input: unknown) =>
  createHash("sha256").update(JSON.stringify(input)).digest("hex");
@Injectable()
export class CafeOrdering {
  constructor(
    @Inject(Database) private readonly db: Database,
    @Inject(Access) private readonly access: Access,
  ) {}
  async menu(slug: string, staffId?: string) {
    const venue = (
      await this.db.query("SELECT id FROM venues WHERE slug=$1", [slug])
    ).rows[0];
    if (!venue) throw new NotFoundException("Venue not found");
    if (staffId) await this.access.authorize(staffId, slug);
    const { rows } = await this.db.query(
      `SELECT * FROM cafe_menu_items WHERE venue_id=$1 ${staffId ? "" : "AND is_available=true"} ORDER BY category,created_at,id`,
      [venue.id],
    );
    return rows.map(menu);
  }
  async saveItem(
    staffId: string,
    slug: string,
    input: CafeMenuInput,
    version?: number,
  ) {
    const venueId = await this.access.authorize(staffId, slug),
      data = menuInput(input);
    if (version !== undefined && (!Number.isInteger(version) || version < 1))
      throw new BadRequestException("Invalid menu version");
    return this.db.transaction(async (tx) => {
      // Item UUID is the create command identity. Replaying it never inserts another item.
      await tx.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
        `menu:${data.id}`,
      ]);
      const row = (
        await tx.query(
          "SELECT * FROM cafe_menu_items WHERE id=$1 AND venue_id=$2 FOR UPDATE",
          [data.id, venueId],
        )
      ).rows[0];
      if (row) {
        if (sameMenu(row, data)) return menu(row);
        if (version === undefined || row.version !== version)
          throw new ConflictException("Menu changed. Refresh before editing.");
        return menu(
          (
            await tx.query(
              `UPDATE cafe_menu_items SET name=$3,category=$4,price_rials=$5,is_available=$6,version=version+1,updated_at=now()
          WHERE id=$1 AND venue_id=$2 RETURNING *`,
              [
                data.id,
                venueId,
                data.name,
                data.category,
                data.priceRials,
                data.isAvailable,
              ],
            )
          ).rows[0]!,
        );
      }
      if (version !== undefined)
        throw new NotFoundException("Menu item not found");
      try {
        return menu(
          (
            await tx.query(
              `INSERT INTO cafe_menu_items(id,venue_id,name,category,price_rials,is_available) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
              [
                data.id,
                venueId,
                data.name,
                data.category,
                data.priceRials,
                data.isAvailable,
              ],
            )
          ).rows[0]!,
        );
      } catch (error) {
        if ((error as { code?: string }).code === "23505")
          throw new ConflictException("Menu item identity already used");
        throw error;
      }
    });
  }
  private async presentOrder(tx: Transaction, id: string): Promise<CafeOrder> {
    const { rows } = await tx.query(`${orderProjection} WHERE o.id=$1`, [id]);
    if (!rows[0]) throw new NotFoundException("Order not found");
    return order(rows[0]);
  }
  async create(
    staffId: string,
    slug: string,
    input: CafeOrderInput,
    commandKey: string,
  ) {
    const venueId = await this.access.authorize(staffId, slug);
    key(commandKey);
    uuid(input.reservationId);
    if (
      !Array.isArray(input.items) ||
      input.items.length < 1 ||
      input.items.length > 20
    )
      throw new BadRequestException("Choose 1–20 menu items");
    const items = input.items
      .map((item) => {
        if (!item || typeof item !== "object")
          throw new BadRequestException("Invalid order line");
        return {
          menuItemId: uuid(item.menuItemId),
          quantity: integer(item.quantity, "quantity", 20),
          version: integer(item.version, "menu version", 2147483647),
        };
      })
      .sort((a, b) => a.menuItemId.localeCompare(b.menuItemId));
    if (new Set(items.map((item) => item.menuItemId)).size !== items.length)
      throw new BadRequestException("Duplicate menu items");
    const requestHash = digest({
      reservationId: input.reservationId,
      items,
      staffId,
    });
    return this.db.transaction(async (tx) => {
      await tx.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
        `order:${venueId}:${commandKey}`,
      ]);
      const old = (
        await tx.query(
          "SELECT id,request_hash FROM cafe_orders WHERE venue_id=$1 AND command_key=$2",
          [venueId, commandKey],
        )
      ).rows[0];
      if (old) {
        if (old.request_hash !== requestHash)
          throw new ConflictException(
            "Idempotency key reused with different input",
          );
        return this.presentOrder(tx, old.id);
      }
      const reservation = (
        await tx.query(
          "SELECT * FROM reservations WHERE id=$1 AND venue_id=$2 FOR UPDATE",
          [input.reservationId, venueId],
        )
      ).rows[0];
      if (!reservation) throw new NotFoundException("Reservation not found");
      if (reservation.status !== "checked_in")
        throw new ConflictException("Check in guests before placing an order");
      if (reservation.ends_at <= new Date())
        throw new ConflictException("The visit has ended");
      const { rows: available } = await tx.query(
        "SELECT * FROM cafe_menu_items WHERE venue_id=$1 AND id=ANY($2::uuid[]) ORDER BY id FOR UPDATE",
        [venueId, items.map((item) => item.menuItemId)],
      );
      if (available.length !== items.length)
        throw new BadRequestException(
          "Some menu items do not belong to this venue",
        );
      const lines = items.map((item) => {
        const source = available.find((row) => row.id === item.menuItemId)!;
        if (!source.is_available || source.version !== item.version)
          throw new ConflictException(
            "Menu changed or item unavailable. Refresh the menu.",
          );
        return {
          ...item,
          name: source.name,
          unitPriceRials: source.price_rials,
        };
      });
      const total = lines.reduce(
        (sum, item) => sum + item.unitPriceRials * item.quantity,
        0,
      );
      const order = (
        await tx.query(
          `INSERT INTO cafe_orders(code,venue_id,reservation_id,status,total_rials,created_by,command_key,request_hash)
        VALUES($1,$2,$3,'placed',$4,$5,$6,$7) RETURNING id`,
          [
            randomBytes(6).toString("hex").toUpperCase(),
            venueId,
            input.reservationId,
            total,
            staffId,
            commandKey,
            requestHash,
          ],
        )
      ).rows[0]!;
      for (const line of lines)
        await tx.query(
          "INSERT INTO cafe_order_lines(order_id,venue_id,menu_item_id,name,quantity,unit_price_rials) VALUES($1,$2,$3,$4,$5,$6)",
          [
            order.id,
            venueId,
            line.menuItemId,
            line.name,
            line.quantity,
            line.unitPriceRials,
          ],
        );
      await tx.query(
        "INSERT INTO cafe_order_events(order_id,status,staff_user_id) VALUES($1,'placed',$2)",
        [order.id, staffId],
      );
      return this.presentOrder(tx, order.id);
    });
  }
  async list(staffId: string, slug: string, day: string) {
    date(day);
    const venueId = await this.access.authorize(staffId, slug);
    const { rows } = await this.db.query(
      `${orderProjection} JOIN venues v ON v.id=o.venue_id WHERE o.venue_id=$1 AND o.created_at >= ($2::date::timestamp AT TIME ZONE v.time_zone) AND o.created_at < (($2::date+1)::timestamp AT TIME ZONE v.time_zone) ORDER BY o.created_at DESC`,
      [venueId, day],
    );
    return rows.map(order);
  }
  async transition(
    staffId: string,
    id: string,
    status: CafeOrderStatus,
    commandKey: string,
  ) {
    uuid(id);
    key(commandKey);
    if (!["preparing", "ready", "served", "cancelled"].includes(status))
      throw new BadRequestException("Invalid order status");
    const found = (
      await this.db.query(
        "SELECT v.slug FROM cafe_orders o JOIN venues v ON v.id=o.venue_id WHERE o.id=$1",
        [id],
      )
    ).rows[0];
    if (!found) throw new NotFoundException("Order not found");
    await this.access.authorize(staffId, found.slug);
    return this.db.transaction(async (tx) => {
      const row = (
        await tx.query("SELECT * FROM cafe_orders WHERE id=$1 FOR UPDATE", [id])
      ).rows[0]!;
      const fingerprint = digest({ status, staffId });
      const prior = (
        await tx.query(
          "SELECT * FROM cafe_order_commands WHERE order_id=$1 AND command_key=$2",
          [id, commandKey],
        )
      ).rows[0];
      if (prior) {
        if (prior.request_hash !== fingerprint)
          throw new ConflictException(
            "Idempotency key reused with different input",
          );
        return prior.result as CafeOrder;
      }
      const next: Record<string, string[]> = {
        placed: ["preparing", "cancelled"],
        preparing: ["ready", "cancelled"],
        ready: ["served"],
        served: [],
        cancelled: [],
      };
      if (!next[row.status]?.includes(status))
        throw new ConflictException("Order status changed. Refresh the list.");
      await tx.query(
        "UPDATE cafe_orders SET status=$2,updated_at=now() WHERE id=$1",
        [id, status],
      );
      const result = await this.presentOrder(tx, id);
      await tx.query(
        "INSERT INTO cafe_order_commands(order_id,command_key,request_hash,result) VALUES($1,$2,$3,$4)",
        [id, commandKey, fingerprint, JSON.stringify(result)],
      );
      await tx.query(
        "INSERT INTO cafe_order_events(order_id,status,staff_user_id) VALUES($1,$2,$3)",
        [id, status, staffId],
      );
      return result;
    });
  }
}
