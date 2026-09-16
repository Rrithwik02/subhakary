import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { parseAnswerDate, parseAnswerNumber, parseBudgetRange } from "./validation.ts";

const NOW = new Date(2026, 8, 16); // 2026-09-16, matches this project's "today"

Deno.test("parseAnswerDate accepts ISO, DD-MM-YYYY, and month-name formats", () => {
  assertEquals(parseAnswerDate("2026-12-25", NOW), "2026-12-25");
  assertEquals(parseAnswerDate("25-12-2026", NOW), "2026-12-25");
  assertEquals(parseAnswerDate("25/12/2026", NOW), "2026-12-25");
  assertEquals(parseAnswerDate("25th December 2026", NOW), "2026-12-25");
  assertEquals(parseAnswerDate("Dec 25 2026", NOW), "2026-12-25");
  assertEquals(parseAnswerDate("15 Dec", NOW), "2026-12-15");
});

Deno.test("parseAnswerDate infers next year for a same-day-of-year date already passed", () => {
  // NOW is 2026-09-16, so "10 Jan" with no year must mean 2027, not 2026.
  assertEquals(parseAnswerDate("10 Jan", NOW), "2027-01-10");
  // "1 Oct" is still ahead of NOW within the same year, so it stays 2026.
  assertEquals(parseAnswerDate("1 Oct", NOW), "2026-10-01");
});

Deno.test("parseAnswerDate rejects free text and out-of-range dates instead of guessing", () => {
  assertEquals(parseAnswerDate("sometime next month", NOW), null);
  assertEquals(parseAnswerDate("", NOW), null);
  assertEquals(parseAnswerDate("32-01-2026", NOW), null);
  assertEquals(parseAnswerDate("25-13-2026", NOW), null);
  assertEquals(parseAnswerDate("2026-02-30", NOW), null); // Feb has no 30th
});

Deno.test("parseAnswerNumber extracts digits and rejects non-numeric text", () => {
  assertEquals(parseAnswerNumber("150"), 150);
  assertEquals(parseAnswerNumber("1,500"), 1500);
  assertEquals(parseAnswerNumber("about 200 guests"), 200);
  assertEquals(parseAnswerNumber("not sure"), null);
  assertEquals(parseAnswerNumber("0"), null); // must be positive
});

Deno.test("parseBudgetRange reads lakh/k units and above/under phrasing", () => {
  assertEquals(parseBudgetRange("under 50k"), { min: null, max: 50000 });
  assertEquals(parseBudgetRange("above 2 lakh"), { min: 200000, max: null });
  assertEquals(parseBudgetRange("1 lakh - 2 lakh"), { min: 100000, max: 200000 });
  assertEquals(parseBudgetRange("2,00,000"), { min: null, max: 200000 });
});

Deno.test("parseBudgetRange does not misread a word starting with l/k as a unit", () => {
  // "1 later" must not be read as "1 lakh" (100000) — regression test for
  // the (?![a-z]) boundary guard.
  assertEquals(parseBudgetRange("I'll decide 1 later"), { min: null, max: 1 });
  assertEquals(parseBudgetRange("no idea yet"), { min: null, max: null });
});
