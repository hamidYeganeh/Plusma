"use client";

import { CheckIcon, FootprintsIcon, UsersIcon, XIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import { Badge } from "@repo/ui/components/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { ToggleGroup, ToggleGroupItem } from "@repo/ui/components/toggle-group";
import { ReservationPreview } from "@/modules/reservations/reservation-preview";
import type { CafeTable } from "@/modules/cafes/catalog";

type Props = {
  cafeName: string;
  tables: readonly CafeTable[];
  onReservationChange: (active: boolean) => void;
  open: boolean;
  selectedId: number | null;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: number) => void;
  onView: (id: number) => void;
};

export function TablePanel({
  cafeName,
  onReservationChange,
  tables,
  open,
  selectedId,
  onOpenChange,
  onSelect,
  onView,
}: Props) {
  const t = useTranslations("Tables"),
    common = useTranslations("Common");
  const format = useFormatter();
  const selected = tables.find((table) => table.id === selectedId);
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent
        className="table-panel"
        placement="docked"
        showCloseButton={false}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          const target = event.target;
          if (
            target instanceof Element &&
            target.closest(
              ".scene-canvas,.table-marker,.table-select-trigger,.minimap-panel",
            )
          )
            event.preventDefault();
        }}
      >
        <DialogHeader>
          <div className="table-panel-heading">
            <Badge variant="secondary">{t("eyebrow")}</Badge>
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label={common("close")}
              onClick={() => onOpenChange(false)}
            >
              <XIcon />
            </Button>
          </div>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <ToggleGroup
          type="single"
          dir="rtl"
          variant="outline"
          className="table-options"
          value={selectedId === null ? "" : String(selectedId)}
          onValueChange={(value) => {
            if (value) onSelect(Number(value));
          }}
          aria-label={t("title")}
        >
          {tables.map((table) => (
            <ToggleGroupItem
              key={table.id}
              value={String(table.id)}
              aria-label={t("label", {
                number: table.id,
                capacity: table.capacity,
              })}
              className="table-option"
            >
              <span>{t("tableNumber", { number: table.id })}</span>
              <small>
                <UsersIcon aria-hidden="true" />
                {format.number(table.capacity)}
              </small>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {selected ? (
          <div className="table-selected" aria-live="polite">
            <div>
              <span className="selected-check">
                <CheckIcon aria-hidden="true" />
              </span>
              <div>
                <h3>{t("tableNumber", { number: selected.id })}</h3>
                <p>
                  {selected.zone} ·{" "}
                  {t("capacity", { count: selected.capacity })}
                </p>
              </div>
            </div>
            <ReservationPreview
              cafeName={cafeName}
              table={selected}
              onActiveChange={onReservationChange}
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onView(selected.id)}
            >
              <FootprintsIcon data-icon="inline-start" />
              {t("view")}
            </Button>
          </div>
        ) : (
          <p className="table-empty">{t("hint")}</p>
        )}
        <p className="table-demo-note">{t("demoNote")}</p>
      </DialogContent>
    </Dialog>
  );
}
