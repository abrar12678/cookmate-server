/**
 * Escapes special regex characters in a string to prevent regex injection attacks (ReDoS).
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
