import type { NdaFormData, Party } from "./types";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Format an ISO `yyyy-mm-dd` date as "January 5, 2026".
 *
 * Parsed by hand rather than via `new Date(iso)`, which reads a bare date as
 * UTC midnight and so renders the previous day for viewers behind UTC.
 */
export function formatDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return "";
  const [, year, month, day] = match;
  const name = MONTHS[Number(month) - 1];
  return name ? `${name} ${Number(day)}, ${year}` : "";
}

/**
 * A slot on the Cover Page, plus whether the user has supplied it.
 *
 * Unsupplied slots still carry the bracketed prompt text from the template, so
 * an incomplete document reads like the blank form rather than silently
 * dropping a term. `filled` lets each renderer style the two states apart.
 */
export type Value = { text: string; filled: boolean };

const valueOr = (input: string, prompt: string): Value => {
  const text = input.trim();
  return text ? { text, filled: true } : { text: `[${prompt}]`, filled: false };
};

const pluralYears = (years: number) => `${years} year${years === 1 ? "" : "s"}`;

/** Display values for every filled slot on the Cover Page. */
export function coverPageValues(data: NdaFormData) {
  return {
    purpose: valueOr(data.purpose, "Purpose"),
    effectiveDate: valueOr(formatDate(data.effectiveDate), "Today’s date"),
    governingLaw: valueOr(data.governingLaw, "Fill in state"),
    jurisdiction: valueOr(
      data.jurisdiction,
      "Fill in city or county and state, i.e. “courts located in New Castle, DE”",
    ),
    // Optional, so an empty value is a real answer ("None") rather than a
    // bracketed prompt for something still missing.
    modifications: data.modifications.trim()
      ? { text: data.modifications.trim(), filled: true }
      : { text: "None", filled: false },
    /** Years shown on the MNDA Term line, whichever option is selected. */
    ndaTermYears: pluralYears(
      data.ndaTerm.kind === "expires" ? data.ndaTerm.years : 1,
    ),
    confidentialityYears: pluralYears(
      data.confidentialityTerm.kind === "years"
        ? data.confidentialityTerm.years
        : 1,
    ),
  };
}

/** Signature-block values for one party, with prompts for blanks. */
export const partyValues = (party: Party) => ({
  companyName: valueOr(party.companyName, "Company"),
  signatoryName: valueOr(party.signatoryName, "Print Name"),
  signatoryTitle: valueOr(party.signatoryTitle, "Title"),
  noticeAddress: valueOr(party.noticeAddress, "Notice Address"),
});
