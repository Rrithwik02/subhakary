const LOCATION_ALIASES: Record<string, string> = {
  hyd: "hyderabad",
  hyderabad: "hyderabad",
  bangalore: "bengaluru",
  bengaluru: "bengaluru",
  blr: "bengaluru",
  vizag: "visakhapatnam",
  visakhapatnam: "visakhapatnam",
  sec: "secunderabad",
  secunderabad: "secunderabad",
};

const TITLE_CASE_OVERRIDES: Record<string, string> = {
  hyderabad: "Hyderabad",
  bengaluru: "Bengaluru",
  visakhapatnam: "Visakhapatnam",
  secunderabad: "Secunderabad",
};

const normalizeKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ");

export function normalizeLocation(value: string | null | undefined): string {
  if (!value) return "";
  const key = normalizeKey(value);
  return LOCATION_ALIASES[key] || key;
}

export function displayLocationName(value: string | null | undefined): string {
  const normalized = normalizeLocation(value);
  if (!normalized) return "";
  return TITLE_CASE_OVERRIDES[normalized] || normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function locationMatches(actual: string | null | undefined, expected: string | null | undefined): boolean {
  if (!expected) return true;
  if (!actual) return false;

  const actualNormalized = normalizeLocation(actual);
  const expectedNormalized = normalizeLocation(expected);

  return (
    actualNormalized === expectedNormalized ||
    actualNormalized.includes(expectedNormalized) ||
    expectedNormalized.includes(actualNormalized)
  );
}

export function getLocationSearchTerms(value: string | null | undefined): string[] {
  const normalized = normalizeLocation(value);
  if (!normalized) return [];

  const terms = new Set([normalized]);
  if (normalized === "hyderabad") {
    terms.add("hyd");
  }
  if (normalized === "bengaluru") {
    terms.add("bangalore");
    terms.add("blr");
  }
  if (normalized === "visakhapatnam") {
    terms.add("vizag");
  }
  if (normalized === "secunderabad") {
    terms.add("sec");
  }

  return Array.from(terms);
}
