// Demonstration choices, not the cafe's published hours or live availability.
export const DEMO_TIMES = ["16:00", "17:00", "18:00", "19:00"];

export function visitDays(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type) => parts.find((p) => p.type === type).value;
  const today = Date.UTC(
    Number(part("year")),
    Number(part("month")) - 1,
    Number(part("day")),
    12,
  );
  return Array.from({ length: 3 }, (_, index) => {
    const date = new Date(today + index * 86400000);
    return { id: date.toISOString().slice(0, 10), date };
  });
}

export function validDemoChoice(choice, capacity, now = new Date()) {
  return (
    Number.isInteger(choice.guests) &&
    choice.guests >= 1 &&
    choice.guests <= capacity &&
    DEMO_TIMES.includes(choice.time) &&
    visitDays(now).some((day) => day.id === choice.day)
  );
}
