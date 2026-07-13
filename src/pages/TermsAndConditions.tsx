import {
  TermsContentSection,
  TermsFooterSection,
  TermsHeroSection,
} from '@/sections/terms'

export default function TermsAndConditions() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-pink-50 font-sans text-gray-800">
      <TermsHeroSection />
      <TermsContentSection />
      <TermsFooterSection />
    </main>
  )
}
