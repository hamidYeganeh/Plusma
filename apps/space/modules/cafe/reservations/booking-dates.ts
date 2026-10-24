/** Calendar choices use the venue's day; timestamps are supplied by the backend. */
export function visitDays(now = new Date(), timeZone = "Asia/Tehran") {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) =>
    parts.find((item) => item.type === type)!.value;
  const today = Date.UTC(
    Number(part("year")),
    Number(part("month")) - 1,
    Number(part("day")),
    12,
  );
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today + index * 86400000);
    return { id: date.toISOString().slice(0, 10), date };
  });
}
