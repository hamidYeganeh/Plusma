"use client";

import { useEffect, useRef } from "react";
import { joystickVector } from "@repo/spatial";

type Props = {
  onMove: (value: { x: number; y: number }) => void;
  onFocusScene: () => void;
  label: string;
};
export function Joystick({ onMove, onFocusScene, label }: Props) {
  const root = useRef<HTMLDivElement>(null),
    stick = useRef<HTMLSpanElement>(null),
    pointer = useRef<number | null>(null);
  const callback = useRef(onMove);
  useEffect(() => {
    callback.current = onMove;
  }, [onMove]);
  function reset() {
    pointer.current = null;
    if (stick.current) stick.current.style.transform = "";
    callback.current({ x: 0, y: 0 });
  }
  useEffect(() => {
    const abort = new AbortController();
    window.addEventListener("blur", reset, { signal: abort.signal });
    document.addEventListener("visibilitychange", reset, {
      signal: abort.signal,
    });
    return () => {
      abort.abort();
      callback.current({ x: 0, y: 0 });
    };
  }, []);
  function move(event: React.PointerEvent<HTMLDivElement>) {
    if (pointer.current !== event.pointerId || !root.current || !stick.current)
      return;
    const rect = root.current.getBoundingClientRect(),
      value = joystickVector(
        event.clientX - rect.left - rect.width / 2,
        event.clientY - rect.top - rect.height / 2,
      );
    stick.current.style.transform = `translate(${value.knobX}px, ${value.knobY}px)`;
    onMove({ x: value.x, y: value.y });
  }
  function finish(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerId === pointer.current) reset();
  }
  return (
    <div
      ref={root}
      className="joystick"
      aria-label={label}
      role="group"
      onPointerDown={(event) => {
        if (pointer.current !== null) return;
        event.preventDefault();
        onFocusScene();
        pointer.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        move(event);
      }}
      onPointerMove={move}
      onPointerUp={finish}
      onPointerCancel={finish}
      onLostPointerCapture={finish}
    >
      <span ref={stick} />
    </div>
  );
}
