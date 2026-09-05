import { toSegments } from "@/lib/nda/segments";
import { CLAUSES, STANDARD_TERMS_URL } from "@/lib/nda/standard-terms";

/**
 * Renders one clause's prose, restoring the bold runs and marking references
 * to terms defined on the Cover Page.
 */
function ClauseBody({ body }: { body: string }) {
  return (
    <>
      {toSegments(body).map((segment, index) => {
        if (segment.type === "bold") {
          return <strong key={index}>{segment.value}</strong>;
        }
        if (segment.type === "term") {
          return (
            <span
              key={index}
              title="Defined on the Cover Page"
              className="underline decoration-slate-300 decoration-dotted underline-offset-4"
            >
              {segment.value}
            </span>
          );
        }
        return <span key={index}>{segment.value}</span>;
      })}
    </>
  );
}

export function StandardTerms() {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900">Standard Terms</h2>
      <ol className="mt-4 space-y-4">
        {CLAUSES.map((clause, index) => (
          <li
            key={clause.title}
            className="break-inside-avoid text-[0.95rem] leading-relaxed text-slate-800"
          >
            <span className="font-semibold">
              {index + 1}. {clause.title}
            </span>
            . <ClauseBody body={clause.body} />
          </li>
        ))}
      </ol>
      <p className="mt-6 text-xs text-slate-500">
        Common Paper Mutual Non-Disclosure Agreement{" "}
        <a
          href={STANDARD_TERMS_URL}
          className="underline"
          target="_blank"
          rel="noreferrer"
        >
          Version 1.0
        </a>{" "}
        free to use under{" "}
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          className="underline"
          target="_blank"
          rel="noreferrer"
        >
          CC BY 4.0
        </a>
        .
      </p>
    </div>
  );
}
