import {
  BadRequestException,
  ConflictException,
  GoneException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { createHash, createHmac, randomBytes } from "node:crypto";
import type {
  Availability,
  ConfirmInput,
  HoldInput,
  HoldResult,
  Reservation,
} from "@repo/contracts";
import { Database, Transaction } from "../database";
import { Access } from "../access";
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const fingerprint = (value: unknown) => hash(JSON.stringify(value));
type Row = Record<string, any>;
const SELECT = `SELECT r.*,v.slug,v.name AS venue_name,v.time_zone FROM reservations r JOIN venues v ON v.id=r.venue_id`;
function present(row: Row): Reservation {
  return {
    id: row.id,
    code: row.code,
    venueSlug: row.slug,
    venueName: row.venue_name,
    timeZone: row.time_zone,
    tableId: row.table_id,
    guests: row.guests,
    startsAt: row.starts_at.toISOString(),
    endsAt: row.ends_at.toISOString(),
    status:
      row.status === "held" && row.expires_at <= new Date()
        ? "expired"
        : row.status,
    expiresAt: row.status === "held" ? row.expires_at.toISOString() : null,
    guestName: row.guest_name,
    guestPhone: row.guest_phone,
  };
}
export function uuid(value: string) {
  if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(value))
    throw new BadRequestException("Invalid reservation ID");
  return value;
}
export function key(value: string | undefined) {
  if (!value || !/^[\w-]{16,128}$/.test(value))
    throw new BadRequestException(
      "Idempotency-Key required (16–128 characters)",
    );
  return value;
}
export function date(value: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value
  )
    throw new BadRequestException("Invalid date");
  return value;
}
export function integer(value: unknown, name: string, max = 50) {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > max
  )
    throw new BadRequestException(`Invalid ${name}`);
  return value;
}
const schedule = `SELECT generate_series(
  ($1::date+v.opens_at) AT TIME ZONE v.time_zone,
  (($1::date+v.closes_at) AT TIME ZONE v.time_zone)-make_interval(mins=>v.duration_minutes),
  make_interval(mins=>v.slot_minutes)) AS starts_at FROM venues v WHERE v.id=$2`;
@Injectable()
export class CafeBooking {
  constructor(
    @Inject(Database) private readonly db: Database,
    @Inject(Access) private readonly access: Access,
    @Inject("BOOKING_SECRET") private readonly secret: string,
  ) {}
  private async venue(slug: string) {
    const { rows } = await this.db.query("SELECT * FROM venues WHERE slug=$1", [
      slug,
    ]);
    if (!rows[0]) throw new NotFoundException("Venue not found");
    return rows[0];
  }
  private async validDay(day: string, venue: Row, tx?: Transaction) {
    date(day);
    const sql = `SELECT $1::date BETWEEN (now() AT TIME ZONE $2)::date AND (now() AT TIME ZONE $2)::date+30 AS valid`;
    const values = [day, venue.time_zone];
    const { rows } = tx
      ? await tx.query(sql, values)
      : await this.db.query(sql, values);
    if (!rows[0]?.valid)
      throw new BadRequestException("Choose a date within the next 30 days");
  }
  async availability(
    slug: string,
    day: string,
    tableId: number,
    guests: number,
  ): Promise<Availability> {
    integer(tableId, "table", 100000);
    integer(guests, "party size");
    const venue = await this.venue(slug);
    await this.validDay(day, venue);
    const { rows: tables } = await this.db.query(
      "SELECT * FROM cafe_tables WHERE venue_id=$1 AND table_id=$2",
      [venue.id, tableId],
    );
    const table = tables[0];
    if (!table) throw new NotFoundException("Table not found");
    if (guests > table.capacity)
      throw new BadRequestException("Party exceeds table capacity");
    const { rows } = await this.db.query(
      `WITH slots AS (${schedule})
      SELECT s.starts_at,s.starts_at+make_interval(mins=>$3) AS ends_at,
        s.starts_at>now() AND NOT EXISTS(SELECT 1 FROM reservations r WHERE r.venue_id=$2 AND r.table_id=$4
          AND (r.status IN ('confirmed','checked_in') OR (r.status='held' AND r.expires_at>now()))
          AND tstzrange(r.starts_at,r.ends_at,'[)') && tstzrange(s.starts_at,s.starts_at+make_interval(mins=>$3),'[)')) AS available,
        to_char(s.starts_at AT TIME ZONE $5,'HH24:MI') AS label FROM slots s ORDER BY s.starts_at`,
      [day, venue.id, venue.duration_minutes, tableId, venue.time_zone],
    );
    return {
      venue: { slug: venue.slug, name: venue.name, timeZone: venue.time_zone },
      date: day,
      table: { id: tableId, capacity: table.capacity },
      durationMinutes: venue.duration_minutes,
      holdMinutes: 5,
      slots: rows.map((row) => ({
        startsAt: row.starts_at.toISOString(),
        endsAt: row.ends_at.toISOString(),
        label: row.label,
        available: row.available,
      })),
    };
  }
  async hold(
    slug: string,
    input: HoldInput,
    idempotencyKey: string,
  ): Promise<HoldResult> {
    key(idempotencyKey);
    integer(input.tableId, "table", 100000);
    integer(input.guests, "party size");
    if (
      typeof input.startsAt !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(input.startsAt) ||
      !Number.isFinite(Date.parse(input.startsAt))
    )
      throw new BadRequestException("Invalid start time");
    const startsAt = new Date(input.startsAt).toISOString();
    const requestHash = fingerprint({
      tableId: input.tableId,
      startsAt,
      guests: input.guests,
    });
    const venue = await this.venue(slug);
    const accessToken = createHmac("sha256", this.secret)
      .update(`${venue.id}:${idempotencyKey}`)
      .digest("base64url");
    try {
      const reservation = await this.db.transaction(async (tx) => {
        const { rows: tables } = await tx.query(
          "SELECT * FROM cafe_tables WHERE venue_id=$1 AND table_id=$2 FOR UPDATE",
          [venue.id, input.tableId],
        );
        if (!tables[0]) throw new NotFoundException("Table not found");
        if (input.guests > tables[0].capacity)
          throw new BadRequestException("Party exceeds table capacity");
        const { rows: previous } = await tx.query(
          `${SELECT} WHERE r.venue_id=$1 AND r.hold_key=$2`,
          [venue.id, idempotencyKey],
        );
        if (previous[0]) {
          if (previous[0].request_hash !== requestHash)
            throw new ConflictException(
              "Idempotency key reused with different input",
            );
          return present(previous[0]);
        }
        const { rows: days } = await tx.query(
          "SELECT ($1::timestamptz AT TIME ZONE $2)::date::text AS day",
          [startsAt, venue.time_zone],
        );
        const day = days[0]!.day;
        await this.validDay(day, venue, tx);
        const { rows: valid } = await tx.query(
          `WITH slots AS (${schedule}) SELECT 1 FROM slots WHERE starts_at=$3::timestamptz AND starts_at>now()`,
          [day, venue.id, startsAt],
        );
        if (!valid[0])
          throw new BadRequestException(
            "Time is outside bookable hours or in the past",
          );
        await tx.query(
          "UPDATE reservations SET status='expired',updated_at=now() WHERE venue_id=$1 AND table_id=$2 AND status='held' AND expires_at<=now()",
          [venue.id, input.tableId],
        );
        const { rows: clashes } = await tx.query(
          `SELECT 1 FROM reservations WHERE venue_id=$1 AND table_id=$2 AND status IN ('held','confirmed','checked_in')
          AND tstzrange(starts_at,ends_at,'[)') && tstzrange($3::timestamptz,$3::timestamptz+make_interval(mins=>$4),'[)')`,
          [venue.id, input.tableId, startsAt, venue.duration_minutes],
        );
        if (clashes[0])
          throw new ConflictException("This table is no longer available");
        const { rows: inserted } = await tx.query(
          `INSERT INTO reservations(code,venue_id,table_id,guests,starts_at,ends_at,status,expires_at,token_hash,hold_key,request_hash)
          VALUES($1,$2,$3,$4,$5,$5::timestamptz+make_interval(mins=>$6),'held',clock_timestamp()+interval '5 minutes',$7,$8,$9) RETURNING id`,
          [
            randomBytes(6).toString("hex").toUpperCase(),
            venue.id,
            input.tableId,
            input.guests,
            startsAt,
            venue.duration_minutes,
            hash(accessToken),
            idempotencyKey,
            requestHash,
          ],
        );
        await tx.query(
          "INSERT INTO reservation_events(reservation_id,action) VALUES($1,'held')",
          [inserted[0]!.id],
        );
        return present(
          (await tx.query(`${SELECT} WHERE r.id=$1`, [inserted[0]!.id]))
            .rows[0]!,
        );
      });
      return { reservation, accessToken };
    } catch (error) {
      if (
        (error as { code?: string }).code === "23P01" ||
        (error as { code?: string }).code === "23505"
      )
        throw new ConflictException("Table or idempotency key already used");
      throw error;
    }
  }
  private async guest(id: string, token: string) {
    uuid(id);
    if (!/^[\w-]{43}$/.test(token))
      throw new UnauthorizedException("Reservation access required");
    const { rows } = await this.db.query(
      `${SELECT} WHERE r.id=$1 AND r.token_hash=$2`,
      [id, hash(token)],
    );
    if (!rows[0]) throw new NotFoundException("Reservation not found");
    return rows[0];
  }
  async track(id: string, token: string) {
    return present(await this.guest(id, token));
  }
  async confirm(
    id: string,
    token: string,
    input: ConfirmInput,
    commandKey: string,
  ) {
    const row = await this.guest(id, token);
    if (
      typeof input.guestName !== "string" ||
      input.guestName.trim().length < 2 ||
      input.guestName.trim().length > 100 ||
      typeof input.guestPhone !== "string" ||
      !/^\+?[0-9]{8,15}$/.test(input.guestPhone)
    )
      throw new BadRequestException("Provide a name and valid phone number");
    const contact = {
      guestName: input.guestName.trim(),
      guestPhone: input.guestPhone,
    };
    return this.mutate(
      row,
      "confirm",
      commandKey,
      contact,
      null,
      async (tx) => {
        await tx.query(
          "UPDATE reservations SET status='confirmed',guest_name=$2,guest_phone=$3,updated_at=now() WHERE id=$1",
          [id, contact.guestName, contact.guestPhone],
        );
      },
    );
  }
  async cancel(id: string, token: string, commandKey: string) {
    return this.mutate(
      await this.guest(id, token),
      "cancel",
      commandKey,
      {},
      null,
      async (tx) => {
        await tx.query(
          "UPDATE reservations SET status='cancelled',updated_at=now() WHERE id=$1",
          [id],
        );
      },
    );
  }
  async list(userId: string, slug: string, day: string) {
    date(day);
    const venueId = await this.access.authorize(userId, slug);
    const { rows } = await this.db.query(
      `${SELECT} WHERE r.venue_id=$1 AND (r.starts_at AT TIME ZONE v.time_zone)::date=$2::date
      AND r.status<>'held' AND r.status<>'expired' ORDER BY r.starts_at,r.table_id`,
      [venueId, day],
    );
    return rows.map(present);
  }
  async staffAction(
    userId: string,
    id: string,
    action: "cancel" | "check-in",
    commandKey: string,
  ) {
    uuid(id);
    const row = (await this.db.query(`${SELECT} WHERE r.id=$1`, [id])).rows[0];
    if (!row) throw new NotFoundException("Reservation not found");
    await this.access.authorize(userId, row.slug);
    return this.mutate(row, action, commandKey, {}, userId, async (tx) => {
      await tx.query(
        "UPDATE reservations SET status=$2,updated_at=now() WHERE id=$1",
        [id, action === "cancel" ? "cancelled" : "checked_in"],
      );
    });
  }
  private async mutate(
    row: Row,
    action: string,
    commandKey: string,
    input: unknown,
    staffId: string | null,
    apply: (tx: Transaction) => Promise<void>,
  ) {
    key(commandKey);
    return this.db.transaction(async (tx) => {
      // Always lock the physical table first, then the booking: all allocation writes use this order.
      await tx.query(
        "SELECT 1 FROM cafe_tables WHERE venue_id=$1 AND table_id=$2 FOR UPDATE",
        [row.venue_id, row.table_id],
      );
      const current = (
        await tx.query(`${SELECT} WHERE r.id=$1 FOR UPDATE OF r`, [row.id])
      ).rows[0]!;
      const { rows: previous } = await tx.query(
        "SELECT * FROM reservation_commands WHERE reservation_id=$1 AND action=$2 AND key=$3",
        [row.id, action, commandKey],
      );
      const requestHash = fingerprint({ input, staffId });
      if (previous[0]) {
        if (previous[0].request_hash !== requestHash)
          throw new ConflictException(
            "Idempotency key reused with different input",
          );
        return previous[0].result as Reservation;
      }
      const status = present(current).status;
      if (status === "expired")
        throw new GoneException("The table hold has expired");
      if (action === "confirm" && status !== "held")
        throw new ConflictException("Reservation can no longer be confirmed");
      if (action === "cancel" && !["held", "confirmed"].includes(status))
        throw new ConflictException("Reservation can no longer be cancelled");
      if (action === "check-in") {
        if (status !== "confirmed")
          throw new ConflictException(
            "Only confirmed reservations can check in",
          );
        const { rows: window } = await tx.query(
          "SELECT now() BETWEEN $1::timestamptz-interval '30 minutes' AND $2::timestamptz AS allowed",
          [current.starts_at, current.ends_at],
        );
        if (!window[0]?.allowed)
          throw new ConflictException(
            "Check-in opens 30 minutes before the visit and closes at its end",
          );
      }
      if (action === "confirm" && current.starts_at <= new Date())
        throw new ConflictException("Reservation time has passed");
      await apply(tx);
      const result = present(
        (await tx.query(`${SELECT} WHERE r.id=$1`, [row.id])).rows[0]!,
      );
      await tx.query(
        "INSERT INTO reservation_commands(reservation_id,action,key,request_hash,result) VALUES($1,$2,$3,$4,$5)",
        [row.id, action, commandKey, requestHash, JSON.stringify(result)],
      );
      await tx.query(
        "INSERT INTO reservation_events(reservation_id,action,staff_user_id) VALUES($1,$2,$3)",
        [row.id, action, staffId],
      );
      return result;
    });
  }
}
