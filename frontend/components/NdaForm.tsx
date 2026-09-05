"use client";

import { useId, type Dispatch, type SetStateAction } from "react";

import { Fieldset, TextAreaField, TextField } from "./Field";
import type { FieldErrors } from "@/lib/nda/validate";
import type { NdaFormData, Party, PartyKey } from "@/lib/nda/types";

type Props = {
  data: NdaFormData;
  setData: Dispatch<SetStateAction<NdaFormData>>;
  errors: FieldErrors;
};

function RadioOption({
  name,
  checked,
  onSelect,
  children,
}: {
  name: string;
  checked: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-2 text-sm text-slate-700">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onSelect}
        className="mt-1 shrink-0 accent-slate-700"
      />
      <span>{children}</span>
    </label>
  );
}

/** Small inline number input used inside a radio option's label. */
function YearsInput({
  value,
  disabled,
  error,
  onChange,
  label,
}: {
  value: number;
  disabled: boolean;
  error?: string;
  onChange: (years: number) => void;
  label: string;
}) {
  return (
    <input
      type="number"
      min={1}
      value={value}
      disabled={disabled}
      aria-label={label}
      aria-invalid={Boolean(error)}
      onChange={(event) => onChange(Number.parseInt(event.target.value, 10) || 0)}
      className={[
        "mx-1 w-16 rounded border px-2 py-0.5 text-sm",
        error ? "border-red-400" : "border-slate-300",
        disabled ? "bg-slate-100 text-slate-400" : "bg-white text-slate-900",
      ].join(" ")}
    />
  );
}

function PartyFields({
  legend,
  party,
  errorPrefix,
  errors,
  onChange,
}: {
  legend: string;
  party: Party;
  errorPrefix: PartyKey;
  errors: FieldErrors;
  onChange: (patch: Partial<Party>) => void;
}) {
  return (
    <Fieldset legend={legend}>
      <TextField
        label="Company"
        value={party.companyName}
        error={errors[`${errorPrefix}.companyName`]}
        placeholder="Acme, Inc."
        onChange={(companyName) => onChange({ companyName })}
      />
      <TextField
        label="Signatory name"
        value={party.signatoryName}
        error={errors[`${errorPrefix}.signatoryName`]}
        placeholder="Jordan Rivera"
        onChange={(signatoryName) => onChange({ signatoryName })}
      />
      <TextField
        label="Title"
        value={party.signatoryTitle}
        error={errors[`${errorPrefix}.signatoryTitle`]}
        placeholder="Chief Executive Officer"
        onChange={(signatoryTitle) => onChange({ signatoryTitle })}
      />
      <TextField
        label="Notice address"
        hint="Email or postal address"
        value={party.noticeAddress}
        error={errors[`${errorPrefix}.noticeAddress`]}
        placeholder="legal@acme.com"
        onChange={(noticeAddress) => onChange({ noticeAddress })}
      />
    </Fieldset>
  );
}

export function NdaForm({ data, setData, errors }: Props) {
  const ndaTermName = useId();
  const confidentialityName = useId();

  const update = (patch: Partial<NdaFormData>) =>
    setData((prev) => ({ ...prev, ...patch }));
  const updateParty = (key: PartyKey, patch: Partial<Party>) =>
    setData((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  return (
    <form className="space-y-8" onSubmit={(event) => event.preventDefault()}>
      <Fieldset legend="Agreement">
        <TextAreaField
          label="Purpose"
          hint="How Confidential Information may be used"
          value={data.purpose}
          error={errors.purpose}
          onChange={(purpose) => update({ purpose })}
        />
        <TextField
          label="Effective date"
          type="date"
          value={data.effectiveDate}
          error={errors.effectiveDate}
          onChange={(effectiveDate) => update({ effectiveDate })}
        />
      </Fieldset>

      <Fieldset legend="Term">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">MNDA term</p>
          <p className="text-xs text-slate-500">The length of this MNDA</p>
          <RadioOption
            name={ndaTermName}
            checked={data.ndaTerm.kind === "expires"}
            onSelect={() => update({ ndaTerm: { kind: "expires", years: 1 } })}
          >
            Expires
            <YearsInput
              label="MNDA term in years"
              value={data.ndaTerm.kind === "expires" ? data.ndaTerm.years : 1}
              disabled={data.ndaTerm.kind !== "expires"}
              error={errors["ndaTerm.years"]}
              onChange={(years) => update({ ndaTerm: { kind: "expires", years } })}
            />
            year(s) from the effective date.
          </RadioOption>
          <RadioOption
            name={ndaTermName}
            checked={data.ndaTerm.kind === "until-terminated"}
            onSelect={() => update({ ndaTerm: { kind: "until-terminated" } })}
          >
            Continues until terminated in accordance with the terms of the MNDA.
          </RadioOption>
          {errors["ndaTerm.years"] ? (
            <p className="text-xs text-red-600">{errors["ndaTerm.years"]}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">
            Term of confidentiality
          </p>
          <p className="text-xs text-slate-500">
            How long Confidential Information is protected
          </p>
          <RadioOption
            name={confidentialityName}
            checked={data.confidentialityTerm.kind === "years"}
            onSelect={() =>
              update({ confidentialityTerm: { kind: "years", years: 1 } })
            }
          >
            <YearsInput
              label="Term of confidentiality in years"
              value={
                data.confidentialityTerm.kind === "years"
                  ? data.confidentialityTerm.years
                  : 1
              }
              disabled={data.confidentialityTerm.kind !== "years"}
              error={errors["confidentialityTerm.years"]}
              onChange={(years) =>
                update({ confidentialityTerm: { kind: "years", years } })
              }
            />
            year(s) from the effective date, except trade secrets.
          </RadioOption>
          <RadioOption
            name={confidentialityName}
            checked={data.confidentialityTerm.kind === "perpetuity"}
            onSelect={() =>
              update({ confidentialityTerm: { kind: "perpetuity" } })
            }
          >
            In perpetuity.
          </RadioOption>
          {errors["confidentialityTerm.years"] ? (
            <p className="text-xs text-red-600">
              {errors["confidentialityTerm.years"]}
            </p>
          ) : null}
        </div>
      </Fieldset>

      <Fieldset legend="Governing law">
        <TextField
          label="Governing law"
          hint="The state whose law governs the agreement"
          value={data.governingLaw}
          error={errors.governingLaw}
          placeholder="Delaware"
          onChange={(governingLaw) => update({ governingLaw })}
        />
        <TextField
          label="Jurisdiction"
          hint="City or county and state, e.g. “New Castle, DE”"
          value={data.jurisdiction}
          error={errors.jurisdiction}
          placeholder="New Castle, DE"
          onChange={(jurisdiction) => update({ jurisdiction })}
        />
        <TextAreaField
          label="Modifications"
          hint="Optional. Any changes to the Standard Terms."
          rows={2}
          value={data.modifications}
          placeholder="None"
          onChange={(modifications) => update({ modifications })}
        />
      </Fieldset>

      <PartyFields
        legend="Party 1"
        party={data.party1}
        errorPrefix="party1"
        errors={errors}
        onChange={(patch) => updateParty("party1", patch)}
      />
      <PartyFields
        legend="Party 2"
        party={data.party2}
        errorPrefix="party2"
        errors={errors}
        onChange={(patch) => updateParty("party2", patch)}
      />
    </form>
  );
}
