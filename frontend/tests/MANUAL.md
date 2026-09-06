# Manual test plan

The automated suite (`npm test`) covers the data path: form input → React state →
`downloadNdaPdf` → PDF text. It cannot see layout, and it never asks a real
browser to save a file. This plan covers what is left.

Run it before releasing a change to `components/`, `lib/nda/pdf.tsx`, or
`app/page.tsx`. Start the app with `npm run dev` and open http://localhost:3000.

## 1. First load

1. Open the page at a desktop width.
2. **Effective date** is prefilled with today's date.
3. The preview lists every Cover Page section, with unfilled slots shown as
   greyed bracketed prompts (`[Fill in state]`, `[Company]`).
4. Both **MNDA Term** and **Term of Confidentiality** show one ticked box and one
   empty box.

## 2. Validation

1. With the party fields still empty, click **Download PDF**.
2. A count of outstanding fields appears under the button, and each empty field
   grows its own message. No file is downloaded.
3. Fill the fields in. The messages disappear as you go, and the count clears.

## 3. Live preview

1. Type a company name, a governing law and a jurisdiction.
2. Each appears in the preview as you type, in the darker "filled" style.
3. Enter a very long company name and a long email notice address. Both wrap
   inside their table cells.

## 4. Download

1. Fill in every field and click **Download PDF**.
2. The browser saves `Mutual-NDA-<Party 1>-<Party 2>.pdf`.
3. Open the file in a PDF reader and check:
   - every page is numbered `n of N`;
   - the ticked options match the form, and the checkmarks sit inside their
     boxes rather than clipped or missing;
   - the signature block is intact on a single page, with the
     `PARTY 1` / `PARTY 2` headings above the rows they label, and the
     "Use either email or postal address" guidance under the Notice Address
     label;
   - the Common Paper attribution is on the last page;
   - the Signature and Date cells are empty, ready to sign.
4. Switch **MNDA Term** to *Continues until terminated* and **Term of
   Confidentiality** to *In perpetuity*, download again, and confirm the ticks
   moved.

## 5. Narrow screens

1. Set the viewport to a phone width (390 × 844).
2. The form stacks above the preview and the page does not scroll sideways —
   including with a long unbroken notice address, which used to push it wide.

## 6. Keyboard and assistive technology

1. Tab from the top of the page. Focus order follows the visible order and every
   control shows a focus ring.
2. Each input is reachable by its label; the two party sections are announced by
   their `Party 1` / `Party 2` legends.
3. The outstanding-fields message is announced when it appears (`role="alert"`).

## 7. Extreme input

The signature block is rendered with `wrap={false}`, which keeps it whole at the
cost of clipping — rather than flowing — a block taller than the page. Paste
roughly two thousand characters into a notice address, download, and confirm the
Date row and both signature lines are still there. Anything shorter than that is
covered by `tests/pdf.test.tsx`.

## Last run

2026-09-06, Chrome 140 driven headless. Steps 1–5 executed and passing. Step 4
found the signature block splitting across a page break, and step 5 found the
long-address overflow; both are fixed, and both now have coverage — the page
break in `tests/pdf.test.tsx`, the overflow in this plan. Step 6 was read off the
accessibility tree rather than with a screen reader. Step 7 was measured from a
test rather than by hand: the address is clipped from about 2,300 characters,
which is where the note above comes from.
