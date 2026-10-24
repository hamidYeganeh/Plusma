"use client";

import Image from "next/image";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  CheckIcon,
  ChevronDownIcon,
  CoffeeIcon,
  InfoIcon,
  LayoutGridIcon,
  LeafIcon,
  MenuIcon,
  MinusIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  ShoppingBagIcon,
  ShuffleIcon,
  XIcon,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  allFlavors,
  coffeeFlavors,
  matchaFlavors,
  priceCurrency,
  type LandingFlavor,
} from "./flavors";
import "./landing-hero-section.css";

const wrap = (position: number) => ((position % 6) + 6) % 6;
type Brand = "coffee" | "matcha";
type Panel = "flavors" | "notes" | "bag";

function Ingredient({
  flavor,
  floating = false,
}: {
  flavor: LandingFlavor;
  floating?: boolean;
}) {
  const filterId = `ingredient-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const { sheet, col, row } = flavor.tile;
  return (
    <span
      className={`landing-ingredient ${floating ? "landing-cutout" : "landing-thumbnail"}`}
    >
      {floating && (
        <svg aria-hidden="true" className="landing-filter">
          <filter
            id={filterId}
            x="0"
            y="0"
            width="100%"
            height="100%"
            colorInterpolationFilters="sRGB"
          >
            {/* The source artwork uses this blue-screen transparency matrix. */}
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  6 6 -6 0 1.2"
            />
          </filter>
        </svg>
      )}
      <span
        className="landing-ingredient-photo"
        style={floating ? { filter: `url(#${filterId})` } : undefined}
      >
        <span
          style={{
            width: "390%",
            height: "260%",
            left: `${50 - (col + 0.5) * 130}%`,
            top: `${50 - (row + 0.5) * 130}%`,
          }}
        >
          <Image
            src={floating ? sheet.replace(".webp", "-key.webp") : sheet}
            alt=""
            fill
            unoptimized
            loading="eager"
            draggable={false}
            sizes="800px"
          />
        </span>
      </span>
    </span>
  );
}

function IconButton({
  label,
  children,
  onClick,
  expanded,
  controls,
  className = "",
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
  expanded?: boolean;
  controls?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`landing-icon-button ${className}`}
      aria-label={label}
      title={label}
      aria-expanded={expanded}
      aria-controls={expanded ? controls : undefined}
      aria-haspopup={controls ? "dialog" : undefined}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function BrandSwitch({
  brand,
  compact = false,
  onChange,
}: {
  brand: Brand;
  compact?: boolean;
  onChange: (brand: Brand) => void;
}) {
  const t = useTranslations("LandingHero");
  return (
    <div
      className={compact ? "landing-compact-switch" : "landing-brand-switch"}
      role="group"
      aria-label={t("drinkMenu")}
    >
      {compact ? (
        <IconButton
          label={t("switchDrink", {
            name: t(`brands.${brand === "coffee" ? "matcha" : "coffee"}.name`),
          })}
          onClick={() => onChange(brand === "coffee" ? "matcha" : "coffee")}
        >
          {brand === "coffee" ? <LeafIcon /> : <CoffeeIcon />}
        </IconButton>
      ) : (
        (["coffee", "matcha"] as const).map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={brand === item}
            onClick={() => onChange(item)}
          >
            {item === "coffee" ? <CoffeeIcon /> : <LeafIcon />}
            {t(`brands.${item}.name`)}
          </button>
        ))
      )}
    </div>
  );
}

/** Localized RTL flavor wheel using the shared application theme. */
export function LandingHeroSection() {
  const t = useTranslations("LandingHero");
  const locale = useLocale();
  const format = useFormatter();
  const money = (price: number) =>
    format.number(price, {
      style: "currency",
      currency: priceCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const indexNumber = (number: number) =>
    format.number(number, { minimumIntegerDigits: 2 });
  const localizeFlavor = (item: LandingFlavor) => ({
    ...item,
    name: t(`flavors.${item.id}.name`),
    title: t(`flavors.${item.id}.title`),
    description: t(`flavors.${item.id}.description`),
    notes: ["first", "second", "third"].map((note) =>
      t(`flavors.${item.id}.notes.${note}`),
    ),
    sceneAlt: t(`flavors.${item.id}.sceneAlt`),
  });
  const [brand, setBrand] = useState<Brand>("coffee");
  const [position, setPosition] = useState(0);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [paused, setPaused] = useState(false);
  const [bag, setBag] = useState<Record<string, number>>({});
  const [added, setAdded] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const scrollPosition = useRef(0);
  const offset = useRef(0);
  const currentPosition = useRef(0);
  const pointer = useRef<{
    id: number;
    x: number;
    y: number;
    dragged: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  const id = useId();
  const flavors = (brand === "coffee" ? coffeeFlavors : matchaFlavors).map(
    localizeFlavor,
  );
  const activeIndex = wrap(position);
  const flavor = flavors[activeIndex]!;
  const [sceneState, setSceneState] = useState({
    brand,
    activeIndex,
    previous: -1,
  });
  if (sceneState.brand !== brand || sceneState.activeIndex !== activeIndex) {
    setSceneState({
      brand,
      activeIndex,
      previous: sceneState.brand === brand ? sceneState.activeIndex : -1,
    });
  }
  const bagFlavors = allFlavors
    .filter((item) => (bag[item.id] ?? 0) > 0)
    .map(localizeFlavor);
  const bagCount = Object.values(bag).reduce((sum, count) => sum + count, 0);
  const subtotal = bagFlavors.reduce(
    (sum, item) => sum + item.price * (bag[item.id] ?? 0),
    0,
  );

  const updateWheel = useCallback((value: number) => {
    if (!Number.isFinite(value)) return;
    wheelRef.current?.style.setProperty("--landing-rotation", String(value));
    const next = Math.round(value);
    if (currentPosition.current !== next) {
      currentPosition.current = next;
      setPosition(next);
    }
  }, []);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const section = sectionRef.current;
      const stage = stageRef.current;
      if (!section || !stage) return;
      const distance = section.offsetHeight - stage.offsetHeight;
      const progress =
        distance > 0
          ? Math.min(
              1,
              Math.max(0, -section.getBoundingClientRect().top / distance),
            )
          : 0;
      const value = progress * 5;
      const step = Math.min(Math.floor(value), 5);
      const mix = Math.min(1, Math.max(0, (value - step - 0.2) / 0.6));
      scrollPosition.current = step + mix * mix * (3 - 2 * mix);
      stage.dataset.scrolled = String(progress > 0.01);
      updateWheel(scrollPosition.current + offset.current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [updateWheel]);

  const stepBy = useCallback(
    (steps: number) => {
      setAnnouncement("");
      offset.current += steps;
      updateWheel(scrollPosition.current + offset.current);
    },
    [updateWheel],
  );

  const choose = (index: number) => {
    let delta = wrap(index - wrap(currentPosition.current));
    if (delta > 3) delta -= 6;
    stepBy(delta);
    setPanel(null);
    setAnnouncement(
      t("selected", {
        name: flavors[index]!.title,
        price: money(flavors[index]!.price),
      }),
    );
  };
  const switchBrand = (next: Brand) => {
    if (brand === next) return;
    setBrand(next);
    setAnnouncement("");
    offset.current = -scrollPosition.current;
    updateWheel(0);
    setPanel(null);
  };
  const addToBag = () => {
    setBag((previous) => ({
      ...previous,
      [flavor.id]: (previous[flavor.id] ?? 0) + 1,
    }));
    setAdded(flavor.id);
    setAnnouncement(t("addedAnnouncement", { name: flavor.title }));
  };
  const changeBag = (item: LandingFlavor, delta: number) => {
    setBag((previous) => ({
      ...previous,
      [item.id]: Math.max(0, (previous[item.id] ?? 0) + delta),
    }));
  };

  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(null), 1600);
    return () => window.clearTimeout(timer);
  }, [added, bagCount]);

  useEffect(() => {
    if (!panel) return;
    panelRef.current?.focus({ preventScroll: true });
    const dismiss = (event: globalThis.PointerEvent) => {
      if (!dockRef.current?.contains(event.target as Node)) setPanel(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setPanel(null);
      dockRef.current
        ?.querySelector<HTMLButtonElement>(`[aria-controls="${id}-${panel}"]`)
        ?.focus();
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [panel, id]);

  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      const rect = stageRef.current?.getBoundingClientRect();
      if (
        panel ||
        menuOpen ||
        !rect ||
        rect.bottom <= 0 ||
        rect.top > 0 ||
        event.altKey ||
        event.metaKey ||
        event.ctrlKey ||
        event.defaultPrevented
      )
        return;
      if (
        (event.target as HTMLElement).closest(
          'input, textarea, select, [contenteditable="true"], [role="dialog"]',
        )
      )
        return;
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        stepBy(event.key === "ArrowLeft" ? 1 : -1);
      }
    };
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, [panel, menuOpen, stepBy]);

  useEffect(() => {
    const dialog = menuRef.current;
    if (!menuOpen || !dialog) return;
    const previousOverflow = document.body.style.overflow;
    const menuButton = menuButtonRef.current;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      menuButton?.focus({ preventScroll: true });
    };
  }, [menuOpen]);

  const finishDrag = (event: PointerEvent<HTMLDivElement>, cancel = false) => {
    const start = pointer.current;
    pointer.current = null;
    if (!start || start.id !== event.pointerId || !start.dragged) return;
    suppressClick.current = true;
    window.setTimeout(() => {
      suppressClick.current = false;
    }, 0);
    const distance = event.clientX - start.x;
    if (!cancel && Math.abs(distance) > 35) stepBy(distance > 0 ? 1 : -1);
    else updateWheel(scrollPosition.current + offset.current);
  };

  return (
    <section
      id="hero"
      ref={sectionRef}
      dir="rtl"
      lang={locale}
      aria-labelledby={`${id}-title`}
      className="landing-hero"
      data-brand={brand}
      data-paused={paused}
    >
      <div
        ref={stageRef}
        className="landing-stage"
        onPointerDown={(event) => {
          if (
            event.button !== 0 ||
            (event.target as HTMLElement).closest("button, a, [role=dialog]")
          )
            return;
          pointer.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            dragged: false,
          };
        }}
        onPointerMove={(event) => {
          const start = pointer.current;
          if (!start || start.id !== event.pointerId) return;
          const dx = event.clientX - start.x,
            dy = event.clientY - start.y;
          if (
            !start.dragged &&
            Math.abs(dy) > 14 &&
            Math.abs(dy) > Math.abs(dx)
          ) {
            pointer.current = null;
            return;
          }
          if (Math.abs(dx) < 8) return;
          start.dragged = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          wheelRef.current?.style.setProperty(
            "--landing-rotation",
            String(currentPosition.current + dx / 250),
          );
        }}
        onPointerUp={finishDrag}
        onPointerCancel={(event) => finishDrag(event, true)}
      >
        <div className="landing-scene" key={brand}>
          {flavors.map((item, index) => (
            <Image
              key={item.id}
              src={item.scene}
              alt={index === activeIndex ? item.sceneAlt : ""}
              aria-hidden={index !== activeIndex}
              fill
              unoptimized
              draggable={false}
              preload={brand === "coffee" && index === 0}
              sizes="(max-width: 639px) 250vw, 180vh"
              className={`landing-scene-image ${index === activeIndex ? `landing-active-scene ${sceneState.previous >= 0 ? "landing-pour" : ""}` : index === sceneState.previous ? "landing-previous-scene" : ""}`}
            />
          ))}
        </div>

        <header className="landing-header">
          <nav className="landing-nav" aria-label={t("mainNavigation")}>
            <a className="landing-wordmark" href="#hero">
              {t(`brands.${brand}.wordmark`)}
            </a>
            <div ref={dockRef} className="landing-dock-anchor">
              <div className="landing-dock">
                <IconButton
                  label={t("allFlavors")}
                  controls={`${id}-flavors`}
                  expanded={panel === "flavors"}
                  onClick={() =>
                    setPanel(panel === "flavors" ? null : "flavors")
                  }
                >
                  <LayoutGridIcon />
                </IconButton>
                <IconButton
                  label={t("tastingNotes")}
                  controls={`${id}-notes`}
                  expanded={panel === "notes"}
                  onClick={() => setPanel(panel === "notes" ? null : "notes")}
                >
                  <InfoIcon />
                </IconButton>
                <IconButton
                  label={t("surprise")}
                  onClick={() =>
                    choose(
                      wrap(activeIndex + 1 + Math.floor(Math.random() * 5)),
                    )
                  }
                >
                  <ShuffleIcon />
                </IconButton>
                <IconButton
                  className="landing-bag-button"
                  label={t("bagLabel", { count: bagCount })}
                  controls={`${id}-bag`}
                  expanded={panel === "bag"}
                  onClick={() => setPanel(panel === "bag" ? null : "bag")}
                >
                  <ShoppingBagIcon />
                  {bagCount > 0 && (
                    <span className="landing-badge" aria-hidden="true">
                      {format.number(bagCount)}
                    </span>
                  )}
                </IconButton>
              </div>
              {panel && (
                <div
                  ref={panelRef}
                  role="dialog"
                  tabIndex={-1}
                  aria-label={t(
                    panel === "flavors"
                      ? "allFlavors"
                      : panel === "notes"
                        ? "tastingNotes"
                        : "yourBag",
                  )}
                  id={`${id}-${panel}`}
                  className="landing-panel"
                >
                  {panel === "flavors" && (
                    <>
                      <p className="landing-kicker">{t("allFlavors")}</p>
                      <ul className="landing-flavor-list">
                        {flavors.map((item, index) => (
                          <li key={item.id}>
                            <button
                              type="button"
                              aria-current={
                                index === activeIndex ? "true" : undefined
                              }
                              onClick={() => choose(index)}
                            >
                              <Ingredient flavor={item} />
                              <span className="landing-list-copy">
                                <span>{item.title}</span>
                                <small>
                                  {format.list(item.notes, { type: "unit" })}
                                </small>
                              </span>
                              <span className="landing-list-price">
                                {money(item.price)}
                              </span>
                              <CheckIcon
                                className={
                                  index === activeIndex
                                    ? ""
                                    : "landing-invisible"
                                }
                              />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {panel === "notes" && (
                    <>
                      <div className="landing-notes-header">
                        <Ingredient flavor={flavor} />
                        <div>
                          <p className="landing-kicker">{t("tastingNotes")}</p>
                          <h2>{flavor.title}</h2>
                        </div>
                      </div>
                      <p className="landing-description">
                        {flavor.description}
                      </p>
                      <ul
                        className="landing-notes"
                        aria-label={t("flavorNotes")}
                      >
                        {flavor.notes.map((note) => (
                          <li key={note}>{note}</li>
                        ))}
                      </ul>
                      <dl className="landing-details">
                        {[
                          [t("size"), t("sizeValue", { size: 16 })],
                          [
                            t("caffeine"),
                            t("caffeineValue", { amount: flavor.caffeine }),
                          ],
                          [t("price"), money(flavor.price)],
                        ].map(([label, value]) => (
                          <div key={label}>
                            <dt>{label}</dt>
                            <dd>{value}</dd>
                          </div>
                        ))}
                      </dl>
                      <button
                        type="button"
                        onClick={addToBag}
                        className="landing-add-button"
                      >
                        {added === flavor.id ? (
                          <CheckIcon />
                        ) : (
                          <ShoppingBagIcon />
                        )}
                        {added === flavor.id ? (
                          t("addedToBag")
                        ) : (
                          <>
                            {t("addToBag")} <bdi>{money(flavor.price)}</bdi>
                          </>
                        )}
                      </button>
                    </>
                  )}
                  {panel === "bag" && (
                    <>
                      <p className="landing-kicker">
                        {t("yourBag")}{" "}
                        {bagCount > 0 && (
                          <span>{t("drinkCount", { count: bagCount })}</span>
                        )}
                      </p>
                      {bagCount === 0 ? (
                        <div className="landing-empty-bag">
                          <ShoppingBagIcon />
                          <h2>{t("emptyBag")}</h2>
                          <p>{t("emptyBagHint")}</p>
                        </div>
                      ) : (
                        <>
                          <ul className="landing-bag-list">
                            {bagFlavors.map((item) => (
                              <li key={item.id}>
                                <Ingredient flavor={item} />
                                <div className="landing-list-copy">
                                  <span>{item.title}</span>
                                  <small>
                                    {money(item.price * (bag[item.id] ?? 0))}
                                  </small>
                                </div>
                                <div className="landing-quantity">
                                  <IconButton
                                    label={t("removeOne", { name: item.title })}
                                    onClick={() => changeBag(item, -1)}
                                  >
                                    <MinusIcon />
                                  </IconButton>
                                  <span>
                                    {format.number(bag[item.id] ?? 0)}
                                  </span>
                                  <IconButton
                                    label={t("addOne", { name: item.title })}
                                    onClick={() => changeBag(item, 1)}
                                  >
                                    <PlusIcon />
                                  </IconButton>
                                </div>
                              </li>
                            ))}
                          </ul>
                          <div className="landing-subtotal">
                            <span>{t("subtotal")}</span>
                            <strong>{money(subtotal)}</strong>
                          </div>
                          <button
                            type="button"
                            className="landing-clear-bag"
                            onClick={() => setBag({})}
                          >
                            {t("clearBag")}
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="landing-actions">
              <BrandSwitch brand={brand} onChange={switchBrand} />
              <BrandSwitch brand={brand} onChange={switchBrand} compact />
              <button
                type="button"
                className={`landing-utility-button landing-pause-button`}
                aria-pressed={paused}
                aria-label={t(paused ? "playMotion" : "pauseMotion")}
                title={t(paused ? "playMotion" : "pauseMotion")}
                onClick={() => setPaused(!paused)}
              >
                {paused ? <PlayIcon /> : <PauseIcon />}
              </button>
              <button
                ref={menuButtonRef}
                type="button"
                className="landing-utility-button"
                aria-label={t("openMenu")}
                aria-haspopup="dialog"
                aria-expanded={menuOpen}
                onClick={() => {
                  setPanel(null);
                  setMenuOpen(true);
                }}
              >
                <MenuIcon />
              </button>
            </div>
          </nav>
        </header>

        <h1
          id={`${id}-title`}
          className="landing-headline"
          aria-label={t("headlineLabel", {
            lead: t(`brands.${brand}.headline`),
          })}
        >
          {t(`brands.${brand}.headline`)} <br />
          {t("choose")}
        </h1>
        <div
          ref={wheelRef}
          className="landing-wheel"
          role="group"
          aria-label={t("flavorsLabel")}
        >
          {Array.from({ length: 15 }, (_, index) => position - 7 + index).map(
            (slot) => {
              const item = flavors[wrap(slot)]!;
              const reachable =
                slot !== position && Math.abs(slot - position) <= 2;
              return (
                <button
                  key={`${brand}-${slot}`}
                  type="button"
                  className="landing-tile"
                  style={{ "--slot": slot } as CSSProperties}
                  tabIndex={reachable ? 0 : -1}
                  aria-hidden={!reachable}
                  data-reachable={reachable}
                  aria-label={t("chooseFlavor", { name: item.title })}
                  title={item.title}
                  onClick={() => {
                    if (!suppressClick.current) choose(wrap(slot));
                  }}
                >
                  <span
                    className="landing-float"
                    style={{ animationDelay: `${-1.2 * wrap(slot)}s` }}
                  >
                    <Ingredient flavor={item} floating />
                  </span>
                </button>
              );
            },
          )}
        </div>
        <p className="landing-flavor-name">
          <span key={flavor.id}>{flavor.name}</span>
        </p>
        <button
          type="button"
          className="landing-price-chip"
          onClick={addToBag}
          aria-label={t("addDrink", {
            name: flavor.title,
            price: money(flavor.price),
          })}
        >
          <bdi>{money(flavor.price)}</bdi>
          <span
            className={
              added === flavor.id ? "landing-added-icon" : "landing-chip-icon"
            }
          >
            {added === flavor.id ? <CheckIcon /> : <ShoppingBagIcon />}
          </span>
        </button>
        <div className="landing-pagination" aria-hidden="true">
          <p>
            <span>{indexNumber(activeIndex + 1)}</span>
            <small> / {indexNumber(flavors.length)}</small>
          </p>
          <div>
            {flavors.map((item, index) => (
              <i key={item.id} data-active={index === activeIndex} />
            ))}
          </div>
        </div>
        <div className="landing-scroll-cue" aria-hidden="true">
          {t("scrollHint")}{" "}
          <span>
            <ChevronDownIcon />
          </span>
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {announcement ||
            t("selected", { name: flavor.title, price: money(flavor.price) })}
        </p>
      </div>

      <dialog
        ref={menuRef}
        className="landing-menu-dialog"
        aria-label={t("siteMenu")}
        onCancel={() => setMenuOpen(false)}
      >
        <div className="landing-menu-top">
          <span className="landing-wordmark">
            {t(`brands.${brand}.wordmark`)}
          </span>
          <IconButton label={t("closeMenu")} onClick={() => setMenuOpen(false)}>
            <XIcon />
          </IconButton>
        </div>
        <nav className="landing-menu-links" aria-label={t("siteNavigation")}>
          <button
            type="button"
            onClick={() => {
              switchBrand("coffee");
              setMenuOpen(false);
            }}
          >
            <small>{indexNumber(1)}</small>
            {t("brands.coffee.name")}
          </button>
          <button
            type="button"
            onClick={() => {
              switchBrand("matcha");
              setMenuOpen(false);
            }}
          >
            <small>{indexNumber(2)}</small>
            {t("brands.matcha.name")}
          </button>
          <a href="#cafes" onClick={() => setMenuOpen(false)}>
            <small>{indexNumber(3)}</small>
            {t("exploreCafes")}
          </a>
        </nav>
        <div className="landing-menu-bottom">
          <p>{t(`brands.${brand}.tagline`)}</p>
          <div className="landing-menu-preferences">
            <ThemeToggle />
            <button type="button" onClick={() => setPaused(!paused)}>
              {paused ? <PlayIcon /> : <PauseIcon />}
              {t(paused ? "playMotion" : "pauseMotion")}
            </button>
          </div>
        </div>
      </dialog>
    </section>
  );
}
