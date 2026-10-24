"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CalendarDaysIcon, InfoIcon, XIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import { Badge } from "@repo/ui/components/badge";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { Field, FieldGroup, FieldLabel } from "@repo/ui/components/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { ToggleGroup, ToggleGroupItem } from "@repo/ui/components/toggle-group";
import type { Availability, Reservation } from "@repo/contracts";
import type { CafeTable } from "@/modules/cafe";
import { BookingRequestError, createBookingClient } from "./booking-client";
import { visitDays } from "./booking-dates";
import { normalizeGuestPhone } from "./booking-contact";

type Props = {
  cafeSlug: string;
  cafeName: string;
  table: CafeTable;
  onActiveChange: (active: boolean) => void;
};
type Client = ReturnType<typeof createBookingClient>;

/** The reservation module owns all network/session state; the scene only pauses. */
export function ReservationDialog({
  cafeSlug,
  cafeName,
  table,
  onActiveChange,
}: Props) {
  const t = useTranslations("Reservation"),
    common = useTranslations("Common"),
    tableText = useTranslations("Tables");
  const format = useFormatter(),
    id = useId();
  const client = useRef<Client | null>(null),
    availabilityRequest = useRef(0);
  const [open, setOpen] = useState(false),
    [days, setDays] = useState(() => visitDays());
  const [day, setDay] = useState(days[0]!.id),
    [startsAt, setStartsAt] = useState("");
  const [guests, setGuests] = useState(Math.min(2, table.capacity));
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [busy, setBusy] = useState(false),
    [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [error, setError] = useState(""),
    [now, setNow] = useState(() => Date.now());
  const [guestName, setGuestName] = useState(""),
    [guestPhone, setGuestPhone] = useState("");
  const normalizedPhone = normalizeGuestPhone(guestPhone);
  const phoneValid = /^\+?[0-9]{8,15}$/.test(normalizedPhone);
  const timeZone =
    reservation?.timeZone ?? availability?.venue.timeZone ?? "Asia/Tehran";
  const [pending, setPending] =
    useState<ReturnType<Client["pendingAction"]>>(null);
  const remaining = reservation?.expiresAt
    ? Math.max(0, Math.ceil((Date.parse(reservation.expiresAt) - now) / 1000))
    : 0;
  const held = reservation?.status === "held",
    terminal =
      reservation?.status === "expired" || reservation?.status === "cancelled";
  const capacity = Math.min(
    table.capacity,
    availability?.table.capacity ?? table.capacity,
  );
  const inputClass =
    "h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";
  function describeError(value: unknown) {
    if (value instanceof BookingRequestError) {
      if (value.status === 409 || value.status === 410) return t("conflict");
      if (value.status === 400 || value.status === 422) return t("invalid");
      if (value.status === 401 || value.status === 403)
        return t("accessDenied");
      if (value.status === 404) return t("notFound");
      if (value.status === 429) return t("rateLimited");
    }
    return t("unavailable");
  }
  async function loadAvailability(nextDay: string, nextGuests: number) {
    const request = ++availabilityRequest.current;
    setAvailabilityLoading(true);
    setAvailability(null);
    setStartsAt("");
    setError("");
    try {
      const result = await client.current!.availability(nextDay, nextGuests);
      if (request === availabilityRequest.current) setAvailability(result);
    } catch (value) {
      if (request === availabilityRequest.current)
        setError(describeError(value));
    } finally {
      if (request === availabilityRequest.current)
        setAvailabilityLoading(false);
    }
  }
  async function refresh() {
    setBusy(true);
    setError("");
    try {
      const result = await client.current!.refresh();
      setReservation(result);
      if (!result) await loadAvailability(day, guests);
    } catch (value) {
      setError(describeError(value));
    } finally {
      setPending(client.current?.pendingAction() ?? null);
      setBusy(false);
    }
  }
  function changeOpen(value: boolean) {
    setOpen(value);
    onActiveChange(value);
    if (!value) return;
    let storage: Storage | undefined;
    try {
      storage = window.sessionStorage;
    } catch {
      /* Browser storage can be disabled. */
    }
    client.current ??= createBookingClient({
      venueSlug: cafeSlug,
      tableId: table.id,
      storage,
    });
    setPending(client.current.pendingAction());
    const nextDays = visitDays();
    setDays(nextDays);
    setDay(nextDays[0]!.id);
    setStartsAt("");
    setNow(Date.now());
    setError("");
    setBusy(true);
    client.current
      .refresh()
      .then(async (result) => {
        setReservation(result);
        if (!result) await loadAvailability(nextDays[0]!.id, guests);
      })
      .catch((value: unknown) => setError(describeError(value)))
      .finally(() => {
        setPending(client.current?.pendingAction() ?? null);
        setBusy(false);
      });
  }
  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [open]);
  useEffect(() => () => onActiveChange(false), [onActiveChange]);
  async function mutate(action: "hold" | "confirm" | "cancel") {
    setBusy(true);
    setError("");
    try {
      const result = await (action === "hold"
        ? client.current!.hold(startsAt, guests)
        : action === "confirm"
          ? client.current!.confirm({
              guestName: guestName.trim(),
              guestPhone: normalizedPhone,
            })
          : client.current!.cancel());
      setReservation(result);
      setNow(Date.now());
    } catch (value) {
      setError(describeError(value));
    } finally {
      setPending(client.current?.pendingAction() ?? null);
      setBusy(false);
    }
  }
  function startOver() {
    if (!client.current!.startOver()) return;
    setReservation(null);
    setPending(null);
    setGuestName("");
    setGuestPhone("");
    void loadAvailability(day, guests);
  }
  const dateLabel = (date: Date) =>
    format.dateTime(date, {
      calendar: "persian",
      month: "long",
      day: "numeric",
      timeZone,
    });
  const timeLabel = (value: string) =>
    format.dateTime(new Date(value), {
      hour: "2-digit",
      minute: "2-digit",
      timeZone,
    });
  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button variant="tactile" className="w-full">
          <CalendarDaysIcon data-icon="inline-start" />
          {t("action")}
        </Button>
      </DialogTrigger>
      <DialogContent className="reservation-dialog" showCloseButton={false}>
        <DialogHeader>
          <div className="table-panel-heading">
            <Badge variant="secondary">
              {reservation ? t(`status.${reservation.status}`) : t("eyebrow")}
            </Badge>
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label={common("close")}
              onClick={() => changeOpen(false)}
            >
              <XIcon />
            </Button>
          </div>
          <DialogTitle>
            {reservation
              ? held
                ? t("contactTitle")
                : t("trackingTitle")
              : t("title", { number: table.id })}
          </DialogTitle>
          <DialogDescription>
            {reservation
              ? held
                ? t("heldDescription")
                : t("trackingDescription")
              : t("description")}
          </DialogDescription>
        </DialogHeader>
        <div className="reservation-table">
          <span>
            {cafeName} · {tableText("tableNumber", { number: table.id })}
          </span>
          <span>
            {table.zone} · {tableText("capacity", { count: capacity })}
          </span>
        </div>
        {error && (
          <Alert variant="destructive" role="alert">
            <InfoIcon />
            <AlertDescription>
              {error}
              {pending && <span>{t("uncertain")}</span>}
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Button
            variant="outline"
            disabled={busy || availabilityLoading}
            onClick={() => {
              void refresh();
            }}
          >
            {t("retry")}
          </Button>
        )}
        {busy && (
          <p role="status" className="table-demo-note">
            {t("loading")}
          </p>
        )}
        {reservation ? (
          <>
            <dl className="reservation-summary">
              <div>
                <dt>{t("day")}</dt>
                <dd>{dateLabel(new Date(reservation.startsAt))}</dd>
              </div>
              <div>
                <dt>{t("time")}</dt>
                <dd dir="ltr">
                  {timeLabel(reservation.startsAt)} –{" "}
                  {timeLabel(reservation.endsAt)}
                </dd>
              </div>
              <div>
                <dt>{t("guests")}</dt>
                <dd>{t("people", { count: reservation.guests })}</dd>
              </div>
              <div>
                <dt>{t("code")}</dt>
                <dd dir="ltr">{reservation.code}</dd>
              </div>
              {reservation.guestName && (
                <div>
                  <dt>{t("guestName")}</dt>
                  <dd>{reservation.guestName}</dd>
                </div>
              )}
            </dl>
            {held && (
              <Alert role="status">
                <InfoIcon />
                <AlertDescription>
                  {remaining > 0
                    ? t("expires", {
                        minutes: Math.floor(remaining / 60),
                        seconds: remaining % 60,
                      })
                    : t("expiredNote")}
                </AlertDescription>
              </Alert>
            )}
            {held && remaining > 0 && (
              <form
                className="reservation-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void mutate("confirm");
                }}
              >
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor={`${id}-name`}>
                      {t("guestName")}
                    </FieldLabel>
                    <input
                      id={`${id}-name`}
                      name="name"
                      autoComplete="name"
                      className={inputClass}
                      required
                      minLength={2}
                      maxLength={100}
                      value={guestName}
                      onChange={(event) => setGuestName(event.target.value)}
                      disabled={busy || !!pending}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`${id}-phone`}>
                      {t("guestPhone")}
                    </FieldLabel>
                    <input
                      id={`${id}-phone`}
                      name="tel"
                      type="tel"
                      dir="ltr"
                      autoComplete="tel"
                      inputMode="tel"
                      className={inputClass}
                      required
                      minLength={8}
                      maxLength={32}
                      value={guestPhone}
                      onChange={(event) => setGuestPhone(event.target.value)}
                      disabled={busy || !!pending}
                    />
                  </Field>
                </FieldGroup>
                <p className="table-demo-note">{t("privacy")}</p>
                <Button
                  type="submit"
                  variant="tactile"
                  disabled={
                    busy ||
                    !!pending ||
                    guestName.trim().length < 2 ||
                    !phoneValid
                  }
                >
                  {t("confirm")}
                </Button>
              </form>
            )}
            {reservation.status === "confirmed" && (
              <Alert role="status">
                <InfoIcon />
                <AlertDescription>{t("confirmedNote")}</AlertDescription>
              </Alert>
            )}
            {terminal && (
              <p role="status" className="table-demo-note">
                {t(
                  reservation.status === "expired"
                    ? "expiredNote"
                    : "cancelledNote",
                )}
              </p>
            )}
            <p className="table-demo-note">{t("trackingNote")}</p>
            <div className="reservation-actions">
              {terminal && (
                <Button
                  variant="tactile"
                  disabled={busy || !!pending}
                  onClick={startOver}
                >
                  {t("newBooking")}
                </Button>
              )}
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => {
                  void refresh();
                }}
              >
                {t("refresh")}
              </Button>
              {(held || reservation.status === "confirmed") && (
                <Button
                  variant="outline"
                  disabled={busy || !!pending}
                  onClick={() => {
                    void mutate("cancel");
                  }}
                >
                  {t(held ? "release" : "cancel")}
                </Button>
              )}
              <Button variant="ghost" onClick={() => changeOpen(false)}>
                {t("back")}
              </Button>
            </div>
          </>
        ) : (
          <form
            className="reservation-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (startsAt) void mutate("hold");
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel id={`${id}-day`}>{t("day")}</FieldLabel>
                <ToggleGroup
                  type="single"
                  dir="rtl"
                  variant="outline"
                  className="reservation-days"
                  value={day}
                  onValueChange={(value) => {
                    if (value && value !== day) {
                      setDay(value);
                      void loadAvailability(value, guests);
                    }
                  }}
                  aria-labelledby={`${id}-day`}
                  disabled={busy || !!pending}
                >
                  {days.map((option, index) => (
                    <ToggleGroupItem key={option.id} value={option.id}>
                      <span>
                        {index < 2
                          ? t(index === 0 ? "today" : "tomorrow")
                          : format.dateTime(option.date, {
                              weekday: "long",
                              timeZone,
                            })}
                      </span>
                      <small>{dateLabel(option.date)}</small>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>
              <Field>
                <FieldLabel id={`${id}-guests`}>{t("guests")}</FieldLabel>
                <ToggleGroup
                  type="single"
                  dir="rtl"
                  variant="outline"
                  className="reservation-guests"
                  value={String(guests)}
                  onValueChange={(value) => {
                    if (value && Number(value) !== guests) {
                      setGuests(Number(value));
                      void loadAvailability(day, Number(value));
                    }
                  }}
                  aria-labelledby={`${id}-guests`}
                  disabled={busy || !!pending}
                >
                  {Array.from(
                    { length: capacity },
                    (_, index) => index + 1,
                  ).map((count) => (
                    <ToggleGroupItem
                      key={count}
                      value={String(count)}
                      aria-label={t("people", { count })}
                    >
                      {format.number(count)}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>
              <Field>
                <FieldLabel id={`${id}-time`}>{t("time")}</FieldLabel>
                {availabilityLoading ? (
                  <p role="status" className="table-demo-note">
                    {t("loadingSlots")}
                  </p>
                ) : (
                  <ToggleGroup
                    type="single"
                    dir="rtl"
                    variant="outline"
                    className="reservation-times"
                    value={startsAt}
                    onValueChange={(value) => {
                      if (value) setStartsAt(value);
                    }}
                    aria-labelledby={`${id}-time`}
                    disabled={busy || !!pending}
                  >
                    {availability?.slots.map((slot) => (
                      <ToggleGroupItem
                        key={slot.startsAt}
                        value={slot.startsAt}
                        disabled={!slot.available}
                        aria-label={`${timeLabel(slot.startsAt)}${slot.available ? "" : `، ${t("occupied")}`}`}
                      >
                        <span dir="ltr">{timeLabel(slot.startsAt)}</span>
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                )}
                {availability &&
                  !availability.slots.some((slot) => slot.available) && (
                    <p role="status" className="table-demo-note">
                      {t("noSlots")}
                    </p>
                  )}
              </Field>
            </FieldGroup>
            {availability && (
              <p className="table-demo-note">
                {t("timesNote", {
                  duration: availability.durationMinutes,
                  hold: availability.holdMinutes,
                })}
              </p>
            )}
            <Button
              type="submit"
              variant="tactile"
              className="w-full"
              disabled={
                busy ||
                availabilityLoading ||
                !!pending ||
                !availability?.slots.some(
                  (slot) => slot.available && slot.startsAt === startsAt,
                ) ||
                guests > capacity
              }
            >
              {t("hold")}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
