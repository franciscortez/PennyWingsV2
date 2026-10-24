# PennyWings offline experience

## Approved design and constraints

Improve both the standalone offline launch page and connection feedback inside the open app. Preserve the PennyWings paper/pink and slate/pink themes. Recovery is user initiated; keep open forms editable and do not reload, close, reset, or persist them. Financial writes stay guarded and are never queued or replayed. Cache only the self-contained public offline page, with no private records or authenticated pages.

Use a connection illustration, clear heading, 16px body copy, 24px spacing, and a full-width 48px recovery button near the bottom of the launch screen. Respect safe areas and enlarged text. Read the saved theme safely with a device-preference fallback. Announce connection detection without claiming backend reachability.

## Tasks

- [x] Redesign the standalone fallback with inline assets and manual retry feedback, preserving the requested URL.
- [x] Add shared connection-feedback state and guarded read recovery; present a sticky page notice or a compact notice in the topmost sheet.
- [x] Distinguish unavailable query data from genuine empty records on six financial pages. Contain offline lazy-route failures inside the persistent shell.
- [x] Verify unit and browser scenarios, lint/build/diff checks, and independent review.

## Acceptance

Test offline launch and failed retry, theme and storage fallback, manual recovery, retained deep links, unchanged cache contents, loaded versus unavailable data, preserved draft values, failed/unconfirmed save recovery, nested form feedback, route chunk failures, light/dark themes, portrait/landscape, keyboard access, enlarged text, and safe areas. Physical iPhone installation and Safari toolbar/keyboard behavior remain manual checks.

## Execution record

Continue in the existing feature branch and preserve the already verified navigation and money-entry changes. Publishing is paused for this implementation. No new dependencies or database contracts are required.

Ruling: `networkMode: 'always'`, no offline retries, and `refetchOnReconnect: false` are all required for manual recovery: TanStack Query otherwise resumes paused initial reads. Expected offline read errors do not create redundant alert toasts.

Ruling: the shell clips horizontal overflow instead of creating a scroll container, allowing the page notice to stick to the viewport. Compact notices appear only in the topmost registered modal; the background notice stops announcing while a modal owns focus.

Ruling: exclude previous-query placeholder data when deciding whether records have loaded. Do not reset an Activity page/filter URL based on unavailable results. The independently queried daily-spending calendar also gets an unavailable state.

Ruling: recognizable chunk-import failures remain route-local after reconnect because React.lazy caches rejected imports. Ordinary rendering failures still reach the existing application error boundary.

Ruling: disable SDK retries on 31 read-select queries so TanStack Query owns online retries and offline reads cannot continue through SDK backoff. This uses the installed SDK's documented [retry modifier](https://supabase.com/docs/reference/javascript/retry); mutation chains and financial contracts are unchanged.

## Verification results

- `npm run test`: 51 files, 436 tests passed. New recovery and route-boundary regressions were first observed failing before their implementation.
- `npm run lint`: passed, with the three existing React Hook Form compiler warnings.
- `npm run build`: passed, with the existing warning about a JavaScript chunk larger than 500 kB.
- Mobile Safari offline experience, navigation, and primary-action suites: 22 passed.
- Chromium offline-experience suite: 7 passed.
- Additional transaction/account sheet and warm-offline regression checks across Chromium and Mobile Safari passed.
- Production service-worker tests on Chromium and WebKit: 2 passed, including failed retry, deep-link preservation, public-only cache contents, and unchanged server-error handling.
- Browser screenshots inspected for the standalone offline design and form feedback. Enlarged text, dark/light themes, blocked theme storage, nested picker announcements, real empty reports, unavailable financial data, and cached route-import errors were exercised.
- Independent review found no remaining important issues. Architecture skill validation and `git diff --check` passed.
- Physical iPhone Safari keyboard, toolbar expansion/collapse, and installed-PWA behavior were not verified.
