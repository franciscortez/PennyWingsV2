import {
  FeaturesSection,
  FooterSection,
  HeroSection,
} from '@/sections/home'

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-pink-50 font-sans text-gray-800">
      <HeroSection />
      <FeaturesSection />
      <FooterSection />
    </main>
  )
}
