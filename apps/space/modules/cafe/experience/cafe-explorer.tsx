"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowRightIcon,
  ArrowUpLeftIcon,
  CameraIcon,
  DownloadIcon,
  CircleHelpIcon,
  FootprintsIcon,
  LayersIcon,
  LeafIcon,
  MaximizeIcon,
  MoonIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  SunIcon,
  XIcon,
  ArmchairIcon,
} from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Badge } from "@repo/ui/components/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { ToggleGroup, ToggleGroupItem } from "@repo/ui/components/toggle-group";
import { Separator } from "@repo/ui/components/separator";
import { Skeleton } from "@repo/ui/components/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Cafe } from "@/modules/cafe";
import type { ViewMode, Waypoint } from "@repo/spatial";
import type { Experience } from "@repo/spatial/runtime";
import { TablePanel } from "./table-panel";
import { CafeMenu } from "./cafe-menu";
import { IconSwap } from "@/components/icon-swap";
import { Joystick } from "@/modules/spatial";

export function CafeExplorer({ cafe }: { cafe: Cafe }) {
  const t = useTranslations("Explore"),
    common = useTranslations("Common");
  const canvas = useRef<HTMLCanvasElement>(null),
    map = useRef<HTMLCanvasElement>(null);
  const runtime = useRef<Experience | null>(null),
    alive = useRef(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [entered, setEntered] = useState(false),
    [mode, setMode] = useState<ViewMode>("walk");
  const [night, setNight] = useState(false),
    [touring, setTouring] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false),
    [notice, setNotice] = useState("");
  const [reservationOpen, setReservationOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [exporting, setExporting] = useState(false);
  const markers = useRef<HTMLDivElement>(null);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [tablePanelOpen, setTablePanelOpen] = useState(false);
  const settings = useRef({
    paused: true,
    night: false,
    mode: "walk" as ViewMode,
    touring: false,
    selectedTableId: null as number | null,
  });

  useEffect(() => {
    let cancelled = false,
      mounted: Experience | null = null;
    alive.current = true;
    Promise.all([
      import("@repo/spatial/runtime"),
      import("../scenes").then(({ loadCafeScene }) =>
        loadCafeScene(cafe.scene),
      ),
    ])
      .then(([{ mountExperience }, definition]) => {
        if (cancelled || !canvas.current || !map.current || !markers.current)
          return;
        mounted = mountExperience({
          definition,
          debug: process.env.NODE_ENV === "development",
          canvas: canvas.current,
          map: map.current,
          markers: new Map(
            cafe.tables.flatMap((table) => {
              const node = markers.current?.querySelector<HTMLButtonElement>(
                `[data-table-id="${table.id}"]`,
              );
              return node ? [[table.targetId, node] as const] : [];
            }),
          ),
          onTargetSelect: (targetId) => {
            const table = cafe.tables.find(
              (table) => table.targetId === targetId,
            );
            if (!table) return;
            setSelectedTableId(table.id);
            setTablePanelOpen(true);
          },
          onReady: () => {
            if (!cancelled) setStatus("ready");
          },
          onError: () => {
            if (!cancelled) setStatus("error");
          },
          onViewChange: setMode,
          onTourChange: setTouring,
        });
        mounted.setView(settings.current.mode);
        mounted.setNight(settings.current.night);
        mounted.selectTarget(
          cafe.tables.find(
            (table) => table.id === settings.current.selectedTableId,
          )?.targetId ?? null,
        );
        if (settings.current.touring) mounted.setTouring(true);
        mounted.setPaused(settings.current.paused);
        runtime.current = mounted;
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
      alive.current = false;
      runtime.current = null;
      mounted?.dispose();
    };
  }, [cafe.scene, cafe.tables, attempt]);
  useEffect(() => {
    const paused =
      !entered || helpOpen || reservationOpen || menuOpen || status !== "ready";
    settings.current = { paused, night, mode, touring, selectedTableId };
    runtime.current?.setPaused(paused);
  }, [
    entered,
    helpOpen,
    reservationOpen,
    menuOpen,
    status,
    night,
    mode,
    touring,
    selectedTableId,
  ]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);
  function enter() {
    setEntered(true);
    runtime.current?.setPaused(false);
    canvas.current?.focus({ preventScroll: true });
  }
  async function takePhoto() {
    const blob = await runtime.current?.capture();
    if (!alive.current) return;
    if (!blob) {
      setNotice(t("actionFailed"));
      return;
    }
    const url = URL.createObjectURL(blob),
      link = document.createElement("a");
    link.href = url;
    link.download = `${cafe.slug}-${night ? "night" : "day"}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(t("photoSaved"));
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (canvas.current?.parentElement?.requestFullscreen)
        await canvas.current.parentElement.requestFullscreen();
      else setNotice(t("actionFailed"));
    } catch {
      setNotice(t("actionFailed"));
    }
  }
  async function downloadModel() {
    setExporting(true);
    try {
      const blob = await runtime.current?.exportModel();
      if (!alive.current) return;
      if (!blob) throw new Error("Model export failed");
      const url = URL.createObjectURL(blob),
        link = document.createElement("a");
      link.href = url;
      link.download = `${cafe.slug}.glb`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      if (alive.current) setNotice(t("actionFailed"));
    } finally {
      if (alive.current) setExporting(false);
    }
  }
  function chooseTable(id: number) {
    setSelectedTableId(id);
    runtime.current?.selectTarget(
      cafe.tables.find((table) => table.id === id)?.targetId ?? null,
    );
    setTablePanelOpen(true);
  }
  function showTables() {
    runtime.current?.setView("overview");
    setTablePanelOpen(true);
  }
  const places: readonly Waypoint[] = cafe.waypoints;
  return (
    <main
      className="explorer"
      data-ready={status === "ready"}
      data-entered={entered}
      data-table-panel={tablePanelOpen}
      data-view={mode}
      data-dense-tables={cafe.tables.length > 10}
    >
      <Image
        src={cafe.preview}
        alt={cafe.name}
        fill
        priority
        sizes="100vw"
        className="scene-poster"
      />
      <canvas
        key={attempt}
        ref={canvas}
        className="scene-canvas"
        tabIndex={0}
        aria-label={t("sceneLabel")}
      />
      <div className="scene-vignette" aria-hidden="true" />
      <div ref={markers} className="table-markers" aria-label={t("tables")}>
        {cafe.tables.map((table) => (
          <button
            key={table.id}
            type="button"
            hidden
            data-table-id={table.id}
            className="table-marker"
            aria-label={
              t("tables") + " " + new Intl.NumberFormat("fa").format(table.id)
            }
            aria-pressed={selectedTableId === table.id}
            onClick={() => chooseTable(table.id)}
          >
            {new Intl.NumberFormat("fa").format(table.id)}
          </button>
        ))}
      </div>
      <header className="explore-header">
        <div className="cafe-identity glass-panel">
          <Link href="/" aria-label={common("back")} className="back-link">
            <ArrowRightIcon />
          </Link>
          <Separator orientation="vertical" />
          <LeafIcon className="cafe-leaf" aria-hidden="true" />
          <div>
            <Link href="/" className="brand-caption">
              {common("brand")}
            </Link>
            <h2>{cafe.name}</h2>
          </div>
          <Badge variant="secondary">{common("demo")}</Badge>
        </div>
        <div className="explore-actions glass-panel">
          <CafeMenu
            slug={cafe.slug}
            name={cafe.name}
            onActiveChange={setMenuOpen}
          />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon-lg"
            disabled={status !== "ready"}
            aria-label={night ? t("day") : t("night")}
            title={night ? t("day") : t("night")}
            onClick={() => {
              runtime.current?.setNight(!night);
              setNight(!night);
            }}
          >
            <IconSwap active={night} first={MoonIcon} second={SunIcon} />
          </Button>
          <Button
            variant="ghost"
            size="icon-lg"
            className="desktop-action"
            disabled={status !== "ready"}
            aria-label={t("photo")}
            onClick={takePhoto}
          >
            <CameraIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-lg"
            className="fullscreen-action"
            aria-label={t("fullscreen")}
            onClick={fullscreen}
          >
            <MaximizeIcon />
          </Button>
        </div>
      </header>
      {status !== "error" && (
        <section
          className="welcome-panel glass-panel t-panel-slide"
          data-open={!entered}
          inert={entered}
          aria-hidden={entered}
          aria-labelledby="explore-title"
        >
          <span className="eyebrow">
            <span className="status-dot" />
            {t("eyebrow")}
          </span>
          <h1 id="explore-title">{t("title", { name: cafe.name })}</h1>
          <p>{cafe.description}</p>
          <Button
            size="lg"
            variant="tactile"
            className="w-full"
            disabled={status !== "ready"}
            onClick={enter}
          >
            {t("enter")}
            <ArrowUpLeftIcon data-icon="inline-end" />
          </Button>
          <div className="loading-status" role="status">
            {status === "loading" && (
              <Skeleton className="size-2 rounded-full" />
            )}
            {status === "ready" ? t("ready") : t("loading")}
          </div>
        </section>
      )}
      <TablePanel
        cafeSlug={cafe.slug}
        cafeName={cafe.name}
        onReservationChange={setReservationOpen}
        tables={cafe.tables}
        open={tablePanelOpen}
        selectedId={selectedTableId}
        onOpenChange={(value) => {
          setTablePanelOpen(value);
          if (!value) canvas.current?.focus({ preventScroll: true });
        }}
        onSelect={chooseTable}
        onView={(id) => {
          setTablePanelOpen(false);
          const table = cafe.tables.find((table) => table.id === id);
          if (table) runtime.current?.focusTarget(table.targetId);
          canvas.current?.focus({ preventScroll: true });
        }}
      />
      {status === "error" && (
        <section className="scene-error glass-panel" role="alert">
          <CircleHelpIcon aria-hidden="true" />
          <h1>{t("errorTitle")}</h1>
          <p>{t("errorDescription")}</p>
          <Button
            variant="tactile"
            onClick={() => {
              setStatus("loading");
              setEntered(false);
              setNight(false);
              setMode("walk");
              setTouring(false);
              setSelectedTableId(null);
              setTablePanelOpen(false);
              setAttempt((value) => value + 1);
            }}
          >
            {t("retry")}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">{common("back")}</Link>
          </Button>
        </section>
      )}
      <aside
        className="minimap-panel glass-panel"
        aria-label={t("map")}
        hidden={status === "error"}
      >
        <div className="minimap-title">
          <span>{t("map")}</span>
          <span className="status-dot" />
        </div>
        <canvas ref={map} width={220} height={252} aria-label={t("mapHint")} />
        <small>{t("mapHint")}</small>
      </aside>
      {entered && status === "ready" && (
        <>
          <nav className="waypoints glass-panel" aria-label={t("waypoints")}>
            {places.map((place) => (
              <Button
                key={place}
                variant="ghost"
                size="sm"
                onClick={() => {
                  runtime.current?.goTo(place);
                  canvas.current?.focus({ preventScroll: true });
                }}
              >
                {t(place)}
              </Button>
            ))}
          </nav>
          <div className="reset-control glass-panel">
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label={t("reset")}
              onClick={() => {
                runtime.current?.reset();
                canvas.current?.focus({ preventScroll: true });
              }}
            >
              <RotateCcwIcon />
            </Button>
          </div>
          {mode === "walk" && (
            <Joystick
              onMove={(value) => runtime.current?.setMovement(value)}
              onFocusScene={() =>
                canvas.current?.focus({ preventScroll: true })
              }
              label={t("joystick")}
            />
          )}
        </>
      )}
      {entered && status === "ready" && (
        <Button
          variant="tactile"
          className="table-select-trigger"
          onClick={showTables}
        >
          <ArmchairIcon data-icon="inline-start" />
          {t("tables")}
        </Button>
      )}
      <nav className="explore-toolbar glass-panel" aria-label={t("controls")}>
        <ToggleGroup
          variant="navigation"
          type="single"
          dir="rtl"
          value={mode}
          disabled={!entered || status !== "ready"}
          onValueChange={(value) => {
            if (value) {
              runtime.current?.setView(value as ViewMode);
              canvas.current?.focus({ preventScroll: true });
            }
          }}
          aria-label={t("controls")}
        >
          <ToggleGroupItem value="walk" aria-label={t("walk")}>
            <FootprintsIcon data-icon="inline-start" />
            <span>{t("walk")}</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="overview" aria-label={t("overview")}>
            <LayersIcon data-icon="inline-start" />
            <span>{t("overview")}</span>
          </ToggleGroupItem>
        </ToggleGroup>
        <Separator orientation="vertical" />
        <Button
          variant={touring ? "secondary" : "ghost"}
          className="tour-control"
          disabled={!entered || status !== "ready"}
          aria-label={touring ? t("stopTour") : t("tour")}
          aria-pressed={touring}
          onClick={() => {
            runtime.current?.setTouring(!touring);
            canvas.current?.focus({ preventScroll: true });
          }}
        >
          <IconSwap active={touring} first={PlayIcon} second={PauseIcon} />
          <span>{touring ? t("stopTour") : t("tour")}</span>
        </Button>
        <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon-lg" aria-label={t("help")}>
              <CircleHelpIcon />
            </Button>
          </DialogTrigger>
          <DialogContent
            showCloseButton={false}
            onCloseAutoFocus={(event) => {
              if (entered) {
                event.preventDefault();
                canvas.current?.focus({ preventScroll: true });
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>{t("help")}</DialogTitle>
              <DialogDescription>{t("helpDescription")}</DialogDescription>
            </DialogHeader>
            <div className="help-copy">
              <p>{t("helpOverview")}</p>
              <p>{t("helpWaypoints")}</p>
              {cafe.reconstruction && (
                <>
                  <p>{cafe.reconstruction.note}</p>
                  <a
                    href={cafe.reconstruction.source}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("sourcePhotos")}
                  </a>
                  <Button
                    variant="outline"
                    disabled={exporting || status !== "ready"}
                    onClick={downloadModel}
                  >
                    <DownloadIcon data-icon="inline-start" />
                    {exporting ? t("exportingModel") : t("downloadModel")}
                  </Button>
                </>
              )}
            </div>
            <DialogClose asChild>
              <Button variant="outline">
                {common("close")}
                <XIcon data-icon="inline-end" />
              </Button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      </nav>
      <div className="explore-footnote">
        <span>
          {common("brand")} / {cafe.slug}
        </span>
        <span>{entered ? t("desktopHint") : t("demoNote")}</span>
      </div>
      {entered && mode === "walk" && (
        <p className="mobile-hint">{t("mobileHint")}</p>
      )}
      <div className="notice" role="status" aria-live="polite">
        {notice}
      </div>
    </main>
  );
}
