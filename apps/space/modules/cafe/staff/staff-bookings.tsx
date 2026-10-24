"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  Coffee,
  LogOut,
  RefreshCw,
  UserRound,
  Users,
  X,
  Search,
  ArrowUpLeft,
} from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import type { Reservation, StaffSession } from "@repo/contracts";
import { ThemeToggle } from "@/components/theme-toggle";
import { MenuPanel, OrdersPanel, OrderComposer } from "./cafe-operations";
import { request, RequestError, message, number } from "./staff-client";
import "./staff.css";
type Command = { id: string; action: "cancel" | "check-in"; key: string };
function today() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function StaffBookings() {
  const [session, setSession] = useState<StaffSession | null>(null),
    [booting, setBooting] = useState(true);
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [loginError, setLoginError] = useState("");
  const [venue, setVenue] = useState(""),
    [day, setDay] = useState(today),
    [rows, setRows] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [pending, setPending] = useState<Command | null>(null),
    [cancelling, setCancelling] = useState<Reservation | null>(null);
  const [now, setNow] = useState(Date.now);
  const [listRevision, setListRevision] = useState(0);
  const commandRunning = useRef(false);
  const [tab, setTab] = useState("reservations");
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all");
  const [ordering, setOrdering] = useState<Reservation | null>(null);
  const unauthorized = useCallback(() => setSession(null), []);
  const storageKey = session ? `plusma.staff.command.${session.user.id}` : "";
  function persist(command: Command | null) {
    setPending(command);
    try {
      if (command) sessionStorage.setItem(storageKey, JSON.stringify(command));
      else sessionStorage.removeItem(storageKey);
    } catch {
      /* The current tab still keeps retry intent. */
    }
  }
  const acceptSession = useCallback((value: StaffSession) => {
    setLoading(true);
    setRows([]);
    setSession(value);
    setVenue(value.venues[0]?.slug ?? "");
    try {
      const saved = JSON.parse(
        sessionStorage.getItem(`plusma.staff.command.${value.user.id}`) ??
          "null",
      );
      if (
        saved &&
        typeof saved.id === "string" &&
        typeof saved.key === "string" &&
        ["cancel", "check-in"].includes(saved.action)
      )
        setPending(saved);
    } catch {
      /* Ignore unavailable storage. */
    }
  }, []);
  useEffect(() => {
    const abort = new AbortController();
    request<StaffSession>("/session", { signal: abort.signal })
      .then(acceptSession)
      .catch((value) => {
        if (
          !abort.signal.aborted &&
          !(value instanceof RequestError && value.status === 401)
        )
          setLoginError(message(value));
      })
      .finally(() => {
        if (!abort.signal.aborted) setBooting(false);
      });
    return () => abort.abort();
  }, [acceptSession]);
  function loadRows() {
    setLoading(true);
    setError("");
    setRows([]);
    setListRevision((value) => value + 1);
  }
  useEffect(() => {
    if (!venue || !session) return;
    const abort = new AbortController();
    request<Reservation[]>(
      `/venues/${encodeURIComponent(venue)}/reservations?date=${encodeURIComponent(day)}`,
      { signal: abort.signal },
    )
      .then((result) => {
        if (!abort.signal.aborted) setRows(result);
      })
      .catch((value) => {
        if (!abort.signal.aborted) {
          setError(message(value));
          if (value instanceof RequestError && value.status === 401)
            setSession(null);
        }
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [day, session, venue, listRevision]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  async function login(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setLoginError("");
    try {
      acceptSession(
        await request<StaffSession>("/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password }),
        }),
      );
      setPassword("");
    } catch (value) {
      setLoginError(
        value instanceof RequestError && value.status === 401
          ? "ایمیل یا رمز عبور درست نیست."
          : message(value),
      );
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    setError("");
    try {
      await request("/session", { method: "DELETE" });
      setSession(null);
      setRows([]);
      setPending(null);
    } catch (value) {
      if (value instanceof RequestError && value.status === 401)
        setSession(null);
      else setError(message(value));
    } finally {
      setBusy(false);
    }
  }
  async function runCommand(command: Command) {
    if (commandRunning.current) return;
    commandRunning.current = true;
    setBusy(true);
    setError("");
    setCancelling(null);
    persist(command);
    try {
      await request<Reservation>(
        `/reservations/${encodeURIComponent(command.id)}/${command.action}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": command.key,
          },
          body: "{}",
        },
      );
      persist(null);
      loadRows();
    } catch (value) {
      if (
        value instanceof RequestError &&
        value.status >= 400 &&
        value.status < 500
      ) {
        persist(null);
        if (value.status === 401) setSession(null);
      }
      setError(message(value));
    } finally {
      commandRunning.current = false;
      setBusy(false);
    }
  }
  const fullDate = new Intl.DateTimeFormat("fa", {
    calendar: "persian",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${day}T12:00:00+03:30`));
  const label = (row: Reservation) =>
    new Intl.DateTimeFormat("fa", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: row.timeZone,
    }).format(new Date(row.startsAt));
  const filtered = rows.filter(
    (row) =>
      (filter === "all" || row.status === filter) &&
      `${row.guestName} ${row.guestPhone} ${row.code} ${row.tableId}`.includes(
        query.trim(),
      ),
  );
  return (
    <div className="staff-surface" dir="rtl">
      <header className="staff-topnav">
        <div className="staff-topnav-inner">
          <div className="staff-topnav-start">
            <Link href="/" className="staff-wordmark">
              <span>
                <Coffee aria-hidden="true" />
              </span>
              Plusma
            </Link>
            {session && (
              <>
                <span className="staff-nav-divider" />
                <label className="staff-venue">
                  <span className="sr-only">کافه</span>
                  <select
                    aria-label="کافه"
                    value={venue}
                    disabled={busy || !!pending}
                    onChange={(e) => {
                      setLoading(true);
                      setRows([]);
                      setError("");
                      setOrdering(null);
                      setVenue(e.target.value);
                    }}
                  >
                    {session.venues.map((v) => (
                      <option key={v.id} value={v.slug}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
          </div>
          <div className="staff-utilities">
            <ThemeToggle />
            {session && (
              <>
                <span className="staff-user-name">{session.user.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void logout()}
                  disabled={busy}
                >
                  <LogOut /> خروج
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      {!session ? (
        <main className="staff-login">
          <div className="staff-login-mark">
            <Coffee />
          </div>
          <span className="staff-eyebrow">به فضای کاری کافه خوش آمدید</span>
          <h1>یک روز خوب، از اینجا</h1>
          <p className="staff-login-intro">
            برای مدیریت رزروها، منو و سفارش‌های کافه وارد شوید.
          </p>
          <section className="staff-login-card">
            <h2>ورود کارکنان</h2>
            {booting ? (
              <p role="status">در حال بررسی نشست…</p>
            ) : (
              <form className="staff-form" onSubmit={login}>
                <label htmlFor="staff-email">
                  ایمیل
                  <input
                    id="staff-email"
                    name="email"
                    type="email"
                    dir="ltr"
                    autoComplete="username"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={busy}
                    placeholder="you@cafe.com"
                  />
                </label>
                <label htmlFor="staff-password">
                  رمز عبور
                  <input
                    id="staff-password"
                    name="password"
                    type="password"
                    dir="ltr"
                    autoComplete="current-password"
                    required
                    maxLength={256}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={busy}
                  />
                </label>
                {loginError && (
                  <Alert variant="destructive" role="alert">
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" disabled={busy}>
                  {busy ? "در حال ورود…" : "ورود به فضای کاری"}
                </Button>
              </form>
            )}
            <p className="staff-help">
              حساب کاری را مدیر کافه در اختیار شما می‌گذارد.
            </p>
          </section>
          <Link href="/" className="staff-back">
            بازدید کافه‌ها <ArrowUpLeft />
          </Link>
        </main>
      ) : (
        <>
          <main className="staff-workspace">
            <div className="staff-page-heading">
              <div>
                <span className="staff-eyebrow">فضای کاری کافه</span>
                <h1>
                  {session.venues.find((v) => v.slug === venue)?.name ??
                    "پذیرش کافه"}
                </h1>
                <p>از خوش‌آمدگویی تا آخرین سفارش.</p>
              </div>
              <Link
                href={venue ? `/cafe/${venue}` : "/"}
                className="staff-visit"
              >
                بازدید کافه <ArrowUpLeft />
              </Link>
            </div>
            <nav className="staff-tabs" aria-label="بخش‌های کافه">
              {[
                ["reservations", "رزروها"],
                ["menu", "منو"],
                ["orders", "سفارش‌ها"],
              ].map(([value, title]) => (
                <button
                  key={value}
                  aria-current={tab === value ? "page" : undefined}
                  onClick={() => setTab(value!)}
                >
                  {title}
                  {value === "reservations" && !loading && (
                    <span>{number.format(rows.length)}</span>
                  )}
                </button>
              ))}
            </nav>
            {tab !== "menu" && (
              <div className="staff-date-row">
                <label htmlFor="staff-day">
                  <CalendarDays />
                  {fullDate}
                </label>
                <input
                  id="staff-day"
                  aria-label="تاریخ نمایش"
                  type="date"
                  value={day}
                  onChange={(e) => {
                    if (e.target.value) {
                      setLoading(true);
                      setRows([]);
                      setError("");
                      setDay(e.target.value);
                    }
                  }}
                  disabled={busy || !!pending}
                />
              </div>
            )}
            {!session.venues.length ? (
              <section className="staff-empty">
                <h2>مکانی به شما واگذار نشده است</h2>
                <p>برای دریافت دسترسی با مدیر کافه هماهنگ کنید.</p>
              </section>
            ) : (
              <>
                {tab === "menu" && (
                  <MenuPanel
                    key={venue}
                    venue={venue}
                    userId={session.user.id}
                    onUnauthorized={unauthorized}
                  />
                )}
                {tab === "orders" && (
                  <OrdersPanel
                    key={`${venue}.${day}`}
                    venue={venue}
                    day={day}
                    userId={session.user.id}
                    onUnauthorized={unauthorized}
                  />
                )}
                {tab === "reservations" && (
                  <section className="staff-section" aria-label="رزروهای روز">
                    <div className="staff-section-title">
                      <div>
                        <h2>مهمان‌های این روز</h2>
                        <p>رزروها و حضور مهمان‌ها در یک نگاه.</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadRows}
                        disabled={loading || busy}
                      >
                        <RefreshCw /> تازه‌سازی
                      </Button>
                    </div>
                    {!loading && rows.length > 0 && (
                      <div className="staff-attendance">
                        <div>
                          <strong>
                            {number.format(
                              rows.filter((row) => row.status === "checked_in")
                                .length,
                            )}
                          </strong>
                          <span>پذیرش‌شده</span>
                        </div>
                        <div>
                          <strong>
                            {number.format(
                              rows.filter((row) => row.status === "confirmed")
                                .length,
                            )}
                          </strong>
                          <span>در انتظار ورود</span>
                        </div>
                        <div>
                          <strong>
                            {number.format(
                              rows
                                .filter((row) => row.status !== "cancelled")
                                .reduce((sum, row) => sum + row.guests, 0),
                            )}
                          </strong>
                          <span>مهمان</span>
                        </div>
                      </div>
                    )}
                    {error && (
                      <Alert role="alert" variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    {pending && (
                      <div className="staff-recovery" role="status">
                        <span>نتیجه آخرین درخواست هنوز بررسی نشده است.</span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() => void runCommand(pending)}
                        >
                          بازیابی نتیجه
                        </Button>
                      </div>
                    )}
                    <div className="staff-toolbar">
                      <label className="staff-search">
                        <Search />
                        <input
                          aria-label="جست‌وجوی رزرو"
                          placeholder="جست‌وجوی مهمان، تلفن یا کد رزرو…"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                        />
                      </label>
                      <select
                        aria-label="وضعیت رزرو"
                        className="staff-status-filter"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                      >
                        <option value="all">همه وضعیت‌ها</option>
                        <option value="confirmed">در انتظار ورود</option>
                        <option value="checked_in">پذیرش‌شده</option>
                        <option value="cancelled">لغوشده</option>
                      </select>
                    </div>
                    {loading ? (
                      <section className="staff-empty" role="status">
                        در حال دریافت رزروها…
                      </section>
                    ) : !rows.length && !error ? (
                      <section className="staff-empty">
                        <CalendarDays />
                        <h3>هنوز برای این روز رزروی نیست</h3>
                        <p>
                          رزروهای ثبت‌شده این کافه اینجا نمایش داده می‌شوند.
                        </p>
                        <Link
                          href={`/cafe/${venue}`}
                          className="staff-text-link"
                        >
                          دیدن صفحه کافه <ArrowUpLeft />
                        </Link>
                      </section>
                    ) : !filtered.length && !error ? (
                      <section className="staff-empty">
                        <Search />
                        <h3>رزروی با این مشخصات پیدا نشد</h3>
                        <p>نام، کد رزرو یا فیلتر وضعیت را تغییر دهید.</p>
                      </section>
                    ) : (
                      filtered.length > 0 && (
                        <div className="staff-reservation-table">
                          <table>
                            <thead>
                              <tr>
                                {[
                                  "مهمان",
                                  "زمان",
                                  "میز و نفرات",
                                  "وضعیت",
                                  "",
                                ].map((heading, index) => (
                                  <th scope="col" key={index}>
                                    {heading}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {filtered.map((row) => {
                                const checkInAllowed =
                                  now >=
                                    Date.parse(row.startsAt) - 30 * 60000 &&
                                  now <= Date.parse(row.endsAt);
                                return (
                                  <tr key={row.id}>
                                    <td>
                                      <div className="staff-guest-info">
                                        <span className="staff-avatar">
                                          <UserRound />
                                        </span>
                                        <div>
                                          <strong>{row.guestName}</strong>
                                          <a
                                            href={`tel:${row.guestPhone}`}
                                            dir="ltr"
                                          >
                                            {row.guestPhone}
                                          </a>
                                          <small dir="ltr">#{row.code}</small>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="staff-time">
                                      <span className="staff-mobile-label">
                                        زمان
                                      </span>
                                      {label(row)}
                                    </td>
                                    <td>
                                      <span className="staff-table-number">
                                        میز {number.format(row.tableId)}
                                      </span>
                                      <span className="staff-people">
                                        <Users />
                                        {number.format(row.guests)} نفر
                                      </span>
                                    </td>
                                    <td>
                                      <span
                                        className={`staff-badge ${row.status === "cancelled" ? "quiet" : ""}`}
                                      >
                                        {row.status === "checked_in"
                                          ? "پذیرش‌شده"
                                          : row.status === "cancelled"
                                            ? "لغوشده"
                                            : "در انتظار ورود"}
                                      </span>
                                    </td>
                                    <td>
                                      <div className="staff-row-actions">
                                        {row.status === "confirmed" ? (
                                          <>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              disabled={
                                                busy ||
                                                !!pending ||
                                                !checkInAllowed
                                              }
                                              title={
                                                checkInAllowed
                                                  ? "ثبت حضور مهمان"
                                                  : "ورود از ۳۰ دقیقه پیش از رزرو ممکن است"
                                              }
                                              onClick={() =>
                                                void runCommand({
                                                  id: row.id,
                                                  action: "check-in",
                                                  key: crypto.randomUUID(),
                                                })
                                              }
                                            >
                                              <Check /> ورود
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              aria-label={`لغو رزرو ${row.guestName}`}
                                              disabled={busy || !!pending}
                                              onClick={() => setCancelling(row)}
                                            >
                                              <X />
                                            </Button>
                                          </>
                                        ) : (
                                          row.status === "checked_in" && (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              disabled={
                                                now > Date.parse(row.endsAt)
                                              }
                                              onClick={() => setOrdering(row)}
                                            >
                                              ثبت سفارش
                                            </Button>
                                          )
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )
                    )}
                    <p className="staff-footnote">
                      ورود مهمان از ۳۰ دقیقه پیش از شروع رزرو تا پایان آن
                      امکان‌پذیر است.
                    </p>
                  </section>
                )}
                <OrderComposer
                  key={`${venue}.${ordering?.id ?? "closed"}`}
                  venue={venue}
                  userId={session.user.id}
                  reservation={ordering}
                  onClose={() => setOrdering(null)}
                  onUnauthorized={unauthorized}
                  onCreated={() => setTab("orders")}
                />
              </>
            )}
          </main>
          <Dialog
            open={!!cancelling}
            onOpenChange={(open) => {
              if (!open) setCancelling(null);
            }}
          >
            <DialogContent className="staff-dialog" dir="rtl" closeLabel="بستن">
              <DialogHeader>
                <DialogTitle>لغو رزرو {cancelling?.guestName}</DialogTitle>
                <DialogDescription>
                  رزرو میز {number.format(cancelling?.tableId ?? 0)} لغو و ظرفیت
                  آن آزاد می‌شود.
                </DialogDescription>
              </DialogHeader>
              <Button
                variant="destructive"
                disabled={busy}
                onClick={() => {
                  if (cancelling)
                    void runCommand({
                      id: cancelling.id,
                      action: "cancel",
                      key: crypto.randomUUID(),
                    });
                }}
              >
                لغو رزرو
              </Button>
              <Button variant="outline" onClick={() => setCancelling(null)}>
                بازگشت
              </Button>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
