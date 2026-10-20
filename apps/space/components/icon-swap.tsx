import type { LucideIcon } from "lucide-react";

export function IconSwap({
  active,
  first: First,
  second: Second,
}: {
  active: boolean;
  first: LucideIcon;
  second: LucideIcon;
}) {
  return (
    <span
      className="t-icon-swap"
      data-state={active ? "b" : "a"}
      aria-hidden="true"
    >
      <span className="t-icon" data-icon="a">
        <First />
      </span>
      <span className="t-icon" data-icon="b">
        <Second />
      </span>
    </span>
  );
}
