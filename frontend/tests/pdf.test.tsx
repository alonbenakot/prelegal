import { describe, expect, it } from "vitest";

import { NdaPdf, pdfFileName } from "@/lib/nda/pdf";
import { createDefaultFormData } from "@/lib/nda/defaults";
import { CLAUSES } from "@/lib/nda/standard-terms";
import type { NdaFormData, Party } from "@/lib/nda/types";
import { renderPdf, textItems, textItemsByPage } from "./helpers/render-pdf";

const party = (companyName: string, signatoryName: string): Party => ({
  companyName,
  signatoryName,
  signatoryTitle: "Chief Executive Officer",
  noticeAddress: `legal@${companyName.toLowerCase().replace(/\W/g, "")}.com`,
});

const complete = (overrides: Partial<NdaFormData> = {}): NdaFormData => ({
  ...createDefaultFormData(),
  effectiveDate: "2026-09-05",
  governingLaw: "Delaware",
  jurisdiction: "New Castle, DE",
  party1: party("Acme, Inc.", "Jordan Rivera"),
  party2: party("Contoso Ltd.", "Sam Chen"),
  ...overrides,
});

const render = async (data: NdaFormData) =>
  textItems(await renderPdf(<NdaPdf data={data} />));

/**
 * Whether the checkbox next to an option is ticked.
 *
 * The renderer emits the checkmark as its own text run immediately before the
 * option's label, so the run preceding the label is "X" exactly when the option
 * is selected. Options are matched by prefix because long ones wrap.
 */
function isChecked(items: string[], labelPrefix: string): boolean {
  const index = items.findIndex((item) => item.startsWith(labelPrefix));
  if (index < 1) {
    throw new Error(`Option not found in the document: "${labelPrefix}"`);
  }
  return items[index - 1] === "X";
}

const EXPIRES = "Expires";
const UNTIL_TERMINATED = "Continues until terminated";
const YEARS_CONFIDENTIAL = "1 year from Effective Date, but";
const PERPETUITY = "In perpetuity.";

describe("the generated PDF", () => {
  it("carries the party details, dates and governing law", async () => {
    const items = await render(complete());
    const text = items.join(" ");

    expect(text).toContain("Mutual Non-Disclosure Agreement");
    expect(text).toContain("September 5, 2026");
    expect(text).toContain("Delaware");
    expect(text).toContain("New Castle, DE");
    expect(text).toContain("Acme, Inc.");
    expect(text).toContain("Contoso Ltd.");
    expect(text).toContain("Jordan Rivera");
    expect(text).toContain("Sam Chen");
  });

  it("includes every Standard Terms clause", async () => {
    const text = (await render(complete())).join(" ");
    CLAUSES.forEach((clause, index) => {
      expect(text, clause.title).toContain(`${index + 1}. ${clause.title}`);
    });
  });

  it("keeps the Common Paper attribution", async () => {
    const text = (await render(complete())).join(" ");
    expect(text).toContain("Common Paper");
    expect(text).toContain("CC BY 4.0");
  });

  it("leaves the signature and date cells blank for signing", async () => {
    const text = (await render(complete())).join(" ");
    expect(text).toContain("Signature");
    expect(text).toContain("Date");
    // The signatory's name belongs in Print Name, never pre-filled as a mark.
    expect(text).not.toContain("/s/");
  });

  it("numbers its pages", async () => {
    const pages = await textItemsByPage(await renderPdf(<NdaPdf data={complete()} />));
    expect(pages.length).toBeGreaterThan(1);
    expect(pages[0].join(" ")).toMatch(/1 of \d+/);
  });

  // Regression: the checkmark was rendered into a box too small to fit its
  // line, so it was dropped from the document entirely and every option
  // printed as unchecked — the parties' chosen term was silently absent.
  describe("term checkboxes", () => {
    it("ticks a fixed MNDA term and leaves the open-ended one clear", async () => {
      const items = await render(
        complete({ ndaTerm: { kind: "expires", years: 2 } }),
      );
      expect(isChecked(items, EXPIRES)).toBe(true);
      expect(isChecked(items, UNTIL_TERMINATED)).toBe(false);
      expect(items.join(" ")).toContain("Expires 2 years from Effective Date.");
    });

    it("ticks an open-ended MNDA term and leaves the fixed one clear", async () => {
      const items = await render(
        complete({ ndaTerm: { kind: "until-terminated" } }),
      );
      expect(isChecked(items, UNTIL_TERMINATED)).toBe(true);
      expect(isChecked(items, EXPIRES)).toBe(false);
    });

    it("ticks a fixed confidentiality term and leaves perpetuity clear", async () => {
      const items = await render(
        complete({ confidentialityTerm: { kind: "years", years: 5 } }),
      );
      // The option's own label carries the year count, so it reads "5 years"
      // here rather than the default "1 year".
      expect(isChecked(items, "5 years from Effective Date, but")).toBe(true);
      expect(isChecked(items, PERPETUITY)).toBe(false);
    });

    it("ticks perpetuity and leaves the fixed term clear", async () => {
      const items = await render(
        complete({ confidentialityTerm: { kind: "perpetuity" } }),
      );
      expect(isChecked(items, PERPETUITY)).toBe(true);
      expect(isChecked(items, YEARS_CONFIDENTIAL)).toBe(false);
    });

    it("ticks exactly one option in each pair, for every combination", async () => {
      const ndaTerms: NdaFormData["ndaTerm"][] = [
        { kind: "expires", years: 1 },
        { kind: "until-terminated" },
      ];
      const confidentialityTerms: NdaFormData["confidentialityTerm"][] = [
        { kind: "years", years: 1 },
        { kind: "perpetuity" },
      ];

      for (const ndaTerm of ndaTerms) {
        for (const confidentialityTerm of confidentialityTerms) {
          const items = await render(complete({ ndaTerm, confidentialityTerm }));
          const label = JSON.stringify({ ndaTerm, confidentialityTerm });

          expect(
            [isChecked(items, EXPIRES), isChecked(items, UNTIL_TERMINATED)],
            label,
          ).toContain(true);
          expect(
            isChecked(items, EXPIRES) && isChecked(items, UNTIL_TERMINATED),
            label,
          ).toBe(false);

          expect(
            [isChecked(items, YEARS_CONFIDENTIAL), isChecked(items, PERPETUITY)],
            label,
          ).toContain(true);
          expect(
            isChecked(items, YEARS_CONFIDENTIAL) && isChecked(items, PERPETUITY),
            label,
          ).toBe(false);
        }
      }
    });
  });

  it("shows bracketed prompts for fields the user has not filled", async () => {
    const text = (await render(createDefaultFormData())).join(" ");
    expect(text).toContain("[Fill in state]");
    expect(text).toContain("[Company]");
  });

  it("reads blank modifications as None rather than a missing value", async () => {
    const text = (await render(complete({ modifications: "" }))).join(" ");
    expect(text).toContain("None");
    expect(text).not.toContain("[None]");
  });
});

describe("pdfFileName", () => {
  it("names the file after both companies", () => {
    expect(pdfFileName(complete())).toBe("Mutual-NDA-Acme-Inc-Contoso-Ltd.pdf");
  });

  it("falls back when the companies are not named yet", () => {
    expect(pdfFileName(createDefaultFormData())).toBe("Mutual-NDA.pdf");
  });
});
