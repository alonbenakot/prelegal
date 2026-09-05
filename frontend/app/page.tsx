"use client";

import { useMemo, useState } from "react";

import { NdaDocument } from "@/components/NdaDocument";
import { NdaForm } from "@/components/NdaForm";
import { createDefaultFormData } from "@/lib/nda/defaults";
import { useToday } from "@/lib/nda/use-today";
import { validate } from "@/lib/nda/validate";
import type { NdaFormData } from "@/lib/nda/types";

export default function Home() {
  const [draft, setDraft] = useState<NdaFormData>(createDefaultFormData);
  const [attemptedDownload, setAttemptedDownload] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // The effective date defaults to today, derived rather than stored so the
  // prerendered HTML does not carry a build-time date. Once the user picks a
  // date it lives in `draft` and wins here.
  const today = useToday();
  const data = useMemo(
    () => (draft.effectiveDate ? draft : { ...draft, effectiveDate: today }),
    [draft, today],
  );

  const errors = useMemo(() => validate(data), [data]);
  const errorCount = Object.keys(errors).length;
  const visibleErrors = attemptedDownload ? errors : {};

  async function handleDownload() {
    setAttemptedDownload(true);
    setDownloadError(null);
    if (errorCount > 0) return;

    setIsGenerating(true);
    try {
      // Imported on demand so the PDF renderer stays out of the initial bundle.
      const { downloadNdaPdf } = await import("@/lib/nda/pdf");
      await downloadNdaPdf(data);
    } catch (error) {
      console.error(error);
      setDownloadError("Could not generate the PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur print:hidden">
        <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center gap-4 px-6 py-4">
          <div className="mr-auto">
            <h1 className="text-lg font-semibold text-slate-900">
              Mutual NDA creator
            </h1>
            <p className="text-sm text-slate-500">
              Fill in the details and download a signable agreement.
            </p>
          </div>

          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isGenerating}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isGenerating ? "Generating…" : "Download PDF"}
            </button>
            {attemptedDownload && errorCount > 0 ? (
              <p role="alert" className="text-xs text-red-600">
                {errorCount} field{errorCount === 1 ? "" : "s"} still need
                {errorCount === 1 ? "s" : ""} attention.
              </p>
            ) : null}
            {downloadError ? (
              <p role="alert" className="text-xs text-red-600">
                {downloadError}
              </p>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1600px] flex-1 gap-10 px-6 py-8 lg:grid-cols-[minmax(340px,400px)_1fr] print:block print:p-0">
        <section aria-label="Agreement details" className="print:hidden">
          <div className="lg:sticky lg:top-28 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto lg:pr-3">
            <NdaForm data={data} setData={setDraft} errors={visibleErrors} />
          </div>
        </section>

        <section aria-label="Document preview" className="min-w-0">
          <NdaDocument data={data} />
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-6 py-5 print:hidden">
        <div className="mx-auto max-w-[1600px] space-y-1 text-xs text-slate-500">
          <p>
            Built on the{" "}
            <a
              href="https://commonpaper.com/standards/mutual-nda/1.0/"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Common Paper Mutual NDA, Version 1.0
            </a>
            , free to use under{" "}
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              CC BY 4.0
            </a>
            .
          </p>
          <p>
            This tool generates a document from a template. It is not legal
            advice — have a lawyer review anything you intend to sign.
          </p>
        </div>
      </footer>
    </div>
  );
}
