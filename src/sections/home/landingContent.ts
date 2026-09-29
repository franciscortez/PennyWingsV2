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
   One label per intent across the whole page: "Start free" always signs up,
   "Sign in" always logs in. Interactive elements are full pills; surfaces
   use 32px corners and nested surfaces 20px. */

export const primaryAction =
  'inline-flex h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-pink-700 px-6 font-semibold text-white shadow-wing transition-[background-color,transform] duration-200 hover:bg-pink-800 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-800'

export const secondaryAction =
  'inline-flex h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-pink-200 bg-white px-6 font-semibold text-pink-900 transition-[background-color,border-color,transform] duration-200 hover:border-pink-300 hover:bg-pink-50 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-800'

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
