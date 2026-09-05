import { PARTY_KEYS, type NdaFormData } from "./types";

/** Errors keyed by the same dotted paths the form uses to address fields. */
export type FieldErrors = Record<string, string>;

const PARTY_FIELD_LABELS = {
  companyName: "Company",
  signatoryName: "Signatory name",
  signatoryTitle: "Title",
  noticeAddress: "Notice address",
} as const;

/**
 * Everything that must be filled in before the document is worth signing.
 *
 * Returns an empty object when the form is complete. Signature and date cells
 * are intentionally not validated: they are left blank for wet or e-signature.
 */
export function validate(data: NdaFormData): FieldErrors {
  const errors: FieldErrors = {};

  if (!data.purpose.trim()) errors.purpose = "Describe the purpose.";
  if (!data.effectiveDate) errors.effectiveDate = "Pick an effective date.";
  if (!data.governingLaw.trim())
    errors.governingLaw = "Name the governing state.";
  if (!data.jurisdiction.trim())
    errors.jurisdiction = "Name the courts with jurisdiction.";

  if (data.ndaTerm.kind === "expires" && data.ndaTerm.years < 1) {
    errors["ndaTerm.years"] = "Must be at least 1 year.";
  }
  if (
    data.confidentialityTerm.kind === "years" &&
    data.confidentialityTerm.years < 1
  ) {
    errors["confidentialityTerm.years"] = "Must be at least 1 year.";
  }

  for (const partyKey of PARTY_KEYS) {
    for (const [field, label] of Object.entries(PARTY_FIELD_LABELS)) {
      const value = data[partyKey][field as keyof typeof PARTY_FIELD_LABELS];
      if (!value.trim()) errors[`${partyKey}.${field}`] = `${label} is required.`;
    }
  }

  return errors;
}
