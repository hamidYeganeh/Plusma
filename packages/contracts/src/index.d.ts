/** HTTP data only. Domain rules stay in their owning backend module. */
export type ReservationStatus =
  "held" | "confirmed" | "checked_in" | "cancelled" | "expired";
export type Reservation = {
  id: string;
  code: string;
  venueSlug: string;
  venueName: string;
  timeZone: string;
  tableId: number;
  guests: number;
  startsAt: string;
  endsAt: string;
  status: ReservationStatus;
  expiresAt: string | null;
  guestName: string | null;
  guestPhone: string | null;
};
export type Availability = {
  venue: { slug: string; name: string; timeZone: string };
  date: string;
  table: { id: number; capacity: number };
  durationMinutes: number;
  holdMinutes: number;
  slots: {
    startsAt: string;
    endsAt: string;
    label: string;
    available: boolean;
  }[];
};
export type HoldInput = { tableId: number; startsAt: string; guests: number };
export type HoldResult = { reservation: Reservation; accessToken: string };
export type ConfirmInput = { guestName: string; guestPhone: string };
export type StaffSession = {
  user: { id: string; name: string; email: string };
  venues: {
    id: string;
    slug: string;
    name: string;
    organizationId: string;
    role: "owner" | "staff";
  }[];
};
export type ApiError = { statusCode: number; message: string; error?: string };

/** Cafe operations amounts are integer IRR; presentation may display toman (IRR / 10). */
export type CafeMenuItem = {
  id: string;
  name: string;
  category: string;
  priceRials: number;
  isAvailable: boolean;
  version: number;
};
export type CafeMenuInput = Omit<CafeMenuItem, "version">;
export type CafeOrderStatus =
  "placed" | "preparing" | "ready" | "served" | "cancelled";
export type CafeOrderInput = {
  reservationId: string;
  items: { menuItemId: string; quantity: number; version: number }[];
};
export type CafeOrder = {
  id: string;
  code: string;
  reservationId: string;
  tableId: number;
  guestName: string;
  status: CafeOrderStatus;
  totalRials: number;
  createdAt: string;
  items: {
    menuItemId: string;
    name: string;
    quantity: number;
    unitPriceRials: number;
  }[];
};
