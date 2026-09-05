import { fileURLToPath } from "node:url";

import { pdf, type DocumentProps } from "@react-pdf/renderer";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { ReactElement } from "react";

/**
 * Renders a react-pdf document to bytes.
 *
 * @react-pdf/renderer runs in plain Node, so the PDF the app downloads can be
 * produced in a test without a browser.
 */
export async function renderPdf(
  element: ReactElement<DocumentProps>,
): Promise<Uint8Array> {
  const stream = await pdf(element).toBuffer();
  const chunks: Buffer[] = [];
  for await (const chunk of stream as unknown as AsyncIterable<Buffer>) {
    chunks.push(Buffer.from(chunk));
  }
  return new Uint8Array(Buffer.concat(chunks));
}

// The document uses the PDF standard fonts (Times-Roman et al.); pdf.js needs
// to be pointed at its own copies of them to read the text back.
const standardFontDataUrl = fileURLToPath(
  new URL("../../node_modules/pdfjs-dist/standard_fonts/", import.meta.url),
);

/** Every text run in the document, in reading order, one array per page. */
export async function textItemsByPage(data: Uint8Array): Promise<string[][]> {
  const task = getDocument({ data, standardFontDataUrl });
  const doc = await task.promise;
  const pages: string[][] = [];
  for (let index = 1; index <= doc.numPages; index += 1) {
    const page = await doc.getPage(index);
    const { items } = await page.getTextContent();
    pages.push(
      items
        .map((item) => ("str" in item ? item.str : ""))
        .filter((str) => str.trim() !== ""),
    );
  }
  await task.destroy();
  return pages;
}

/** Every text run in the document, in reading order, across all pages. */
export async function textItems(data: Uint8Array): Promise<string[]> {
  return (await textItemsByPage(data)).flat();
}
