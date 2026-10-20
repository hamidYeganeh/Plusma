/** A conservative starting budget; measured slow frames can reduce it further. */
export function initialRenderQuality({
  compact,
  cores,
  memory,
  saveData = false,
}) {
  const economy =
    saveData || (cores > 0 && cores <= 4) || (memory > 0 && memory <= 4);
  return {
    pixelRatio: economy ? 0.85 : compact ? 1.1 : 1.5,
    reflections: !compact && !economy,
    shadows: !economy,
    shadowSize: compact || economy ? 512 : 1024,
    textureSize: compact || economy ? 512 : 1024,
    foliageStep: economy ? 2 : 1,
    targetFps: economy ? 30 : 60,
  };
}

export function needsLighterRendering(frameTimes) {
  if (frameTimes.length < 90) return false;
  const sorted = [...frameTimes].sort((a, b) => a - b);
  // Ignore isolated long tasks and deliberate idle throttling; caller samples active frames only.
  return sorted[Math.floor(sorted.length / 2)] > 38;
}
