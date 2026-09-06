import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Home from "@/app/page";
import { todayIso } from "@/lib/nda/defaults";
import type { NdaFormData } from "@/lib/nda/types";

/**
 * The form, its state, and the download call, exercised together.
 *
 * `tests/pdf.test.tsx` proves that a given `NdaFormData` produces the right
 * document; these tests prove the app hands the PDF layer the data the user
 * actually typed. A field wired to the wrong state key passes every other
 * test in the suite and fails here.
 */

const { downloadCalls } = vi.hoisted(() => ({
  downloadCalls: [] as NdaFormData[],
}));

// The real renderer still runs — only its argument is recorded on the way
// through, so the blob, the file name and the anchor click are the app's own.
vi.mock("@/lib/nda/pdf", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/nda/pdf")>();
  return {
    ...actual,
    downloadNdaPdf: async (data: NdaFormData) => {
      downloadCalls.push(structuredClone(data));
      return actual.downloadNdaPdf(data);
    },
  };
});

type Download = { blob: Blob; fileName: string };

/**
 * Intercepts the object-URL dance `downloadNdaPdf` performs, which jsdom
 * implements neither half of, and records what was handed to the browser.
 */
function captureDownloads(): Download[] {
  const downloads: Download[] = [];
  let pending: Blob | null = null;

  vi.spyOn(URL, "createObjectURL").mockImplementation((blob) => {
    pending = blob as Blob;
    return "blob:nda-test";
  });
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    if (pending) downloads.push({ blob: pending, fileName: this.download });
    pending = null;
  });

  return downloads;
}

const PARTY_1 = {
  companyName: "Acme, Inc.",
  signatoryName: "Jordan Rivera",
  signatoryTitle: "Chief Executive Officer",
  noticeAddress: "legal@acme.com",
};
const PARTY_2 = {
  companyName: "Contoso Ltd.",
  signatoryName: "Sam Chen",
  signatoryTitle: "General Counsel",
  noticeAddress: "legal@contoso.com",
};

const party = (legend: string) =>
  within(screen.getByRole("group", { name: legend }));

async function fillParty(
  legend: string,
  values: typeof PARTY_1,
  user: ReturnType<typeof userEvent.setup>,
) {
  const fields = party(legend);
  await user.type(fields.getByLabelText("Company"), values.companyName);
  await user.type(fields.getByLabelText("Signatory name"), values.signatoryName);
  await user.type(fields.getByLabelText("Title"), values.signatoryTitle);
  await user.type(fields.getByLabelText("Notice address"), values.noticeAddress);
}

/** Fills every field the form requires, leaving the defaults alone. */
async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Governing law"), "Delaware");
  await user.type(screen.getByLabelText("Jurisdiction"), "New Castle, DE");
  await fillParty("Party 1", PARTY_1, user);
  await fillParty("Party 2", PARTY_2, user);
}

const downloadButton = () => screen.getByRole("button", { name: /Download PDF/ });
const preview = () =>
  within(screen.getByRole("region", { name: "Document preview" }));

let downloads: Download[];

beforeEach(() => {
  downloadCalls.length = 0;
  downloads = captureDownloads();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("the effective date", () => {
  it("starts at today", () => {
    render(<Home />);
    expect(screen.getByLabelText("Effective date")).toHaveValue(todayIso());
  });

  it("is absent from the prerendered markup", () => {
    // The page is a static prerender, so reading the clock during render would
    // ship the build date to every visitor and mismatch on hydration. Only a
    // server render can tell that apart from a date filled in on the client.
    expect(renderToString(<Home />)).not.toContain(todayIso());
  });

  it("keeps the date the user picks", async () => {
    const user = userEvent.setup();
    render(<Home />);
    fireEvent.change(screen.getByLabelText("Effective date"), {
      target: { value: "2026-09-05" },
    });
    expect(screen.getByLabelText("Effective date")).toHaveValue("2026-09-05");

    await fillRequiredFields(user);
    await user.click(downloadButton());
    await waitFor(() => expect(downloadCalls).toHaveLength(1));
    expect(downloadCalls[0].effectiveDate).toBe("2026-09-05");
  });
});

describe("the live preview", () => {
  it("shows what the user types", async () => {
    const user = userEvent.setup();
    render(<Home />);

    expect(preview().getByText("[Fill in state]")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Governing law"), "Delaware");
    await user.type(
      party("Party 1").getByLabelText("Company"),
      PARTY_1.companyName,
    );

    expect(preview().queryByText("[Fill in state]")).not.toBeInTheDocument();
    expect(preview().getAllByText("Delaware").length).toBeGreaterThan(0);
    expect(preview().getAllByText(PARTY_1.companyName).length).toBeGreaterThan(0);
  });
});

describe("downloading", () => {
  it("refuses to generate a document while required fields are empty", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(downloadButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /fields still need attention/,
    );
    expect(downloadCalls).toHaveLength(0);
    expect(downloads).toHaveLength(0);
    // Only now, after an attempt, do the individual fields complain.
    expect(screen.getByText("Name the governing state.")).toBeInTheDocument();
  });

  it("stops complaining once the missing fields are filled in", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(downloadButton());
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    await fillRequiredFields(user);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText("Name the governing state.")).not.toBeInTheDocument();
  });

  it("hands the PDF exactly what was entered on the form", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.clear(screen.getByLabelText("Purpose"));
    await user.type(screen.getByLabelText("Purpose"), "Evaluating a merger.");
    await user.type(screen.getByLabelText("Modifications"), "Clause 9 amended.");
    fireEvent.change(screen.getByLabelText("Effective date"), {
      target: { value: "2026-09-05" },
    });
    await fillRequiredFields(user);
    await user.click(downloadButton());

    await waitFor(() => expect(downloadCalls).toHaveLength(1));
    expect(downloadCalls[0]).toEqual({
      purpose: "Evaluating a merger.",
      effectiveDate: "2026-09-05",
      ndaTerm: { kind: "expires", years: 1 },
      confidentialityTerm: { kind: "years", years: 1 },
      governingLaw: "Delaware",
      jurisdiction: "New Castle, DE",
      modifications: "Clause 9 amended.",
      party1: PARTY_1,
      party2: PARTY_2,
    });
  });

  it("saves a PDF named after both companies", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await fillRequiredFields(user);
    await user.click(downloadButton());

    // Unlike the other waits, this one is gated on a real multi-page
    // `pdf().toBlob()` rather than on the call that starts it.
    await waitFor(() => expect(downloads).toHaveLength(1), { timeout: 5000 });
    expect(downloads[0].fileName).toBe("Mutual-NDA-Acme-Inc-Contoso-Ltd.pdf");
    expect(downloads[0].blob.type).toBe("application/pdf");
    expect(downloads[0].blob.size).toBeGreaterThan(1000);
  });

  it("reports a failure instead of leaving the button spinning", async () => {
    const user = userEvent.setup();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(URL, "createObjectURL").mockImplementation(() => {
      throw new Error("boom");
    });
    render(<Home />);

    await fillRequiredFields(user);
    await user.click(downloadButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not generate the PDF. Please try again.",
    );
    expect(downloadButton()).toBeEnabled();
  });
});

describe("the term options", () => {
  it("passes on an open-ended MNDA term and perpetual confidentiality", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("radio", { name: /Continues until terminated/ }));
    await user.click(screen.getByRole("radio", { name: /In perpetuity/ }));
    await fillRequiredFields(user);
    await user.click(downloadButton());

    await waitFor(() => expect(downloadCalls).toHaveLength(1));
    expect(downloadCalls[0].ndaTerm).toEqual({ kind: "until-terminated" });
    expect(downloadCalls[0].confidentialityTerm).toEqual({ kind: "perpetuity" });
  });

  it("passes on the year counts typed against each fixed term", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const ndaYears = screen.getByLabelText("MNDA term in years");
    await user.clear(ndaYears);
    await user.type(ndaYears, "3");
    const confidentialityYears = screen.getByLabelText(
      "Term of confidentiality in years",
    );
    await user.clear(confidentialityYears);
    await user.type(confidentialityYears, "5");

    await fillRequiredFields(user);
    await user.click(downloadButton());

    await waitFor(() => expect(downloadCalls).toHaveLength(1));
    expect(downloadCalls[0].ndaTerm).toEqual({ kind: "expires", years: 3 });
    expect(downloadCalls[0].confidentialityTerm).toEqual({
      kind: "years",
      years: 5,
    });
  });

  it("rejects a term of less than a year", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const ndaYears = screen.getByLabelText("MNDA term in years");
    await user.clear(ndaYears);
    await user.type(ndaYears, "0");

    await fillRequiredFields(user);
    await user.click(downloadButton());

    expect(await screen.findByText("Must be at least 1 year.")).toBeInTheDocument();
    expect(downloadCalls).toHaveLength(0);
  });
});
