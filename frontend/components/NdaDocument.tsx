import { CoverPage } from "./CoverPage";
import { StandardTerms } from "./StandardTerms";
import type { NdaFormData } from "@/lib/nda/types";

/**
 * The live preview of the agreement: the filled Cover Page followed by the
 * Standard Terms it incorporates.
 *
 * This is the on-screen rendering only. The downloadable PDF is built from the
 * same `lib/nda` data by `lib/nda/pdf.tsx`.
 */
export function NdaDocument({ data }: { data: NdaFormData }) {
  return (
    <article className="mx-auto max-w-[52rem] bg-white px-10 py-12 font-serif text-slate-800 shadow-sm ring-1 ring-slate-200 sm:px-14 print:max-w-none print:p-0 print:shadow-none print:ring-0">
      <CoverPage data={data} />
      <hr className="my-10 border-slate-200" />
      <StandardTerms />
    </article>
  );
}
