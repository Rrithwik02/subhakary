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

const MONTHS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

/**
 * Parses free-text WhatsApp answers for "date"-type questions into an
 * ISO (YYYY-MM-DD) string the `date` DB column accepts. Returns null when
 * the input can't be confidently parsed, so the caller can re-prompt
 * instead of passing bad text straight into a `date` column insert.
 */
export function parseAnswerDate(input: string, now: Date = new Date()): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const iso = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return toIsoIfValid(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const numeric = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (numeric) return toIsoIfValid(Number(numeric[3]), Number(numeric[2]), Number(numeric[1]));

  const withMonthName = trimmed
    .toLowerCase()
    .match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]{3,})\.?,?\s*(\d{4})?$/);
  if (withMonthName) {
    const monthIndex = MONTHS.findIndex((month) => withMonthName[2].startsWith(month));
    if (monthIndex >= 0) {
      const year = withMonthName[3] ? Number(withMonthName[3]) : inferYear(monthIndex, Number(withMonthName[1]), now);
      return toIsoIfValid(year, monthIndex + 1, Number(withMonthName[1]));
    }
  }

  const monthFirst = trimmed
    .toLowerCase()
    .match(/^([a-z]{3,})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})?$/);
  if (monthFirst) {
    const monthIndex = MONTHS.findIndex((month) => monthFirst[1].startsWith(month));
    if (monthIndex >= 0) {
      const year = monthFirst[3] ? Number(monthFirst[3]) : inferYear(monthIndex, Number(monthFirst[2]), now);
      return toIsoIfValid(year, monthIndex + 1, Number(monthFirst[2]));
    }
  }

  return null;
}

function inferYear(monthIndex: number, day: number, now: Date): number {
  const candidate = new Date(now.getFullYear(), monthIndex, day);
  return candidate.getTime() < now.getTime() ? now.getFullYear() + 1 : now.getFullYear();
}

function toIsoIfValid(year: number, month: number, day: number): string | null {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Parses free-text WhatsApp answers for "number"-type questions (guest count, event days, etc). */
export function parseAnswerNumber(input: string): number | null {
  const match = input.replace(/,/g, "").match(/\d+/);
  if (!match) return null;
  const value = Number(match[0]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * Best-effort parse of a free-text budget answer (e.g. "under 50k",
 * "1 lakh - 2 lakh", "above 2,00,000") into a min/max range so provider
 * matching can actually use it. Returns nulls when nothing recognizable
 * is found, which is a safe no-op for the caller.
 */
export function parseBudgetRange(input: string): { min: number | null; max: number | null } {
  const normalized = input.toLowerCase().replace(/,/g, "");
  const tokens = [...normalized.matchAll(/(\d+(?:\.\d+)?)\s*(lakh|lakhs|l|k)?/g)]
    .filter((match) => match[1] !== undefined)
    .map((match) => {
      const value = Number(match[1]);
      const unit = match[2];
      if (unit === "lakh" || unit === "lakhs" || unit === "l") return value * 100000;
      if (unit === "k") return value * 1000;
      return value;
    })
    .filter((value) => Number.isFinite(value) && value > 0);

  if (!tokens.length) return { min: null, max: null };

  if (tokens.length >= 2) {
    return { min: Math.min(tokens[0], tokens[1]), max: Math.max(tokens[0], tokens[1]) };
  }

  const isFloor = /(above|over|more than|min(?:imum)?)/.test(normalized);
  return isFloor ? { min: tokens[0], max: null } : { min: null, max: tokens[0] };
}

