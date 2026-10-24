import type {
  Availability,
  ConfirmInput,
  HoldInput,
  HoldResult,
  Reservation,
} from "@repo/contracts";
import { normalizeGuestPhone } from "./booking-contact.ts";

type Mutation = {
  action: "hold" | "confirm" | "cancel";
  key: string;
  body: HoldInput | ConfirmInput | Record<string, never>;
};
type Capability = { id: string; accessToken: string };
type Session = { capability: Capability | null; pending: Mutation | null };
type Storage = Pick<globalThis.Storage, "getItem" | "setItem" | "removeItem">;
type Options = {
  venueSlug: string;
  tableId: number;
  storage?: Storage;
  fetch?: typeof globalThis.fetch;
  randomId?: () => string;
};

export class BookingRequestError extends Error {
  status: number;
  constructor(status: number) {
    super(`Booking request failed (${status})`);
    this.name = "BookingRequestError";
    this.status = status;
  }
}

/** Owns capability storage and mutation recovery; no token ever enters a URL. */
export function createBookingClient(options: Options) {
  const fetcher = options.fetch ?? globalThis.fetch;
  const randomId = options.randomId ?? (() => crypto.randomUUID());
  const storageKey = `plusma.booking.${encodeURIComponent(options.venueSlug)}.${options.tableId}`;
  let session: Session = { capability: null, pending: null };
  try {
    const saved = JSON.parse(options.storage?.getItem(storageKey) ?? "null");
    if (
      saved &&
      (saved.capability === null ||
        (typeof saved.capability?.id === "string" &&
          typeof saved.capability?.accessToken === "string")) &&
      (saved.pending === null ||
        (["hold", "confirm", "cancel"].includes(saved.pending?.action) &&
          typeof saved.pending?.key === "string" &&
          saved.pending?.body &&
          typeof saved.pending.body === "object"))
    )
      session = saved;
  } catch {
    // A blocked storage area or an old/corrupt session must not break booking.
  }
  let current: Reservation | null = null;
  let activeMutation: Promise<Reservation> | null = null;
  function save() {
    try {
      if (session.capability || session.pending)
        options.storage?.setItem(storageKey, JSON.stringify(session));
      else options.storage?.removeItem(storageKey);
    } catch {
      // The active tab still retains the capability when storage is unavailable.
    }
  }
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    let response: Response;
    try {
      response = await fetcher(`/api/v1${path}`, {
        ...init,
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
        headers: { Accept: "application/json", ...init?.headers },
      });
    } catch {
      throw new BookingRequestError(0);
    }
    if (!response.ok) throw new BookingRequestError(response.status);
    try {
      return (await response.json()) as T;
    } catch {
      // A truncated successful response is uncertain and must retain its key.
      throw new BookingRequestError(0);
    }
  }
  function authorization() {
    return { Authorization: `Bearer ${session.capability!.accessToken}` };
  }
  async function execute(mutation: Mutation): Promise<Reservation> {
    if (mutation.action !== "hold" && !session.capability)
      throw new BookingRequestError(401);
    session.pending = mutation;
    save();
    try {
      const isHold = mutation.action === "hold";
      const path = isHold
        ? `/public/venues/${encodeURIComponent(options.venueSlug)}/holds`
        : `/public/reservations/${encodeURIComponent(session.capability!.id)}/${mutation.action}`;
      const result = await request<HoldResult | Reservation>(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": mutation.key,
          ...(isHold ? {} : authorization()),
        },
        body: JSON.stringify(mutation.body),
      });
      if (isHold) {
        const held = result as HoldResult;
        session.capability = {
          id: held.reservation.id,
          accessToken: held.accessToken,
        };
        current = held.reservation;
      } else current = result as Reservation;
      session.pending = null;
      save();
      return current;
    } catch (error) {
      if (
        error instanceof BookingRequestError &&
        error.status >= 400 &&
        error.status < 500
      ) {
        session.pending = null;
        save();
      }
      throw error;
    }
  }
  function mutate(action: Mutation["action"], body: Mutation["body"]) {
    if (activeMutation) return activeMutation;
    // An uncertain operation must finish before a new booking intent starts.
    const mutation = session.pending ?? { action, key: randomId(), body };
    activeMutation = execute(mutation).finally(() => {
      activeMutation = null;
    });
    return activeMutation;
  }
  return {
    async availability(date: string, guests: number): Promise<Availability> {
      const query = new URLSearchParams({
        date,
        tableId: String(options.tableId),
        guests: String(guests),
      });
      return request(
        `/public/venues/${encodeURIComponent(options.venueSlug)}/availability?${query}`,
      );
    },
    async refresh(): Promise<Reservation | null> {
      if (activeMutation) await activeMutation;
      else if (session.pending)
        await mutate(session.pending.action, session.pending.body);
      if (!session.capability) return null;
      current = await request<Reservation>(
        `/public/reservations/${encodeURIComponent(session.capability.id)}`,
        { headers: authorization() },
      );
      return current;
    },
    hold(startsAt: string, guests: number) {
      return mutate("hold", { tableId: options.tableId, startsAt, guests });
    },
    confirm(input: ConfirmInput) {
      return mutate("confirm", {
        guestName: input.guestName.trim(),
        guestPhone: normalizeGuestPhone(input.guestPhone),
      });
    },
    cancel() {
      return mutate("cancel", {});
    },
    pendingAction() {
      return session.pending?.action ?? null;
    },
    startOver() {
      if (
        session.pending ||
        (current &&
          current.status !== "cancelled" &&
          current.status !== "expired")
      )
        return false;
      session = { capability: null, pending: null };
      current = null;
      save();
      return true;
    },
  };
}
