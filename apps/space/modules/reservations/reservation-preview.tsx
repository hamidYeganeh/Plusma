"use client";

import { useId, useState } from "react";
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
import type { CafeTable } from "@/modules/cafes/catalog";
import { DEMO_TIMES, visitDays, validDemoChoice } from "./demo-options.js";

type Props = {
  cafeName: string;
  table: CafeTable;
  onActiveChange: (active: boolean) => void;
};

/** Local preview only. No guest identity, persistence, submission or availability claims. */
export function ReservationPreview({ cafeName, table, onActiveChange }: Props) {
  const t = useTranslations("Reservation"),
    common = useTranslations("Common"),
    tableText = useTranslations("Tables");
  const format = useFormatter(),
    id = useId();
  const [open, setOpen] = useState(false),
    [review, setReview] = useState(false);
  const [days, setDays] = useState(() => visitDays());
  const [day, setDay] = useState(days[0]!.id),
    [time, setTime] = useState("");
  const [guests, setGuests] = useState(Math.min(2, table.capacity));
  const chosenDate = days.find((option) => option.id === day)!.date;
  const dateLabel = (date: Date) =>
    format.dateTime(date, {
      calendar: "persian",
      month: "long",
      day: "numeric",
    });
  function changeOpen(value: boolean) {
    if (value) {
      const next = visitDays();
      setDays(next);
      setDay(next[0]!.id);
      setTime("");
      setGuests(Math.min(2, table.capacity));
      setReview(false);
    }
    setOpen(value);
    onActiveChange(value);
  }
  const valid = validDemoChoice({ day, time, guests }, table.capacity);
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
            <Badge variant="secondary">{common("demo")}</Badge>
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
            {review ? t("reviewTitle") : t("title", { number: table.id })}
          </DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="reservation-table">
          <span>
            {cafeName} · {tableText("tableNumber", { number: table.id })}
          </span>
          <span>
            {table.zone} · {tableText("capacity", { count: table.capacity })}
          </span>
        </div>
        {review ? (
          <>
            <dl className="reservation-summary">
              <div>
                <dt>{t("day")}</dt>
                <dd>{dateLabel(chosenDate)}</dd>
              </div>
              <div>
                <dt>{t("time")}</dt>
                <dd dir="ltr">{format.number(Number(time.slice(0, 2)))}:۰۰</dd>
              </div>
              <div>
                <dt>{t("guests")}</dt>
                <dd>{t("people", { count: guests })}</dd>
              </div>
            </dl>
            <Alert role="status">
              <InfoIcon />
              <AlertDescription>{t("reviewNote")}</AlertDescription>
            </Alert>
            <div className="reservation-actions">
              <Button variant="tactile" onClick={() => changeOpen(false)}>
                {t("back")}
              </Button>
              <Button variant="outline" onClick={() => setReview(false)}>
                {t("edit")}
              </Button>
            </div>
          </>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (valid) setReview(true);
            }}
            className="reservation-form"
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
                    if (value) setDay(value);
                  }}
                  aria-labelledby={`${id}-day`}
                >
                  {days.map((option, index) => (
                    <ToggleGroupItem key={option.id} value={option.id}>
                      <span>
                        {t(
                          index === 0
                            ? "today"
                            : index === 1
                              ? "tomorrow"
                              : "dayAfter",
                        )}
                      </span>
                      <small>{dateLabel(option.date)}</small>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>
              <Field>
                <FieldLabel id={`${id}-time`}>{t("time")}</FieldLabel>
                <ToggleGroup
                  type="single"
                  dir="rtl"
                  variant="outline"
                  className="reservation-times"
                  value={time}
                  onValueChange={(value) => {
                    if (value) setTime(value);
                  }}
                  aria-labelledby={`${id}-time`}
                >
                  {DEMO_TIMES.map((option) => (
                    <ToggleGroupItem
                      key={option}
                      value={option}
                      aria-label={option}
                    >
                      <span dir="ltr">
                        {format.number(Number(option.slice(0, 2)))}:۰۰
                      </span>
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
                    if (value) setGuests(Number(value));
                  }}
                  aria-labelledby={`${id}-guests`}
                >
                  {Array.from(
                    { length: table.capacity },
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
            </FieldGroup>
            <p className="table-demo-note">{t("timesNote")}</p>
            <Button
              type="submit"
              variant="tactile"
              disabled={!valid}
              className="w-full"
            >
              {t("preview")}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
