# Picker Provider Logos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show each card or e-wallet account's provider logo in `PaymentSourcePicker`. Accounts with no logo keep the generic icon.

**Architecture:** A new presentation-only module, `bankLogos.ts`, maps an account to a logo URL. It reuses `getAccountCardDesign`, then falls back to Wise by name. The picker gains an `AccountChip`, which renders a white logo chip or the existing `IconChip`. A temporary Vite page renders the real picker with mock accounts for playwright-cli checks.

**Tech Stack:** React 19, Vite (`import.meta.glob`), Tailwind 4, Vitest + Testing Library, playwright-cli (Edge).

**Spec:** `docs/superpowers/specs/2026-11-15-picker-provider-logos-design.md`

## Global Constraints

- Logos live at `src/assets/bank-logos/<key>.svg`. `key` is the `BankCardDesign.key` value, plus `wise`.
- Chip size: `h-10 w-14 rounded-xl`, white background in both themes. The `cimb` chip uses `bg-slate-900`.
- Logo `<img>`: `alt=""`, `aria-hidden="true"`, `object-contain`. The row text already names the account.
- No new dependencies, no commits or pushes, no Supabase/service imports in the new module.
- SVG edits limited to the root `viewBox` of `bdo.svg` and `bpi.svg`.

## Review Focus

- An account renamed away from its brand name (for example "GoSave (Invesment)" with the GoTyme color) still gets its logo, because detection matches the stored color first.
- A wallet whose `accountType` is `other` and whose name is unbranded shows the wallet icon, not a broken image.
- A lent account named after a bank ("Lent to BPI") shows no logo. `getAccountCardDesign` returns null for non-card/wallet kinds.
- The `uno` design has no SVG file, so it must fall back to the icon rather than render an empty `img`.
- In dark mode, dark logos (GoTyme, PayPal) stay readable because the chip is white.

---

### Task 1: Logo resolver + picker chips (TDD)

**Files:**
- Create: `src/sections/accounts/bankLogos.ts`
- Modify: `src/sections/transactions/PaymentSourcePicker.tsx` (`IconChip` area, the tile, the account rows)
- Test: `tests/unit/PaymentSourcePicker.test.tsx`

**Interfaces:**
- Produces: `getAccountLogo(account: Pick<Account, 'accountType' | 'color' | 'kind' | 'name'>): { key: string; src: string; alt: string } | null`, and `darkChipKeys: ReadonlySet<string>` (contains `'cimb'`).

- [ ] **Step 1: Write failing tests** in a new `describe('provider logos')` block in the picker test. Use the existing `base` and `openSheet` helpers. Fixtures:
  - `bpi`: `{...base, id:'card-bpi', name:'BPI', accountType:'savings', color:'#9E1014'}`
  - `xmas`: `{...base, id:'card-x', name:'Christmas Present', color:'#F472B6'}`
  - `wise`: `{...base, id:'card-w', name:'Wise', color:'#3B82F6'}`
  - `uno`: `{...base, id:'card-u', name:'UNO Savings', color:'#6C4BD3'}`
  - `lentBpi`: `{...lent, id:'lent-b', name:'Lent to BPI'}`

  Tests:
  - `shows the provider logo on branded card rows`: open the sheet, click Bank Card. The BPI row's `img` `src` matches `/bpi/`, and the Wise row's `img` `src` matches `/wise/`.
  - `keeps the generic icon for unbranded and logo-less accounts`: the Christmas Present and UNO rows contain no `img`.
  - `shows the logo on the tile for a selected card`: render with `method:'card', cardId:'card-bpi'`. The tile contains an `img` with `src` matching `/bpi/`.
  - `never shows logos on method rows or lent accounts`: there is no `img` in the method step. Open Lent with `allowLent:true` and `lentAccounts:[lentBpi]`: there is no `img`.

  Query images with `container.querySelectorAll('img')` scoped to `within(row)`. Images are `aria-hidden`, so `getByRole('img')` will not find them.
- [ ] **Step 2: Run** `npx vitest run tests/unit/PaymentSourcePicker.test.tsx`. Expected: the new tests FAIL (no img found).
- [ ] **Step 3: Implement `bankLogos.ts`.**
  - Load the files with `import.meta.glob('@/assets/bank-logos/*.svg', { eager: true, query: '?url', import: 'default' })` into a key→url record. The key is the file basename without `.svg`.
  - `getAccountLogo`: take the design key from `getAccountCardDesign`. If it is null and `kind` is card or wallet and the name matches `/\bwise\b/i`, use `'wise'`.
  - Return null when there is no file for the key.
  - `alt` = the design's `wordmark`, or `'Wise'`.
- [ ] **Step 4: Picker changes.**
  - Add `LogoChip({ logo })`, using the chip classes from Global Constraints. When `darkChipKeys.has(logo.key)`, use `bg-slate-900 border-slate-700`; otherwise use `bg-white border-slate-200 dark:border-slate-600`. Use `p-1.5` and `border`.
  - Add `AccountChip({ account, method })` = logo ? `LogoChip` : `IconChip`.
  - Use `AccountChip` in the account-step rows.
  - In the tile, when `!unselected && (method === 'card' || method === 'ewallet') && selectedAccount`, use `AccountChip`; keep the current `IconChip` otherwise.
- [ ] **Step 5: Run** `npx vitest run tests/unit/PaymentSourcePicker.test.tsx`. Expected: all PASS, including the existing tests.

### Task 2: SVG viewBox fixes

**Files:** Modify `src/assets/bank-logos/bdo.svg` and `src/assets/bank-logos/bpi.svg` (root `viewBox` only).

- [ ] **Step 1:** In `bdo.svg`, add `viewBox="0 0 415.4375 145.15625"` to the root `<svg>`.
- [ ] **Step 2:** Measure BPI's content bounds with playwright-cli: load the SVG inline and run `svg.getBBox()` on the root's content. Set `viewBox` to the measured `x y width height`, rounded outward to whole units.
- [ ] **Step 3:** Render both in a browser. Expected: the marks fill their box and nothing is clipped.

### Task 3: Temporary preview page + browser validation

**Files:** Create `tmp/logo-picker-preview.html` and `tmp/LogoPickerPreview.tsx`. Delete both after the user approves.

**Interfaces:** Consumes `PaymentSourcePicker` and `Account`.

- [ ] **Step 1:** Write the HTML entry: `<div id="root">` plus a module script `./LogoPickerPreview.tsx`.
- [ ] **Step 2:** Write the preview.
  - Import `@/index.css`, `@/mobile.css` and the Geist fonts. Wrap the page in `QueryClientProvider` with a new `QueryClient`.
  - Add Light and Dark buttons that toggle `document.documentElement.classList` `dark`.
  - Card accounts: BPI `#9E1014`, Unionbank `#F58220`, Maribank `#EE4D2D`, Wise (custom color), GoSave (Invesment) `#071D2B`, Metrobank `#00509E`, CIMB `#B5121F`, Christmas Present `#F472B6`.
  - Wallet accounts: GCash `gcash`, Maya `maya`, GrabPay `grabpay`, PayPal `paypal`.
  - Keep method and account in `useState` so selection updates the tile.
- [ ] **Step 3:** Run `npm run dev` in the background and open `http://localhost:5173/tmp/logo-picker-preview.html` with `playwright-cli open --browser=msedge`.
- [ ] **Step 4:** Take screenshots of the bank card list and the e-wallet list at 375×812 and 1440×900, in light and dark mode. Then select BPI and screenshot the tile. Expected: logos are readable and not clipped, the row height is unchanged, Christmas Present shows the card icon, and the tile shows the BPI logo.

### Task 4: Repository gates

- [ ] **Step 1:** Run `npm run lint`. Expected: 0 errors, including in `tmp/`.
- [ ] **Step 2:** Run `npm test`. Expected: all pass.
- [ ] **Step 3:** Run `npm run build`. Expected: tsc and vite succeed.
- [ ] **Step 4:** Run `npm run test:e2e`. Expected: all pass.
- [ ] **Step 5:** No commit. The user did not ask for one. Report the results and the screenshots.
