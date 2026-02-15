export function formatNumber(value: number, digits = 1): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

  const abs = Math.abs(value);
  const units = ["", "K", "M", "B", "T"];
  let scaled = abs;
  let unitIndex = 0;

  while (scaled >= 1000 && unitIndex < units.length - 1) {
    scaled /= 1000;
    unitIndex += 1;
  }

  const fraction =
    unitIndex === 0
      ? digits
      : scaled >= 100
        ? 0
        : scaled >= 10
          ? 1
          : 2;
  const rounded = scaled.toFixed(fraction).replace(/\.0+$|(\.\d*[1-9])0+$/u, "$1");
  const sign = value < 0 ? "-" : "";

  return `${sign}${rounded}${units[unitIndex]}`;
}

export function formatRate(value: number): string {
  return `${formatNumber(value, 2)}/s`;
}

export function formatDuration(secondsInput: number): string {
  const seconds = Math.max(0, Math.floor(secondsInput));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  if (minutes > 0) {
    return `${minutes}분 ${remainingSeconds}초`;
  }
  return `${remainingSeconds}초`;
}
