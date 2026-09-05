import { describe, expect, it } from "vitest";

import { createDefaultFormData } from "@/lib/nda/defaults";
import { validate } from "@/lib/nda/validate";
import type { NdaFormData, Party } from "@/lib/nda/types";

const party = (): Party => ({
  companyName: "Acme, Inc.",
  signatoryName: "Jordan Rivera",
  signatoryTitle: "Chief Executive Officer",
  noticeAddress: "legal@acme.com",
});

const complete = (overrides: Partial<NdaFormData> = {}): NdaFormData => ({
  ...createDefaultFormData(),
  effectiveDate: "2026-09-05",
  governingLaw: "Delaware",
  jurisdiction: "New Castle, DE",
  party1: party(),
  party2: party(),
  ...overrides,
});

describe("validate", () => {
  it("passes a fully completed form", () => {
    expect(validate(complete())).toEqual({});
  });

  it("treats modifications as optional", () => {
    expect(validate(complete({ modifications: "" }))).toEqual({});
  });

  it("flags each missing top-level field", () => {
    const errors = validate(
      complete({
        purpose: "",
        effectiveDate: "",
        governingLaw: "",
        jurisdiction: "",
      }),
    );
    expect(Object.keys(errors).sort()).toEqual([
      "effectiveDate",
      "governingLaw",
      "jurisdiction",
      "purpose",
    ]);
  });

  it("rejects whitespace-only text as missing", () => {
    expect(validate(complete({ governingLaw: "   " }))).toHaveProperty(
      "governingLaw",
    );
  });

  it("flags every blank field on both parties", () => {
    const blank: Party = {
      companyName: "",
      signatoryName: "",
      signatoryTitle: "",
      noticeAddress: "",
    };
    const errors = validate(complete({ party1: blank, party2: blank }));
    for (const key of [
      "party1.companyName",
      "party1.signatoryName",
      "party1.signatoryTitle",
      "party1.noticeAddress",
      "party2.companyName",
      "party2.signatoryName",
      "party2.signatoryTitle",
      "party2.noticeAddress",
    ]) {
      expect(errors, key).toHaveProperty(key);
    }
  });

  it("rejects a term of less than a year", () => {
    expect(
      validate(complete({ ndaTerm: { kind: "expires", years: 0 } })),
    ).toHaveProperty("ndaTerm.years");
    expect(
      validate(
        complete({ confidentialityTerm: { kind: "years", years: 0 } }),
      ),
    ).toHaveProperty("confidentialityTerm.years");
  });

  it("does not check a years figure that the chosen option ignores", () => {
    expect(validate(complete({ ndaTerm: { kind: "until-terminated" } }))).toEqual(
      {},
    );
    expect(
      validate(complete({ confidentialityTerm: { kind: "perpetuity" } })),
    ).toEqual({});
  });

  it("does not require signature or date cells, which are signed by hand", () => {
    expect(validate(complete())).not.toHaveProperty("party1.signature");
    expect(validate(complete())).not.toHaveProperty("party1.date");
  });
});
