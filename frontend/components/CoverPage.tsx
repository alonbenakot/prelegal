import { coverPageValues, partyValues, type Value } from "@/lib/nda/derive";
import type { NdaFormData } from "@/lib/nda/types";

/** A value drawn from the form, styled to show whether it was supplied. */
function Slot({ value }: { value: Value }) {
  return value.filled ? (
    <span className="font-medium text-slate-900">{value.text}</span>
  ) : (
    <span className="italic text-slate-400">{value.text}</span>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span aria-hidden className="mr-2 select-none font-mono">
      {checked ? "☒" : "☐"}
    </span>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 break-inside-avoid">
      <h3 className="text-sm font-bold tracking-wide text-slate-900">{title}</h3>
      {hint ? (
        <p className="mb-1 text-xs italic text-slate-500">{hint}</p>
      ) : null}
      <div className="text-[0.95rem] leading-relaxed text-slate-800">
        {children}
      </div>
    </section>
  );
}

/** Row label plus one cell per party. */
function SignatureRow({
  label,
  hint,
  cells,
}: {
  label: string;
  hint?: string;
  cells: [React.ReactNode, React.ReactNode];
}) {
  return (
    <tr className="break-inside-avoid">
      <th
        scope="row"
        className="w-40 border border-slate-300 bg-slate-50 px-3 py-2 text-left align-top text-xs font-semibold text-slate-700"
      >
        {label}
        {hint ? (
          <span className="block font-normal italic text-slate-500">{hint}</span>
        ) : null}
      </th>
      {cells.map((cell, index) => (
        <td
          key={index}
          className="h-11 border border-slate-300 px-3 py-2 align-top text-sm"
        >
          {cell}
        </td>
      ))}
    </tr>
  );
}

export function CoverPage({ data }: { data: NdaFormData }) {
  const values = coverPageValues(data);
  const parties = [partyValues(data.party1), partyValues(data.party2)] as const;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">
        Mutual Non-Disclosure Agreement
      </h1>

      <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-900">
        Using this Mutual Non-Disclosure Agreement
      </h2>
      <p className="mt-1 text-[0.95rem] leading-relaxed text-slate-800">
        This Mutual Non-Disclosure Agreement (the “MNDA”) consists of: (1) this
        Cover Page (“<strong>Cover Page</strong>”) and (2) the Common Paper
        Mutual NDA Standard Terms Version 1.0 (“
        <strong>Standard Terms</strong>”) identical to those posted at
        commonpaper.com/standards/mutual-nda/1.0. Any modifications of the
        Standard Terms should be made on the Cover Page, which will control over
        conflicts with the Standard Terms.
      </p>

      <Section title="Purpose" hint="How Confidential Information may be used">
        <Slot value={values.purpose} />
      </Section>

      <Section title="Effective Date">
        <Slot value={values.effectiveDate} />
      </Section>

      <Section title="MNDA Term" hint="The length of this MNDA">
        <p>
          <Checkbox checked={data.ndaTerm.kind === "expires"} />
          Expires{" "}
          <span
            className={
              data.ndaTerm.kind === "expires"
                ? "font-medium text-slate-900"
                : "text-slate-400"
            }
          >
            {values.ndaTermYears}
          </span>{" "}
          from Effective Date.
        </p>
        <p>
          <Checkbox checked={data.ndaTerm.kind === "until-terminated"} />
          Continues until terminated in accordance with the terms of the MNDA.
        </p>
      </Section>

      <Section
        title="Term of Confidentiality"
        hint="How long Confidential Information is protected"
      >
        <p>
          <Checkbox checked={data.confidentialityTerm.kind === "years"} />
          <span
            className={
              data.confidentialityTerm.kind === "years"
                ? "font-medium text-slate-900"
                : "text-slate-400"
            }
          >
            {values.confidentialityYears}
          </span>{" "}
          from Effective Date, but in the case of trade secrets until
          Confidential Information is no longer considered a trade secret under
          applicable laws.
        </p>
        <p>
          <Checkbox checked={data.confidentialityTerm.kind === "perpetuity"} />
          In perpetuity.
        </p>
      </Section>

      <Section title="Governing Law &amp; Jurisdiction">
        <p>
          Governing Law: <Slot value={values.governingLaw} />
        </p>
        <p className="mt-1">
          Jurisdiction: <Slot value={values.jurisdiction} />
        </p>
      </Section>

      <Section title="MNDA Modifications" hint="List any modifications to the MNDA">
        <Slot value={values.modifications} />
      </Section>

      <p className="mt-6 text-[0.95rem] leading-relaxed text-slate-800">
        By signing this Cover Page, each party agrees to enter into this MNDA as
        of the Effective Date.
      </p>

      <table className="mt-3 w-full table-fixed border-collapse">
        <caption className="sr-only">Signature block for both parties</caption>
        <thead>
          <tr>
            <td className="w-40 border border-slate-300 bg-slate-50" />
            {(["Party 1", "Party 2"] as const).map((heading, index) => (
              <th
                key={heading}
                scope="col"
                className="border border-slate-300 bg-slate-50 px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-slate-700"
              >
                {heading}
                <span className="block truncate font-normal normal-case tracking-normal text-slate-500">
                  {parties[index].companyName.filled
                    ? parties[index].companyName.text
                    : "—"}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <SignatureRow label="Signature" cells={["", ""]} />
          <SignatureRow
            label="Print Name"
            cells={[
              <Slot key="p1" value={parties[0].signatoryName} />,
              <Slot key="p2" value={parties[1].signatoryName} />,
            ]}
          />
          <SignatureRow
            label="Title"
            cells={[
              <Slot key="p1" value={parties[0].signatoryTitle} />,
              <Slot key="p2" value={parties[1].signatoryTitle} />,
            ]}
          />
          <SignatureRow
            label="Company"
            cells={[
              <Slot key="p1" value={parties[0].companyName} />,
              <Slot key="p2" value={parties[1].companyName} />,
            ]}
          />
          <SignatureRow
            label="Notice Address"
            hint="Use either email or postal address"
            cells={[
              <Slot key="p1" value={parties[0].noticeAddress} />,
              <Slot key="p2" value={parties[1].noticeAddress} />,
            ]}
          />
          <SignatureRow label="Date" cells={["", ""]} />
        </tbody>
      </table>
    </div>
  );
}
