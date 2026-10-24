# Bottom-attached mobile navigation

## Approved design

Replace the floating mobile dock with a full-width bar attached to the screen bottom. Preserve the five tabs, colors, active indicator, routes, connection handling, keyboard hiding, and form layering. Extend the background behind the home indicator while keeping controls above the safe area. Desktop behavior stays unchanged.

## Implementation plan

- [x] Unify navigation geometry in `src/index.css` and `src/mobile.css`: one shared 68px row height, zero outer margins, internal landscape and bottom safe-area padding, a top border, and no floating shadow or outer pill shape.
- [x] Update page clearance to bar height + bottom safe inset + 32px. Position More and notification toasts 12px above the bar, and update More's available height. Preserve the active indicator inside the row.
- [x] Update existing browser geometry regressions and verify narrow portrait, landscape, safe areas, scrolling, routes, More, toasts, keyboard hiding, forms, themes, reduced motion, and desktop behavior.
- [x] Run focused Chromium/WebKit browser checks, lint, build, and diff checks. Obtain independent review and record results.

## Constraints and execution notes

No new dependencies, public interfaces, data services, or database changes. Leave changes uncommitted until requested. Physical iPhone Safari toolbar and installed-PWA verification remains a manual release check.

Ruling: use a dedicated branch in the existing clean checkout so the user's running development environment shows the change. No additional worktree or dependency installation is needed for this CSS-only change.

Ruling: keep this short plan as the execution record rather than creating a second bookkeeping workspace. Navigation geometry and surrounding spacing form one CSS change, verified together against existing browser suites.

## Verification record

- The updated edge-attachment regression failed against the original dock (12px left inset instead of zero), then passed after the CSS change.
- Chromium and WebKit navigation/primary-action suites: 28 passed. Mobile Safari equivalents: 14 passed.
- Additional safe-area/More/toast and transaction/account sheet checks across Chromium, WebKit, and Mobile Safari: 9 passed.
- Independent review found no important issues in navigation geometry or the subsequent money-input changes.
- Final unit suite: 49 files, 428 tests passed. The initial money-input test failed because the shared component did not exist, then all 18 formatter/input tests passed after implementation.
- Money typing/cursor, numeric debt submission, navigation resizing, and sheet checks across three browser projects: 14 passed initially; one sheet check read the old viewport before its resize event completed. After waiting for settled geometry, all three browser variants of that check passed.
- `npm run lint`: passed with three existing React Hook Form compiler warnings. `npm run build`: passed with the existing large-entry-chunk warning. `git diff --check`: passed.
- Physical iPhone keyboard, Safari toolbar expansion/collapse, and installed-PWA behavior were not verified.

## Additional authorized work: shared money entry

During implementation the user requested automatic thousands separators in money fields. `src/lib/moneyInput.ts` exports string-based formatting/parsing; `MoneyInput` applies them while maintaining cursor position and a decimal keyboard. `22222.50` displays as `22,222.50`, and forms retain raw `22222.50` for validation and numeric submission.

All nine money fields in seven forms now use the shared input: transaction amount/fee, initial account balance, budget limit, goal target/saved amount, new debt, purchase, and repayment. Account identifiers and card suffixes remain plain text. Debt form adapters convert editing strings through the existing numeric schemas. Services, RPCs, ownership checks, and balance calculations were not changed. Tests cover grouped paste, clearing, unfinished decimals, middle edits, deletion across separators, external presets, and numeric submission.
