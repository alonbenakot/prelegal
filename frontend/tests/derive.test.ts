import { describe, expect, it } from "vitest";

import { coverPageValues, formatDate, partyValues } from "@/lib/nda/derive";
import { createDefaultFormData } from "@/lib/nda/defaults";
import type { NdaFormData } from "@/lib/nda/types";

const filled = (overrides: Partial<NdaFormData> = {}): NdaFormData => ({
  ...createDefaultFormData(),
  effectiveDate: "2026-09-05",
  governingLaw: "Delaware",
  jurisdiction: "New Castle, DE",
  ...overrides,
});

describe("formatDate", () => {
  it("formats an ISO date as a long-form date", () => {
    expect(formatDate("2026-09-05")).toBe("September 5, 2026");
  });

  it("does not shift the day for viewers behind UTC", () => {
    // `new Date("2026-01-01")` is UTC midnight, which is Dec 31 in the
    // Americas. Parsing the string by hand is what prevents that.
    expect(formatDate("2026-01-01")).toBe("January 1, 2026");
    expect(formatDate("2026-12-31")).toBe("December 31, 2026");
  });

  it("returns empty for anything that is not an ISO date", () => {
    for (const input of ["", "not a date", "09/05/2026", "2026-13-01"]) {
      expect(formatDate(input), input).toBe("");
    }
  });
});

describe("coverPageValues", () => {
  it("marks supplied values as filled", () => {
    const values = coverPageValues(filled());
    expect(values.governingLaw).toEqual({ text: "Delaware", filled: true });
    expect(values.effectiveDate).toEqual({
      text: "September 5, 2026",
      filled: true,
    });
  });

  it("falls back to a bracketed prompt for a blank required field", () => {
    const values = coverPageValues(filled({ governingLaw: "   " }));
    expect(values.governingLaw.filled).toBe(false);
    expect(values.governingLaw.text).toBe("[Fill in state]");
  });

  it("reads blank modifications as “None”, not as a missing value", () => {
    // Modifications are optional, so an empty value is a real answer and must
    // not render as a bracketed prompt for something still outstanding.
    const blank = coverPageValues(filled({ modifications: "" })).modifications;
    expect(blank.text).toBe("None");
    expect(blank.text).not.toMatch(/[[\]]/);
    expect(
      coverPageValues(filled({ modifications: "Clause 9 amended." })),
    ).toMatchObject({
      modifications: { text: "Clause 9 amended.", filled: true },
    });
  });

  it("pluralises the term years", () => {
    expect(
      coverPageValues(filled({ ndaTerm: { kind: "expires", years: 1 } }))
        .ndaTermYears,
    ).toBe("1 year");
    expect(
      coverPageValues(filled({ ndaTerm: { kind: "expires", years: 3 } }))
        .ndaTermYears,
    ).toBe("3 years");
  });

  it("still shows a years figure when the other term option is selected", () => {
    // The Cover Page prints both options, so the unselected line needs a
    // sensible number rather than a blank.
    expect(
      coverPageValues(filled({ ndaTerm: { kind: "until-terminated" } }))
        .ndaTermYears,
    ).toBe("1 year");
    expect(
      coverPageValues(filled({ confidentialityTerm: { kind: "perpetuity" } }))
        .confidentialityYears,
    ).toBe("1 year");
  });

  it("trims surrounding whitespace from supplied values", () => {
    expect(
      coverPageValues(filled({ jurisdiction: "  New Castle, DE  " })).jurisdiction
        .text,
    ).toBe("New Castle, DE");
  });
});

describe("partyValues", () => {
  it("prompts for each blank signature-block field", () => {
    const values = partyValues({
      companyName: "",
      signatoryName: "",
      signatoryTitle: "",
      noticeAddress: "",
    });
    expect(values.companyName).toEqual({ text: "[Company]", filled: false });
    expect(values.signatoryName.filled).toBe(false);
    expect(values.signatoryTitle.filled).toBe(false);
    expect(values.noticeAddress.filled).toBe(false);
  });

  it("passes through supplied details", () => {
    const values = partyValues({
      companyName: "Acme, Inc.",
      signatoryName: "Jordan Rivera",
      signatoryTitle: "Chief Executive Officer",
      noticeAddress: "legal@acme.com",
    });
    expect(values.companyName).toEqual({ text: "Acme, Inc.", filled: true });
    expect(values.noticeAddress.text).toBe("legal@acme.com");
  });
});
