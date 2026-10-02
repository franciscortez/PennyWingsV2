# Architecture Map

Current source, `package.json`, `src/lib/database.types.ts`, and ordered migrations are authoritative.

- `src/main.tsx` initializes React/query infrastructure; `src/App.tsx` owns guards and routes.
- Public: `/`, auth/recovery routes, and terms. Protected: dashboard, accounts/archive, transactions, profile, reports, and monitoring.
- `AuthProvider` wraps routing; `AssistantProvider` is keyed per user to isolate conversations.
- `MobileActionProvider` also resets per user and sits above routes. Pages register route-scoped actions with `useMobilePrimaryAction`; the dock calls existing page handlers. Dashboard hands transaction creation to Activity through a consumed router-state marker.
- Dependency flow: `page -> section/component -> hook/context -> service -> Supabase`.
- `Layout` composes the desktop `Sidebar` and an isolated `MobileNavigation` dock below 768px. Its labeled action sits above the six navigation controls. The mobile component owns its More dialog, focus handling, and scroll lock; VisualViewport resize hides the dock for keyboards, and shared geometry reserves action and safe-area clearance.
- Pages compose routes; sections own domain UI; components are reusable; hooks own TanStack Query; services map typed Supabase data; validation uses Zod; types expose application models; lib owns clients and infrastructure.
- Presentation code never imports Supabase directly. Mutations invalidate every affected aggregate.
- Migrations are forward-only. The finance-assistant Edge Function validates bearer tokens with `auth.getUser()`, reads only RLS-visible data, builds bounded context, and calls OpenRouter.
- Use strict TypeScript, `@/` imports, numeric calculations, presentation-only formatting, and explicit accessible loading/empty/error/disabled/success states.
