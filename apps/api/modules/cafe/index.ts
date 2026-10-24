import {
  Body,
  Controller,
  DynamicModule,
  Get,
  Headers,
  Inject,
  Module,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  BadRequestException,
  HttpException,
} from "@nestjs/common";
import type { Request } from "express";
import type {
  ConfirmInput,
  HoldInput,
  CafeMenuInput,
  CafeOrderInput,
  CafeOrderStatus,
} from "@repo/contracts";
import { StaffGuard, StaffRequest } from "../access";
import { Database } from "../database";
import { CafeBooking, integer, key } from "./booking";
import { CafeOrdering } from "./ordering";
function bearer(value: string | undefined) {
  return value?.startsWith("Bearer ") ? value.slice(7) : "";
}
function object(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new BadRequestException("JSON object required");
  return value;
}
@Controller("public")
class GuestController {
  constructor(
    @Inject(CafeBooking) private readonly booking: CafeBooking,
    @Inject(Database) private readonly db: Database,
    @Inject(CafeOrdering) private readonly ordering: CafeOrdering,
  ) {}
  @Get("venues/:slug/menu")
  menu(@Param("slug") slug: string) {
    return this.ordering.menu(slug);
  }
  @Get("venues/:slug/availability")
  availability(
    @Param("slug") slug: string,
    @Query("date") day: string,
    @Query("tableId") tableId: string,
    @Query("guests") guests: string,
  ) {
    return this.booking.availability(
      slug,
      day,
      integer(Number(tableId), "table", 100000),
      integer(Number(guests), "party size"),
    );
  }
  @Post("venues/:slug/holds")
  async hold(
    @Param("slug") slug: string,
    @Body() body: unknown,
    @Headers("idempotency-key") header: string,
    @Req() request: Request,
  ) {
    if (!(await this.db.limit(`hold:${request.ip}`, 60, 3600)))
      throw new HttpException("Too many holds. Try again later.", 429);
    return this.booking.hold(slug, object(body) as HoldInput, key(header));
  }
  @Get("reservations/:id")
  track(@Param("id") id: string, @Headers("authorization") auth: string) {
    return this.booking.track(id, bearer(auth));
  }
  @Post("reservations/:id/confirm")
  confirm(
    @Param("id") id: string,
    @Headers("authorization") auth: string,
    @Headers("idempotency-key") header: string,
    @Body() body: unknown,
  ) {
    return this.booking.confirm(
      id,
      bearer(auth),
      object(body) as ConfirmInput,
      key(header),
    );
  }
  @Post("reservations/:id/cancel")
  cancel(
    @Param("id") id: string,
    @Headers("authorization") auth: string,
    @Headers("idempotency-key") header: string,
  ) {
    return this.booking.cancel(id, bearer(auth), key(header));
  }
}
@Controller("staff")
@UseGuards(StaffGuard)
class StaffBookingsController {
  constructor(@Inject(CafeBooking) private readonly booking: CafeBooking) {}
  @Get("venues/:slug/reservations")
  list(
    @Req() request: StaffRequest,
    @Param("slug") slug: string,
    @Query("date") day: string,
  ) {
    return this.booking.list(request.staffId, slug, day);
  }
  @Post("reservations/:id/cancel")
  cancel(
    @Req() request: StaffRequest,
    @Param("id") id: string,
    @Headers("idempotency-key") header: string,
  ) {
    return this.booking.staffAction(request.staffId, id, "cancel", key(header));
  }
  @Post("reservations/:id/check-in")
  checkIn(
    @Req() request: StaffRequest,
    @Param("id") id: string,
    @Headers("idempotency-key") header: string,
  ) {
    return this.booking.staffAction(
      request.staffId,
      id,
      "check-in",
      key(header),
    );
  }
}
@Controller("staff")
@UseGuards(StaffGuard)
class StaffOrderingController {
  constructor(@Inject(CafeOrdering) private readonly ordering: CafeOrdering) {}
  @Get("venues/:slug/menu")
  menu(@Req() request: StaffRequest, @Param("slug") slug: string) {
    return this.ordering.menu(slug, request.staffId);
  }
  @Post("venues/:slug/menu/items")
  save(
    @Req() request: StaffRequest,
    @Param("slug") slug: string,
    @Body() body: unknown,
  ) {
    return this.ordering.saveItem(
      request.staffId,
      slug,
      object(body) as CafeMenuInput,
    );
  }
  @Post("venues/:slug/menu/items/:id")
  update(
    @Req() request: StaffRequest,
    @Param("slug") slug: string,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const input = object(body) as CafeMenuInput & { version: number };
    if (input.id !== id || input.version === undefined)
      throw new BadRequestException("Item identity and version required");
    return this.ordering.saveItem(request.staffId, slug, input, input.version);
  }
  @Get("venues/:slug/orders")
  list(
    @Req() request: StaffRequest,
    @Param("slug") slug: string,
    @Query("date") day: string,
  ) {
    return this.ordering.list(request.staffId, slug, day);
  }
  @Post("venues/:slug/orders")
  create(
    @Req() request: StaffRequest,
    @Param("slug") slug: string,
    @Body() body: unknown,
    @Headers("idempotency-key") header: string,
  ) {
    return this.ordering.create(
      request.staffId,
      slug,
      object(body) as CafeOrderInput,
      key(header),
    );
  }
  @Post("orders/:id/status")
  transition(
    @Req() request: StaffRequest,
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("idempotency-key") header: string,
  ) {
    return this.ordering.transition(
      request.staffId,
      id,
      (object(body) as { status: CafeOrderStatus }).status,
      key(header),
    );
  }
}
@Module({})
export class CafeModule {
  static forRoot(secret: string): DynamicModule {
    return {
      module: CafeModule,
      controllers: [
        GuestController,
        StaffBookingsController,
        StaffOrderingController,
      ],
      providers: [
        CafeBooking,
        CafeOrdering,
        { provide: "BOOKING_SECRET", useValue: secret },
      ],
    };
  }
}
