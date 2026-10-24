export function joystickVector(dx, dy, max = 36, deadZone = 0.13) {
  const length = Math.hypot(dx, dy),
    distance = Math.min(length, max),
    strength =
      length <= max * deadZone
        ? 0
        : (distance / max - deadZone) / (1 - deadZone);
  const nx = length ? dx / length : 0,
    ny = length ? dy / length : 0;
  return {
    x: nx * strength,
    y: -ny * strength,
    knobX: nx * distance,
    knobY: ny * distance,
  };
}
