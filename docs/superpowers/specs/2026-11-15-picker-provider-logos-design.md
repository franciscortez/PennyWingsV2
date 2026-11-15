# Design: provider logos in the payment source picker

## Context
In the "Choose a bank card" and "Choose an e-wallet" sheets, every account row shows the same
pink card or wallet icon, so BPI, Unionbank, Maribank and the others all look identical.
The official logo SVGs are already in `src/assets/bank-logos/` (16 files plus `SOURCES.md`;
no UNO logo). Goal: show each account's provider logo in the picker. Accounts with no logo keep
the generic icon. Add a temporary preview page so the result can be checked in playwright-cli
without logging in.

## Design (brainstorming outcome)
- **Goal:** recognize an account at a glance in the picker.
- **Non-goals:** card faces (`BankCardFace`), the Accounts page, the transactions table,
  a Wise card design, new logos.
- **Approaches considered:**
  1. **Wide white logo chip with the full wordmark (recommended).** The chip is 40px tall and
     56px wide (`h-10 w-14`), so the row height stays the same. The files are used unmodified,
     except for viewBox fixes on two of them.
  2. Round chip with an icon-only mark. Rejected: BDO, BPI, Maya, Tonik, PayPal and Grab are
     pure wordmarks with no icon to crop, and cropping means editing the SVGs.
  3. A chip filled with the brand color. Rejected: most logos use the brand color themselves
     (BDO blue on blue, for example), so they would disappear.
- **Detection:** reuse `getAccountCardDesign(account)` from
  `src/sections/accounts/bankCardDesigns.ts`. It matches by stored color, then wallet type,
  then name. The only extra rule is a fallback that matches `/\bwise\b/i` on the account name.
- **Contrast:** the chip is white in both themes. CIMB's file has white text, so its chip
  is `bg-slate-900`.

## Files
- **New** `src/sections/accounts/bankLogos.ts`: `getAccountLogo(account) → { src, alt } | null`.
  It loads the logos with `import.meta.glob('@/assets/bank-logos/*.svg', { eager: true, query: '?url', import: 'default' })`
  and exports a `darkChipKeys` set containing `cimb`.
- **Edit** `src/sections/transactions/PaymentSourcePicker.tsx`:
  - Add an `AccountChip` that renders a `LogoChip` (an `<img>` with `object-contain`, `alt=""`
    and `aria-hidden`) when a logo exists, and falls back to `IconChip` otherwise.
  - Use it in the account-step rows and in the closed tile when the method is `card` or `ewallet`
    and an account is selected.
  - Method rows, cash, lent and the unselected state keep `IconChip`.
- **Edit** `src/assets/bank-logos/bdo.svg`: add `viewBox="0 0 415.4375 145.15625"`.
- **Edit** `src/assets/bank-logos/bpi.svg`: tighten the viewBox to the bounds measured with
  `getBBox()` in a browser. Viewbox changes only on both files.
- **Edit** `tests/unit/PaymentSourcePicker.test.tsx`: the tests below come first, as TDD.
- **Temporary** `tmp/logo-picker-preview.html` and `tmp/LogoPickerPreview.tsx`:
  - A Vite dev-only page at `http://localhost:5173/tmp/logo-picker-preview.html`.
  - It renders the real `PaymentSourcePicker` with mock accounts: BPI, Unionbank, Maribank,
    Wise, GoTyme "GoSave", Metrobank, CIMB, and "Christmas Present" (unbranded) as cards;
    GCash, Maya, GrabPay and PayPal as wallets.
  - It has light and dark toggle buttons and a `QueryClientProvider` wrapper, and imports
    `@/index.css` and the Geist fonts.
  - It is not in the build input (`index.html` only), so the production bundle doesn't change.
  - Delete it after you approve the result.
- **Docs:** write the design spec to `docs/superpowers/specs/2026-11-15-picker-provider-logos-design.md`
  and the plan to `docs/superpowers/plans/2026-11-15-picker-provider-logos.md`.

## Steps (writing-plans, then executing-plans)
1. Write the spec and plan docs. They will not be committed.
2. TDD: add failing unit tests:
   - The BPI row (`accountType` savings, name "BPI") renders an `img` whose src contains `bpi`.
   - The "Christmas Present" row has no img and keeps the icon.
   - A "Wise" row gets the wise logo.
   - The tile shows the logo once a card is selected.
   - Method rows never show a logo.
   Run `npm test` and confirm they fail.
3. Implement `bankLogos.ts` and the chip changes, then run `npm test` until it passes.
4. Apply the two SVG viewBox fixes. Measure BPI with playwright-cli first.
5. Create the tmp preview page.
6. Validate with playwright-cli (`--browser=msedge`, because Chrome is not installed):
   - Start `npm run dev` and open the preview.
   - Open the bank card list and the e-wallet list.
   - Take screenshots at 375px and 1440px, in light and dark mode.
   - Check that the logos are readable and not clipped, the row height is unchanged, the
     unbranded row shows the icon, and the tile shows the logo after a selection.
7. Run `npm run lint`, `npm run build` and `npm run test:e2e`. All three must pass.
   Lint will also check `tmp/`; fix anything it reports.
8. Report the screenshots and the preview URL, and leave the dev server running so you can look.
   Then ask whether to delete `tmp/`.

## Guardrails
- No commits, no pushes, no new dependencies.
- No edits outside the files listed above.
- Stop after 3 failed fixes of the same error and report it.

## Verification
- `npm test` passes, including the new picker tests.
- `npm run lint`, `npm run build` and `npm run test:e2e` all pass.
- playwright-cli screenshots of the preview, covering both lists at both widths in both themes,
  are saved to the scratchpad and shown to you.
