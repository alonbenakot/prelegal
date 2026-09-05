# Mutual NDA creator (frontend)

A Next.js app that turns a short form into a completed, downloadable Mutual
Non-Disclosure Agreement. Implements [PL-3](https://alonbenakot.atlassian.net/browse/PL-3).

Fill in the purpose, dates, term, governing law and both parties' details; the
agreement re-renders live beside the form; **Download PDF** produces a signable
PDF with the signature and date cells left blank.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
```

There is no backend. Everything — form state, document rendering and PDF
generation — happens in the browser.

## How it fits together

The agreement is the Common Paper Mutual NDA v1.0, which is split into a
fillable **Cover Page** and reusable **Standard Terms**. That split drives the
code:

| Path | Role |
| --- | --- |
| `lib/nda/types.ts` | `NdaFormData` — the shape of everything the user supplies |
| `lib/nda/standard-terms.ts` | The 11 Standard Terms clauses, transcribed verbatim |
| `lib/nda/derive.ts` | Form data → the display values on the Cover Page |
| `lib/nda/segments.ts` | Splits clause prose into bold runs and cross-references |
| `lib/nda/validate.ts` | Which fields must be filled before download |
| `lib/nda/pdf.tsx` | The PDF rendering and the download itself |
| `components/NdaDocument.tsx` | The on-screen preview (`CoverPage` + `StandardTerms`) |
| `components/NdaForm.tsx` | The form, built from `components/Field.tsx` |

The legal text lives in exactly one place — `standard-terms.ts` for the clauses,
`derive.ts` for the Cover Page values. The HTML preview and the PDF are two
presentation layers over that shared data, because `@react-pdf/renderer` has its
own primitives rather than CSS. Only layout is expressed twice.

### Two things worth knowing

**Cover Page terms are cross-references, not blanks.** The Standard Terms
mention `Purpose`, `Governing Law`, `MNDA Term` and so on. In the source
template these are links to the Cover Page, and they are rendered that way here
rather than substituted inline — partly because that is how the agreement is
designed to work, and partly because substituting breaks the grammar ("commences
on the January 5, 2026"). All the user's input is filled into the Cover Page.

**The effective date is derived, not stored.** The page is statically
prerendered, so reading the clock during render would bake the build date into
the HTML and mismatch on hydration. `lib/nda/use-today.ts` goes through
`useSyncExternalStore` so the server and client snapshots can differ legitimately.

## Editing the agreement text

`lib/nda/standard-terms.ts` is transcribed from `templates/Mutual-NDA.md` at the
repository root, keeping the prose byte-comparable so it can be diffed against
upstream Common Paper revisions. Two bits of inline markup are preserved:
`**bold**` for defined terms and `{{Term}}` for Cover Page cross-references.
Don't reword the clauses — it is the operative language of the agreement.

## Attribution

Built on the [Common Paper Mutual NDA, Version 1.0](https://commonpaper.com/standards/mutual-nda/1.0/),
free to use under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The
attribution is carried in the generated document and in the app footer.

This tool fills in a template. It is not legal advice.
