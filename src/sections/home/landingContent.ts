// Shared constants for the public landing page (`src/pages/Home.tsx`).
//
// Everything here is presentation-only. The landing never reads Supabase; the
// product previews use the local mock figures below so the page renders the
// same for every visitor and never exposes real financial data.

/* ─── Image slots ──────────────────────────────────────────────────────────
   The three illustrations match the 3D butterfly mascot in
   `public/pennywings-butterfly-transparent.png`. They have transparent
   backgrounds so the page's pink surfaces show through. Width and height
   preserve each slot's intended aspect ratio before the image loads. */

export type LandingImage = {
  id: string
  src: string | null
  alt: string
  width: number
  height: number
  prompt: string
}

export const landingImages = {
  // public/landing/hero-scene.webp (transparent background)
  hero: {
    id: 'hero-scene',
    src: '/landing/hero-scene.webp',
    alt: 'The PennyWings butterfly gliding above a stack of floating peso coins, a bank card and an e-wallet',
    width: 1600,
    height: 1400,
    prompt:
      'Soft 3D clay render of the pink PennyWings butterfly mascot mid-flight, lifting gently above floating peso coins, a rounded bank card and a phone e-wallet. Pastel pink and white palette, soft studio lighting, transparent background.',
  },
  // public/landing/shared-accounts-scene.webp (transparent background)
  sharing: {
    id: 'shared-accounts-scene',
    src: '/landing/shared-accounts-scene.webp',
    alt: 'Two PennyWings butterflies sharing a single glowing account card between them',
    width: 1600,
    height: 1100,
    prompt:
      'Two soft 3D clay butterflies, one pink and one pale rose, holding opposite ends of a single rounded account card with a small key tag. Transparent background, gentle depth of field, friendly and trustworthy mood.',
  },
  // public/landing/assistant-scene.webp (transparent background)
  assistant: {
    id: 'assistant-scene',
    src: '/landing/assistant-scene.webp',
    alt: 'The PennyWings butterfly reading a small chart on a floating chat bubble',
    width: 1200,
    height: 1200,
    prompt:
      'The pink 3D clay butterfly mascot perched on a large rounded chat bubble, looking at a tiny bar chart. Transparent background, playful but calm, square composition.',
  },
} satisfies Record<string, LandingImage>

/* ─── Actions ──────────────────────────────────────────────────────────────
   Shared with the auth pages; see `src/sections/shared/brandActions.ts`. */

export { primaryAction, secondaryAction } from '@/sections/shared/brandActions'

export const sectionIds = {
  features: 'features',
  sharing: 'sharing',
  security: 'security',
  faq: 'faq',
} as const

export const navLinks = [
  { href: `#${sectionIds.features}`, label: 'Features' },
  { href: `#${sectionIds.sharing}`, label: 'Sharing' },
  { href: `#${sectionIds.security}`, label: 'Security' },
  { href: `#${sectionIds.faq}`, label: 'FAQ' },
]
