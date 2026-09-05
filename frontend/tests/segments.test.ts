import { describe, expect, it } from "vitest";

import { toSegments } from "@/lib/nda/segments";
import { CLAUSES } from "@/lib/nda/standard-terms";

describe("toSegments", () => {
  it("returns plain prose as a single text segment", () => {
    expect(toSegments("No markup here.")).toEqual([
      { type: "text", value: "No markup here." },
    ]);
  });

  it("pulls out bold runs and Cover Page terms", () => {
    expect(toSegments("for the {{Purpose}} (“**MNDA**”) ends.")).toEqual([
      { type: "text", value: "for the " },
      { type: "term", value: "Purpose" },
      { type: "text", value: " (“" },
      { type: "bold", value: "MNDA" },
      { type: "text", value: "”) ends." },
    ]);
  });

  it("keeps every occurrence when a term repeats in one clause", () => {
    const terms = toSegments(
      "the laws of {{Governing Law}}, without regard to such {{Governing Law}}.",
    ).filter((segment) => segment.type === "term");
    expect(terms).toHaveLength(2);
  });

  it("does not treat the source's curly quotes as markup", () => {
    const segments = toSegments("as “confidential”, “proprietary”, or the like");
    expect(segments).toEqual([
      { type: "text", value: "as “confidential”, “proprietary”, or the like" },
    ]);
  });

  it("leaves no unparsed markup anywhere in the Standard Terms", () => {
    for (const clause of CLAUSES) {
      for (const segment of toSegments(clause.body)) {
        if (segment.type !== "text") continue;
        expect(segment.value, `in clause "${clause.title}"`).not.toMatch(
          /\*\*|\{\{|\}\}/,
        );
      }
    }
  });

  it("round-trips: joining the segment values restores the prose", () => {
    for (const clause of CLAUSES) {
      const rebuilt = toSegments(clause.body)
        .map((segment) =>
          segment.type === "bold"
            ? `**${segment.value}**`
            : segment.type === "term"
              ? `{{${segment.value}}}`
              : segment.value,
        )
        .join("");
      expect(rebuilt).toBe(clause.body);
    }
  });
});
