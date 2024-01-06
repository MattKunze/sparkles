export function formatDuration(
  duration: number,
  precision: "strict" | "human"
) {
  if (precision === "strict" || duration < 1000) {
    return `${duration}ms`;
  }

  const seconds = duration / 1000;
  return `${seconds.toFixed(1)}s`.replace(/\.0s$/, "s");
}
