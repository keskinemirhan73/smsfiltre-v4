export const MIN_BRAND_SPLASH_DURATION_MS = 1800;

export function getRemainingSplashDuration(
  startedAt: number,
  currentTime: number,
): number {
  const elapsed = Math.max(0, currentTime - startedAt);
  return Math.max(0, MIN_BRAND_SPLASH_DURATION_MS - elapsed);
}
