/**
 * Shape of the data a user supplies to produce a Mutual NDA.
 *
 * These fields mirror the fillable slots on the Common Paper Mutual NDA
 * Cover Page (`templates/Mutual-NDA-coverpage.md` at the repo root).
 */

/** One side of the agreement, as it appears in the signature block. */
export type Party = {
  companyName: string;
  signatoryName: string;
  signatoryTitle: string;
  noticeAddress: string;
};

/** How long the MNDA itself lasts. */
export type NdaTerm =
  | { kind: "expires"; years: number }
  | { kind: "until-terminated" };

/** How long confidentiality obligations survive. */
export type ConfidentialityTerm =
  | { kind: "years"; years: number }
  | { kind: "perpetuity" };

export type NdaFormData = {
  /** What the Confidential Information may be used for. */
  purpose: string;
  /** ISO `yyyy-mm-dd`. Empty until the form prefills it on mount. */
  effectiveDate: string;
  ndaTerm: NdaTerm;
  confidentialityTerm: ConfidentialityTerm;
  /** US state whose law governs, e.g. "Delaware". */
  governingLaw: string;
  /** Courts with exclusive jurisdiction, e.g. "New Castle, DE". */
  jurisdiction: string;
  /** Free-text changes to the Standard Terms; blank means none. */
  modifications: string;
  party1: Party;
  party2: Party;
};

/** Keys of the two party slots, for iterating both sides uniformly. */
export const PARTY_KEYS = ["party1", "party2"] as const;
export type PartyKey = (typeof PARTY_KEYS)[number];
