/**
 * Splits clause prose into renderable pieces.
 *
 * The Standard Terms are stored as plain strings so they stay diffable against
 * the upstream template, which means the two bits of inline markup they carry
 * have to be parsed back out at render time. This runs once per clause and is
 * shared by the HTML preview and the PDF renderer so both agree on where the
 * bold runs and Cover Page cross-references are.
 */

export type Segment =
  | { type: "text"; value: string }
  /** A defined term the source marks with `**`. */
  | { type: "bold"; value: string }
  /** A term defined on the Cover Page, e.g. "Governing Law". */
  | { type: "term"; value: string };

const MARKUP = /(\*\*[^*]+\*\*|\{\{[^}]+\}\})/g;

export function toSegments(body: string): Segment[] {
  return body
    .split(MARKUP)
    .filter((part) => part !== "")
    .map((part): Segment => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return { type: "bold", value: part.slice(2, -2) };
      }
      if (part.startsWith("{{") && part.endsWith("}}")) {
        return { type: "term", value: part.slice(2, -2) };
      }
      return { type: "text", value: part };
    });
}
