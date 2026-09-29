import { Plus } from 'lucide-react'

import { sectionIds } from '@/sections/home/landingContent'
import { Reveal } from '@/sections/home/Reveal'

// Honest limits belong here too: PHP only, and no bank or e-wallet linking.
const faqs = [
  {
    question: 'Does PennyWings connect to my bank or e-wallet?',
    answer:
      'No. PennyWings does not link to banks or e-wallet providers. You log income, expenses, transfers and withdrawals yourself, and the app keeps every balance in step.',
  },
  {
    question: 'Which currency does it use?',
    answer: 'Philippine peso. Every account, budget, goal and report is tracked in PHP.',
  },
  {
    question: 'Who can see a shared account?',
    answer:
      'Only you and the people who joined with a code you created. Each member is a viewer or a transactor, and you can change their role or remove them at any time. Your other accounts stay private.',
  },
  {
    question: 'What does "lent" mean as an account type?',
    answer:
      'It tracks money you have lent to someone, so it still counts toward what you own without being mixed into your spending cash.',
  },
  {
    question: 'How do monthly reports work?',
    answer:
      'Each month gets a report with income, spending, net cash flow, your top categories and a snapshot of every account balance. Pick any month to look back.',
  },
  {
    question: 'How do I sign in?',
    answer: 'With your email and a password, or with your Google account.',
  },
]

export function FaqSection() {
  return (
    <section
      id={sectionIds.faq}
      aria-labelledby="faq-title"
      className="scroll-mt-20 border-t border-pink-100 bg-pink-50 px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <p className="font-geist-mono text-xs font-medium uppercase tracking-[0.18em] text-pink-900">
            FAQ
          </p>
          <h2
            id="faq-title"
            className="mt-4 text-4xl font-semibold leading-[1.08] tracking-tighter text-slate-950 md:text-5xl"
          >
            Good to know.
          </h2>
        </Reveal>

        <Reveal delay={0.05} className="mt-12">
          <div className="divide-y divide-pink-200 border-y border-pink-200">
            {faqs.map((faq) => (
              <details key={faq.question} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-lg font-semibold text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink-800 [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-pink-200 bg-white text-pink-900 transition-transform duration-300 group-open:rotate-45">
                    <Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                </summary>
                <p className="max-w-[62ch] pb-6 pr-12 text-[16px] leading-relaxed text-slate-600">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
