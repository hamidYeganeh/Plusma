import { useEffect, useState } from "react";
import {
  ClipboardList,
  Coffee,
  Plus,
  RefreshCw,
  Search,
  Minus,
  Pencil,
  Check,
} from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@repo/ui/components/dialog";
import type {
  CafeMenuItem,
  CafeOrder,
  CafeOrderStatus,
  Reservation,
} from "@repo/contracts";
import { money, number, request, message, RequestError } from "./staff-client";
import { useCommand } from "./use-command";
type Context = { venue: string; userId: string; onUnauthorized: () => void };
const statuses: Record<CafeOrderStatus, string> = {
  placed: "ثبت‌شده",
  preparing: "در حال آماده‌سازی",
  ready: "آماده تحویل",
  served: "تحویل‌شده",
  cancelled: "لغوشده",
};
const nextStatus: Partial<
  Record<CafeOrderStatus, { status: CafeOrderStatus; label: string }>
> = {
  placed: { status: "preparing", label: "شروع آماده‌سازی" },
  preparing: { status: "ready", label: "آماده شد" },
  ready: { status: "served", label: "تحویل به مهمان" },
};
function ErrorMessage({ text }: { text: string }) {
  return text ? (
    <Alert role="alert" variant="destructive">
      <AlertDescription>{text}</AlertDescription>
    </Alert>
  ) : null;
}
function Pending({ busy, retry }: { busy: boolean; retry: () => void }) {
  return (
    <div className="staff-recovery" role="status">
      <span>نتیجه درخواست قبلی هنوز مشخص نشده است.</span>
      <Button size="sm" variant="outline" onClick={retry} disabled={busy}>
        بازیابی نتیجه
      </Button>
    </div>
  );
}
function useList<T>(path: string, onUnauthorized: () => void) {
  const [rows, setRows] = useState<T[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    request<T[]>(path, { signal: abort.signal })
      .then((data) => {
        if (!abort.signal.aborted) setRows(data);
      })
      .catch((value) => {
        if (!abort.signal.aborted) {
          setError(message(value));
          if (value instanceof RequestError && value.status === 401)
            onUnauthorized();
        }
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [path, revision, onUnauthorized]);
  function refresh() {
    setLoading(true);
    setError("");
    setRows([]);
    setRevision((value) => value + 1);
  }
  return { rows, loading, error, refresh };
}
export function MenuPanel({ venue, userId, onUnauthorized }: Context) {
  const base = `/venues/${encodeURIComponent(venue)}/menu`;
  const { rows, loading, error, refresh } = useList<CafeMenuItem>(
    base,
    onUnauthorized,
  );
  const [query, setQuery] = useState(""),
    [editor, setEditor] = useState<CafeMenuItem | null>(null),
    [open, setOpen] = useState(false);
  const [name, setName] = useState(""),
    [category, setCategory] = useState(""),
    [price, setPrice] = useState(""),
    [available, setAvailable] = useState(true);
  const command = useCommand<CafeMenuItem>(
    `plusma.staff.menu.${userId}.${venue}`,
    () => {
      setOpen(false);
      refresh();
    },
    onUnauthorized,
  );
  function edit(item?: CafeMenuItem) {
    setEditor(item ?? null);
    setName(item?.name ?? "");
    setCategory(item?.category ?? "");
    setPrice(item ? String(item.priceRials / 10) : "");
    setAvailable(item?.isAvailable ?? true);
    setOpen(true);
  }
  const filtered = rows.filter((item) =>
    `${item.name} ${item.category}`.includes(query.trim()),
  );
  return (
    <section className="staff-section" aria-label="مدیریت منو">
      <div className="staff-section-title">
        <div>
          <h2>منوی کافه</h2>
          <p>آیتم‌ها، قیمت‌ها و موجودی امروز.</p>
        </div>
        <Button onClick={() => edit()} disabled={!!command.pending}>
          <Plus /> افزودن آیتم
        </Button>
      </div>
      <ErrorMessage text={error || command.error} />
      {command.pending && !command.busy && (
        <Pending busy={command.busy} retry={command.retry} />
      )}
      <div className="staff-toolbar">
        <label className="staff-search">
          <Search />
          <input
            aria-label="جست‌وجوی منو"
            placeholder="جست‌وجو در منو…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <span className="staff-count">{number.format(rows.length)} آیتم</span>
        <Button
          variant="ghost"
          size="icon"
          aria-label="تازه‌سازی منو"
          onClick={refresh}
          disabled={loading}
        >
          <RefreshCw />
        </Button>
      </div>
      {loading ? (
        <div className="staff-empty" role="status">
          در حال دریافت منو…
        </div>
      ) : !rows.length && !error ? (
        <div className="staff-empty">
          <Coffee />
          <h3>منوی شما از اینجا شروع می‌شود</h3>
          <p>اولین آیتم را با قیمت و دسته‌بندی خودتان اضافه کنید.</p>
          <Button
            variant="outline"
            onClick={() => edit()}
            disabled={!!command.pending}
          >
            <Plus /> افزودن اولین آیتم
          </Button>
        </div>
      ) : !filtered.length && !error ? (
        <div className="staff-empty">آیتمی با این نام پیدا نشد.</div>
      ) : (
        <div className="staff-menu-list">
          {filtered.map((item) => (
            <article className="staff-menu-row" key={item.id}>
              <div className="staff-item-icon">
                <Coffee />
              </div>
              <div className="staff-item-info">
                <h3>{item.name}</h3>
                <p>
                  {item.category} <span>·</span>{" "}
                  {item.isAvailable ? "موجود" : "ناموجود"}
                </p>
              </div>
              <strong className="staff-price">{money(item.priceRials)}</strong>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`ویرایش ${item.name}`}
                onClick={() => edit(item)}
                disabled={!!command.pending}
              >
                <Pencil />
              </Button>
            </article>
          ))}
        </div>
      )}
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!command.pending && !command.busy) setOpen(value);
        }}
      >
        <DialogContent className="staff-dialog" dir="rtl" closeLabel="بستن">
          <DialogHeader>
            <DialogTitle>{editor ? "ویرایش آیتم" : "آیتم جدید"}</DialogTitle>
            <DialogDescription>
              قیمت به تومان برای همین کافه ثبت می‌شود.
            </DialogDescription>
          </DialogHeader>
          <form
            className="staff-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (command.pending) return;
              void command.run({
                path: editor ? `${base}/items/${editor.id}` : `${base}/items`,
                key: crypto.randomUUID(),
                body: {
                  id: editor?.id ?? crypto.randomUUID(),
                  name,
                  category,
                  priceRials: Number(price) * 10,
                  isAvailable: available,
                  ...(editor ? { version: editor.version } : {}),
                },
              });
            }}
          >
            <label>
              نام آیتم
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                disabled={!!command.pending}
              />
            </label>
            <div className="staff-form-grid">
              <label>
                دسته‌بندی
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  maxLength={60}
                  placeholder="مثلاً قهوه گرم"
                  disabled={!!command.pending}
                />
              </label>
              <label>
                قیمت (تومان)
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={100000000}
                  step={1}
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={!!command.pending}
                />
              </label>
            </div>
            <label className="staff-checkbox">
              <input
                type="checkbox"
                checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
                disabled={!!command.pending}
              />{" "}
              در منوی قابل سفارش موجود باشد
            </label>
            <ErrorMessage text={command.error} />
            {command.pending && !command.busy && (
              <Pending busy={command.busy} retry={command.retry} />
            )}
            <Button type="submit" disabled={command.busy || !!command.pending}>
              {command.busy
                ? "در حال ثبت…"
                : editor
                  ? "ذخیره تغییرات"
                  : "افزودن به منو"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
export function OrdersPanel({
  venue,
  userId,
  day,
  onUnauthorized,
}: Context & { day: string }) {
  const { rows, loading, error, refresh } = useList<CafeOrder>(
    `/venues/${encodeURIComponent(venue)}/orders?date=${encodeURIComponent(day)}`,
    onUnauthorized,
  );
  const [filter, setFilter] = useState("active");
  const [cancel, setCancel] = useState<CafeOrder | null>(null);
  const command = useCommand<CafeOrder>(
    `plusma.staff.order-status.${userId}.${venue}`,
    () => {
      setCancel(null);
      refresh();
    },
    onUnauthorized,
  );
  function transition(order: CafeOrder, status: CafeOrderStatus) {
    void command.run({
      path: `/orders/${order.id}/status`,
      key: crypto.randomUUID(),
      body: { status },
    });
  }
  const visible = rows.filter(
    (row) =>
      filter === "all" ||
      (filter === "active" && !["served", "cancelled"].includes(row.status)) ||
      row.status === filter,
  );
  return (
    <section className="staff-section" aria-label="مدیریت سفارش‌ها">
      <div className="staff-section-title">
        <div>
          <h2>سفارش‌های روز</h2>
          <p>از ثبت سفارش تا تحویل به مهمان.</p>
        </div>
        <span className="staff-count">{number.format(rows.length)} سفارش</span>
      </div>
      <ErrorMessage text={error || command.error} />
      {command.pending && !command.busy && (
        <Pending busy={command.busy} retry={command.retry} />
      )}
      <div className="staff-toolbar">
        <div className="staff-segments" aria-label="فیلتر سفارش‌ها">
          {[
            ["active", "در جریان"],
            ["served", "تحویل‌شده"],
            ["all", "همه"],
          ].map(([value, label]) => (
            <button
              key={value}
              aria-pressed={filter === value}
              onClick={() => setFilter(value!)}
            >
              {label}
            </button>
          ))}
        </div>
        <Button size="sm" variant="ghost" onClick={refresh} disabled={loading}>
          <RefreshCw /> تازه‌سازی
        </Button>
      </div>
      {loading ? (
        <div className="staff-empty" role="status">
          در حال دریافت سفارش‌ها…
        </div>
      ) : !visible.length && !error ? (
        <div className="staff-empty">
          <ClipboardList />
          <h3>
            {rows.length ? "سفارشی در این وضعیت نیست" : "هنوز سفارشی ثبت نشده"}
          </h3>
          <p>پس از ثبت حضور، از تب رزروها برای مهمان سفارش ثبت کنید.</p>
        </div>
      ) : (
        <div className="staff-orders">
          {visible.map((order) => (
            <article className="staff-order-card" key={order.id}>
              <header>
                <div>
                  <span className="staff-eyebrow">
                    میز {number.format(order.tableId)}
                  </span>
                  <h3>{order.guestName}</h3>
                  <small dir="ltr">#{order.code}</small>
                </div>
                <span
                  className={`staff-badge ${["served", "cancelled"].includes(order.status) ? "quiet" : ""}`}
                >
                  {statuses[order.status]}
                </span>
              </header>
              <ul>
                {order.items.map((item) => (
                  <li key={item.menuItemId}>
                    <span>
                      {number.format(item.quantity)} × {item.name}
                    </span>
                    <span>{money(item.unitPriceRials * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <footer>
                <div>
                  <small>مبلغ سفارش</small>
                  <strong>{money(order.totalRials)}</strong>
                </div>
                <div className="staff-row-actions">
                  {(order.status === "placed" ||
                    order.status === "preparing") && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={command.busy || !!command.pending}
                      onClick={() => setCancel(order)}
                    >
                      لغو سفارش
                    </Button>
                  )}
                  {nextStatus[order.status] && (
                    <Button
                      size="sm"
                      disabled={command.busy || !!command.pending}
                      onClick={() =>
                        transition(order, nextStatus[order.status]!.status)
                      }
                    >
                      <Check />
                      {nextStatus[order.status]!.label}
                    </Button>
                  )}
                </div>
              </footer>
            </article>
          ))}
        </div>
      )}
      <Dialog
        open={!!cancel}
        onOpenChange={(value) => {
          if (!value) setCancel(null);
        }}
      >
        <DialogContent className="staff-dialog" dir="rtl" closeLabel="بستن">
          <DialogHeader>
            <DialogTitle>
              لغو سفارش میز {number.format(cancel?.tableId ?? 0)}
            </DialogTitle>
            <DialogDescription>
              این سفارش از صف آماده‌سازی خارج می‌شود.
            </DialogDescription>
          </DialogHeader>
          <Button
            variant="destructive"
            disabled={command.busy || !!command.pending}
            onClick={() => {
              if (cancel) transition(cancel, "cancelled");
            }}
          >
            لغو سفارش
          </Button>
          <Button variant="outline" onClick={() => setCancel(null)}>
            بازگشت
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}
export function OrderComposer({
  venue,
  userId,
  reservation,
  onClose,
  onUnauthorized,
  onCreated,
}: Context & {
  reservation: Reservation | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { rows, loading, error, refresh } = useList<CafeMenuItem>(
    `/venues/${encodeURIComponent(venue)}/menu`,
    onUnauthorized,
  );
  const [cart, setCart] = useState<Record<string, number>>({}),
    [query, setQuery] = useState("");
  const command = useCommand<CafeOrder>(
    `plusma.staff.order-create.${userId}.${venue}`,
    () => {
      setCart({});
      onClose();
      onCreated();
    },
    onUnauthorized,
  );
  const available = rows.filter((item) => item.isAvailable),
    selected = available.filter((item) => cart[item.id]);
  const total = selected.reduce(
    (sum, item) => sum + item.priceRials * cart[item.id]!,
    0,
  );
  function quantity(item: CafeMenuItem, delta: number) {
    setCart((value) => ({
      ...value,
      [item.id]: Math.max(0, Math.min(20, (value[item.id] ?? 0) + delta)),
    }));
  }
  return (
    <>
      {command.pending && !command.busy && !reservation && (
        <Pending busy={command.busy} retry={command.retry} />
      )}
      {!reservation && <ErrorMessage text={command.error} />}
      <Dialog
        open={!!reservation}
        onOpenChange={(value) => {
          if (!value && !command.busy) onClose();
        }}
      >
        <DialogContent
          className="staff-dialog staff-composer"
          dir="rtl"
          closeLabel="بستن"
        >
          <DialogHeader>
            <DialogTitle>
              سفارش میز {number.format(reservation?.tableId ?? 0)}
            </DialogTitle>
            <DialogDescription>
              {reservation?.guestName} · انتخاب از منوی همین کافه
            </DialogDescription>
          </DialogHeader>
          <ErrorMessage text={error || command.error} />
          {command.pending && !command.busy && (
            <Pending busy={command.busy} retry={command.retry} />
          )}
          <label className="staff-search">
            <Search />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="جست‌وجوی آیتم سفارش"
              placeholder="نام آیتم یا دسته‌بندی…"
            />
          </label>
          <div className="staff-composer-items">
            {loading ? (
              <p role="status">در حال دریافت منو…</p>
            ) : !available.length && !error ? (
              <div className="staff-empty">
                <Coffee />
                <h3>آیتم قابل سفارشی وجود ندارد</h3>
                <p>از تب منو، آیتم‌های کافه را اضافه کنید.</p>
              </div>
            ) : (
              available
                .filter((item) =>
                  `${item.name} ${item.category}`.includes(query.trim()),
                )
                .map((item) => (
                  <div className="staff-compose-row" key={item.id}>
                    <div>
                      <h3>{item.name}</h3>
                      <p>{money(item.priceRials)}</p>
                    </div>
                    <div className="staff-quantity">
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={`کم کردن ${item.name}`}
                        disabled={!!command.pending || !cart[item.id]}
                        onClick={() => quantity(item, -1)}
                      >
                        <Minus />
                      </Button>
                      <output aria-label={`تعداد ${item.name}`}>
                        {number.format(cart[item.id] ?? 0)}
                      </output>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={`افزودن ${item.name}`}
                        disabled={
                          !!command.pending ||
                          (cart[item.id] ?? 0) >= 20 ||
                          (selected.length >= 20 && !cart[item.id])
                        }
                        onClick={() => quantity(item, 1)}
                      >
                        <Plus />
                      </Button>
                    </div>
                  </div>
                ))
            )}
          </div>
          <div className="staff-composer-total">
            <span>مجموع</span>
            <strong>{money(total)}</strong>
          </div>
          <Button
            disabled={!selected.length || command.busy || !!command.pending}
            onClick={() => {
              if (reservation)
                void command.run({
                  path: `/venues/${encodeURIComponent(venue)}/orders`,
                  key: crypto.randomUUID(),
                  body: {
                    reservationId: reservation.id,
                    items: selected.map((item) => ({
                      menuItemId: item.id,
                      quantity: cart[item.id],
                      version: item.version,
                    })),
                  },
                });
            }}
          >
            {command.busy ? "در حال ثبت…" : "ثبت سفارش"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCart({});
              refresh();
            }}
            disabled={!!command.pending || loading}
          >
            <RefreshCw /> دریافت قیمت و موجودی تازه
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
