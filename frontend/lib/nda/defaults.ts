import type { NdaFormData, Party } from "./types";

const emptyParty = (): Party => ({
  companyName: "",
  signatoryName: "",
  signatoryTitle: "",
  noticeAddress: "",
});

/**
 * Starting values for the form, matching the defaults printed on the
 * Common Paper Cover Page template.
 *
 * `effectiveDate` is deliberately empty rather than "today": this module is
 * evaluated during prerender, so baking in a date would ship the build date to
 * every visitor and mismatch on hydration. The form fills it in on mount.
 */
export const createDefaultFormData = (): NdaFormData => ({
  purpose:
    "Evaluating whether to enter into a business relationship with the other party.",
  effectiveDate: "",
  ndaTerm: { kind: "expires", years: 1 },
  confidentialityTerm: { kind: "years", years: 1 },
  governingLaw: "",
  jurisdiction: "",
  modifications: "",
  party1: emptyParty(),
  party2: emptyParty(),
});

/** Today in the viewer's own timezone, as `yyyy-mm-dd`. */
export const todayIso = (): string => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};
