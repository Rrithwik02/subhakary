export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "").replace(/^\+?/, "+").replace(/\++/g, "+");
}

export function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export function clampSelection<T>(values: T[], max: number): T[] {
  return values.slice(0, Math.max(0, max));
}

export function ensureArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

