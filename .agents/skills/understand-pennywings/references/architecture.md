# Architecture Map

Current source, `package.json`, `src/lib/database.types.ts`, and ordered migrations are authoritative.

- `src/main.tsx` initializes React/query infrastructure; `src/App.tsx` owns guards and routes.
- Public: `/`, auth/recovery routes, and terms. Protected: dashboard, accounts (including archived accounts), transactions, debts, profile, reports, and monitoring.
- `AuthProvider` wraps routing; `AssistantProvider` is keyed per user to isolate conversations.
- Dependency flow: `page -> section/component -> hook/context -> service -> Supabase`.
- `Layout` composes the desktop `Sidebar` and `MobileNavigation` below 768px. The five labeled dock controls are Home, Accounts, Activity, Reports, and More; Debts, Monitoring, and Profile remain available in More. Creation actions remain in page content. The native More dialog owns focus and shares the scroll lock; keyboard detection hides the dock. Shell-owned visual viewport measurements size portaled form sheets and Assistant.
- `ModalFrame` supports opt-in mobile bottom sheets with the existing focus/scroll ownership. Account creation uses a content-height sheet. Desktop forms retain their dialog presentation. `src/mobile.css` contains navigation and overlay behavior, not a replacement page design.
- `navigationState` validates login return targets and isolates session tab URLs/scroll by user. `ProtectedRoute` consumes the login destination once; explicit sign-out suppresses recapturing the departing route. Reports stores its selected `month` in the URL.
- `connectivity` and QueryClient mutation defaults reject offline writes immediately, disable automatic retries, and require refreshed records after an unconfirmed network save. Assistant marks its mutation as read-only. No financial changes are queued for replay.
- Production bootstrap registers `/sw.js`, emitted by the Vite build from `src/pwa/sw.js`. Its versioned cache contains only `public/offline.html`; navigation responses and financial data are never cached. Worker updates use normal activation without forced reloads. Run `npx playwright test --config=playwright.pwa.config.ts` after a production build for worker verification against preview.
- Pages compose routes; sections own domain UI; components are reusable; hooks own TanStack Query; services map typed Supabase data; validation uses Zod; types expose application models; lib owns clients and infrastructure.
- Presentation code never imports Supabase directly. Mutations invalidate every affected aggregate.
- Migrations are forward-only. The finance-assistant Edge Function validates bearer tokens with `auth.getUser()`, reads only RLS-visible data, builds bounded context, and calls OpenRouter.
- Use strict TypeScript, `@/` imports, numeric calculations, presentation-only formatting, and explicit accessible loading/empty/error/disabled/success states.
