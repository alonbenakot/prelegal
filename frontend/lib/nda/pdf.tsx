"use client";

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";

import { coverPageValues, partyValues, type Value } from "./derive";
import { toSegments } from "./segments";
import { CLAUSES, STANDARD_TERMS_URL } from "./standard-terms";
import type { NdaFormData, Party } from "./types";

/**
 * PDF rendering of the agreement.
 *
 * This is a second presentation layer over the same `lib/nda` data the
 * on-screen preview uses — `standard-terms.ts` for the prose and `derive.ts`
 * for the Cover Page values — so the legal text lives in exactly one place.
 * Only layout is expressed twice, because react-pdf has its own primitives and
 * supports a subset of flexbox rather than CSS.
 *
 * Times-Roman and Helvetica are built into the PDF format, so nothing is
 * fetched over the network while generating a document.
 */

/** US Letter height in PostScript points, matching `<Page size="LETTER">`. */
const LETTER_HEIGHT = 792;

const COLORS = {
  ink: "#1e293b",
  heading: "#0f172a",
  muted: "#64748b",
  placeholder: "#94a3b8",
  rule: "#cbd5e1",
  shade: "#f8fafc",
};

const styles = StyleSheet.create({
  page: {
    paddingVertical: 54,
    paddingHorizontal: 56,
    fontFamily: "Times-Roman",
    fontSize: 10.5,
    lineHeight: 1.5,
    color: COLORS.ink,
  },
  title: {
    fontFamily: "Times-Bold",
    fontSize: 18,
    color: COLORS.heading,
    marginBottom: 14,
  },
  sectionHeading: {
    fontFamily: "Times-Bold",
    fontSize: 10.5,
    color: COLORS.heading,
    marginTop: 12,
  },
  hint: {
    fontFamily: "Times-Italic",
    fontSize: 8.5,
    color: COLORS.muted,
    marginBottom: 2,
  },
  paragraph: { marginTop: 4 },
  filled: { fontFamily: "Times-Bold" },
  placeholder: { fontFamily: "Times-Italic", color: COLORS.placeholder },
  option: { flexDirection: "row", marginTop: 4 },
  // Sized so the checkmark's line box fits inside the border. A tighter box
  // clips the glyph and silently renders every option as unchecked.
  checkbox: {
    width: 11,
    height: 11,
    borderWidth: 1,
    borderColor: COLORS.ink,
    marginRight: 6,
    marginTop: 2.5,
  },
  checkmark: {
    fontSize: 8,
    fontFamily: "Times-Bold",
    lineHeight: 1.1,
    textAlign: "center",
  },
  optionText: { flex: 1 },
  table: { marginTop: 8, borderTopWidth: 1, borderColor: COLORS.rule },
  row: { flexDirection: "row", borderBottomWidth: 1, borderColor: COLORS.rule },
  rowLabel: {
    width: 110,
    padding: 6,
    backgroundColor: COLORS.shade,
    borderRightWidth: 1,
    borderLeftWidth: 1,
    borderColor: COLORS.rule,
    fontFamily: "Times-Bold",
    fontSize: 9,
  },
  cell: {
    flex: 1,
    padding: 6,
    minHeight: 26,
    borderRightWidth: 1,
    borderColor: COLORS.rule,
    fontSize: 9.5,
  },
  columnHeading: {
    flex: 1,
    padding: 6,
    backgroundColor: COLORS.shade,
    borderRightWidth: 1,
    borderColor: COLORS.rule,
    fontFamily: "Times-Bold",
    fontSize: 9,
    textAlign: "center",
  },
  clause: { marginTop: 8 },
  clauseNumber: { fontFamily: "Times-Bold" },
  divider: {
    marginTop: 20,
    marginBottom: 14,
    borderTopWidth: 1,
    borderColor: COLORS.rule,
  },
  attribution: { marginTop: 18, fontSize: 8, color: COLORS.muted },
  // Anchored from the top rather than with `bottom`. The page's inherited
  // `lineHeight` mis-measures a `fixed` element positioned any other way, and
  // react-pdf then drops it from the document silently — no warning, no gap,
  // just no page numbers. Covered by tests/pdf.test.tsx.
  pageNumber: {
    position: "absolute",
    top: LETTER_HEIGHT - 38,
    left: 56,
    right: 56,
    textAlign: "center",
    fontSize: 8,
    color: COLORS.muted,
  },
});

const Slot = ({ value }: { value: Value }) => (
  <Text style={value.filled ? styles.filled : styles.placeholder}>
    {value.text}
  </Text>
);

const Option = ({
  checked,
  children,
}: {
  checked: boolean;
  children: React.ReactNode;
}) => (
  <View style={styles.option}>
    <View style={styles.checkbox}>
      {checked ? <Text style={styles.checkmark}>X</Text> : null}
    </View>
    <Text style={styles.optionText}>{children}</Text>
  </View>
);

const SignatureRow = ({
  label,
  cells,
}: {
  label: string;
  cells: [React.ReactNode, React.ReactNode];
}) => (
  <View style={styles.row} wrap={false}>
    <Text style={styles.rowLabel}>{label}</Text>
    {cells.map((cell, index) => (
      <View key={index} style={styles.cell}>
        <Text>{cell}</Text>
      </View>
    ))}
  </View>
);

function ClauseText({ body }: { body: string }) {
  return (
    <>
      {toSegments(body).map((segment, index) =>
        segment.type === "bold" ? (
          <Text key={index} style={styles.filled}>
            {segment.value}
          </Text>
        ) : (
          <Text key={index}>{segment.value}</Text>
        ),
      )}
    </>
  );
}

function SignatureBlock({ parties }: { parties: [Party, Party] }) {
  const [first, second] = parties.map(partyValues);
  return (
    <View style={styles.table}>
      <View style={styles.row}>
        <Text style={styles.rowLabel} />
        <Text style={styles.columnHeading}>PARTY 1</Text>
        <Text style={styles.columnHeading}>PARTY 2</Text>
      </View>
      <SignatureRow label="Signature" cells={["", ""]} />
      <SignatureRow
        label="Print Name"
        cells={[
          <Slot key="a" value={first.signatoryName} />,
          <Slot key="b" value={second.signatoryName} />,
        ]}
      />
      <SignatureRow
        label="Title"
        cells={[
          <Slot key="a" value={first.signatoryTitle} />,
          <Slot key="b" value={second.signatoryTitle} />,
        ]}
      />
      <SignatureRow
        label="Company"
        cells={[
          <Slot key="a" value={first.companyName} />,
          <Slot key="b" value={second.companyName} />,
        ]}
      />
      <SignatureRow
        label="Notice Address"
        cells={[
          <Slot key="a" value={first.noticeAddress} />,
          <Slot key="b" value={second.noticeAddress} />,
        ]}
      />
      <SignatureRow label="Date" cells={["", ""]} />
    </View>
  );
}

export function NdaPdf({ data }: { data: NdaFormData }) {
  const values = coverPageValues(data);

  return (
    <Document
      title="Mutual Non-Disclosure Agreement"
      author="prelegal"
      subject="Common Paper Mutual NDA, Version 1.0"
    >
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>Mutual Non-Disclosure Agreement</Text>

        <Text style={styles.sectionHeading}>
          USING THIS MUTUAL NON-DISCLOSURE AGREEMENT
        </Text>
        <Text style={styles.paragraph}>
          This Mutual Non-Disclosure Agreement (the “MNDA”) consists of: (1) this
          Cover Page (“Cover Page”) and (2) the Common Paper Mutual NDA Standard
          Terms Version 1.0 (“Standard Terms”) identical to those posted at
          commonpaper.com/standards/mutual-nda/1.0. Any modifications of the
          Standard Terms should be made on the Cover Page, which will control
          over conflicts with the Standard Terms.
        </Text>

        <Text style={styles.sectionHeading}>Purpose</Text>
        <Text style={styles.hint}>How Confidential Information may be used</Text>
        <Text>
          <Slot value={values.purpose} />
        </Text>

        <Text style={styles.sectionHeading}>Effective Date</Text>
        <Text>
          <Slot value={values.effectiveDate} />
        </Text>

        <Text style={styles.sectionHeading}>MNDA Term</Text>
        <Text style={styles.hint}>The length of this MNDA</Text>
        <Option checked={data.ndaTerm.kind === "expires"}>
          Expires {values.ndaTermYears} from Effective Date.
        </Option>
        <Option checked={data.ndaTerm.kind === "until-terminated"}>
          Continues until terminated in accordance with the terms of the MNDA.
        </Option>

        <Text style={styles.sectionHeading}>Term of Confidentiality</Text>
        <Text style={styles.hint}>
          How long Confidential Information is protected
        </Text>
        <Option checked={data.confidentialityTerm.kind === "years"}>
          {values.confidentialityYears} from Effective Date, but in the case of
          trade secrets until Confidential Information is no longer considered a
          trade secret under applicable laws.
        </Option>
        <Option checked={data.confidentialityTerm.kind === "perpetuity"}>
          In perpetuity.
        </Option>

        <Text style={styles.sectionHeading}>Governing Law &amp; Jurisdiction</Text>
        <Text style={styles.paragraph}>
          Governing Law: <Slot value={values.governingLaw} />
        </Text>
        <Text>
          Jurisdiction: <Slot value={values.jurisdiction} />
        </Text>

        <Text style={styles.sectionHeading}>MNDA Modifications</Text>
        <Text style={styles.hint}>List any modifications to the MNDA</Text>
        <Text>
          <Slot value={values.modifications} />
        </Text>

        <Text style={styles.paragraph}>
          By signing this Cover Page, each party agrees to enter into this MNDA
          as of the Effective Date.
        </Text>

        <SignatureBlock parties={[data.party1, data.party2]} />

        <View style={styles.divider} />

        <Text style={styles.title}>Standard Terms</Text>
        {CLAUSES.map((clause, index) => (
          <Text key={clause.title} style={styles.clause}>
            <Text style={styles.clauseNumber}>
              {index + 1}. {clause.title}
            </Text>
            . <ClauseText body={clause.body} />
          </Text>
        ))}

        <Text style={styles.attribution}>
          Common Paper Mutual Non-Disclosure Agreement Version 1.0 (
          {STANDARD_TERMS_URL}) free to use under CC BY 4.0
          (https://creativecommons.org/licenses/by/4.0/).
        </Text>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}

/** Turns a company name into a filename-safe fragment. */
const slug = (input: string) =>
  input
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

export function pdfFileName(data: NdaFormData): string {
  const names = [data.party1.companyName, data.party2.companyName]
    .map(slug)
    .filter(Boolean);
  return ["Mutual-NDA", ...names].join("-") + ".pdf";
}

/** Renders the agreement and hands the browser a file to save. */
export async function downloadNdaPdf(data: NdaFormData): Promise<void> {
  const blob = await pdf(<NdaPdf data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = pdfFileName(data);
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Deferred so the browser has taken hold of the blob before it is released.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
