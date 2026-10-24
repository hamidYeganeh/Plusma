import { useEffect, useState } from "react";
import {
  CoffeeIcon,
  RefreshCwIcon,
  SearchIcon,
  UtensilsIcon,
} from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import type { CafeMenuItem } from "@repo/contracts";
import "./cafe-menu.css";
const money = (rials: number) =>
  `${new Intl.NumberFormat("fa").format(rials / 10)} تومان`;
export function CafeMenu({
  slug,
  name,
  onActiveChange,
}: {
  slug: string;
  name: string;
  onActiveChange: (active: boolean) => void;
}) {
  const [open, setOpen] = useState(false),
    [items, setItems] = useState<CafeMenuItem[]>([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState(""),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!open) return;
    const abort = new AbortController();
    fetch(`/api/v1/public/venues/${encodeURIComponent(slug)}/menu`, {
      cache: "no-store",
      signal: AbortSignal.any([abort.signal, AbortSignal.timeout(15000)]),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Menu unavailable");
        return response.json() as Promise<CafeMenuItem[]>;
      })
      .then((result) => {
        if (!abort.signal.aborted) setItems(result);
      })
      .catch(() => {
        if (!abort.signal.aborted)
          setError("دریافت منو ممکن نشد. دوباره تلاش کنید.");
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [open, slug, revision]);
  const visible = items.filter(
    (item) =>
      (!category || item.category === category) &&
      `${item.name} ${item.category}`.includes(query.trim()),
  );
  const categories = Array.from(new Set(items.map((item) => item.category)));
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        onActiveChange(value);
        if (value) {
          setLoading(true);
          setItems([]);
          setError("");
          setCategory("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="cafe-menu-trigger"
          aria-label="منوی کافه"
        >
          <UtensilsIcon />
          <span>منوی کافه</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        className="cafe-menu-dialog"
        dir="rtl"
        closeLabel="بستن منو"
      >
        <DialogHeader>
          <span className="cafe-menu-eyebrow">{name}</span>
          <DialogTitle>چیزی برای حال خوب</DialogTitle>
          <DialogDescription>
            منو و قیمت‌های کافه؛ سفارش پس از ورود از طریق پذیرش ثبت می‌شود.
          </DialogDescription>
        </DialogHeader>
        <label className="cafe-menu-search">
          <SearchIcon />
          <input
            aria-label="جست‌وجوی منوی کافه"
            placeholder="دنبال چی می‌گردید؟"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {categories.length > 0 && (
          <nav className="cafe-menu-categories" aria-label="دسته‌بندی منو">
            <button aria-pressed={!category} onClick={() => setCategory("")}>
              همه
            </button>
            {categories.map((value) => (
              <button
                key={value}
                aria-pressed={category === value}
                onClick={() => setCategory(value)}
              >
                {value}
              </button>
            ))}
          </nav>
        )}
        {error ? (
          <Alert role="alert" variant="destructive">
            <AlertDescription>
              {error}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLoading(true);
                  setError("");
                  setRevision((value) => value + 1);
                }}
              >
                <RefreshCwIcon /> تلاش دوباره
              </Button>
            </AlertDescription>
          </Alert>
        ) : loading ? (
          <div className="cafe-menu-empty" role="status">
            در حال دریافت منو…
          </div>
        ) : !items.length ? (
          <div className="cafe-menu-empty">
            <CoffeeIcon />
            <h3>منو هنوز منتشر نشده</h3>
            <p>برای اطلاع از آیتم‌ها از کارکنان کافه بپرسید.</p>
          </div>
        ) : !visible.length ? (
          <div className="cafe-menu-empty">آیتمی با این مشخصات پیدا نشد.</div>
        ) : (
          <div className="cafe-menu-items">
            {Array.from(new Set(visible.map((item) => item.category))).map(
              (group) => (
                <section key={group}>
                  <h3>{group}</h3>
                  {visible
                    .filter((item) => item.category === group)
                    .map((item) => (
                      <article key={item.id}>
                        <div>
                          <h4>{item.name}</h4>
                          <span>{item.category}</span>
                        </div>
                        <strong>{money(item.priceRials)}</strong>
                      </article>
                    ))}
                </section>
              ),
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
