/** Unique enough for on-device records (not a security token). */
export function localId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
