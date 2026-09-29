import '@fontsource-variable/geist'
import '@fontsource-variable/geist/wght-italic.css'
import '@fontsource-variable/geist-mono'

import { MotionConfig } from 'motion/react'

import {
  AssistantSection,
  BentoSection,
  CtaSection,
  FaqSection,
  FooterSection,
  HeroSection,
  IntegritySection,
  LandingNav,
  ProofStrip,
  SharingSection,
} from '@/sections/home'

export default function Home() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-clip bg-paper font-geist text-slate-950 antialiased">
        <LandingNav />
        <main>
          <HeroSection />
          <ProofStrip />
          <BentoSection />
          <SharingSection />
          <IntegritySection />
          <AssistantSection />
          <FaqSection />
          <CtaSection />
        </main>
        <FooterSection />
      </div>
    </MotionConfig>
  )
}
