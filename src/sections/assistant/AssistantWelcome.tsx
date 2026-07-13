import {
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  CircleDollarSign,
  ReceiptText,
  Target,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'

import { AssistantMark } from '@/sections/assistant/AssistantMark'

type SuggestedQuestion = {
  icon: LucideIcon
  label: string
  question: string
}

type AssistantWelcomeProps = {
  disabled: boolean
  onSelect: (question: string) => void
}

const suggestions: SuggestedQuestion[] = [
  {
    icon: WalletCards,
    label: 'Financial overview',
    question: 'Give me a summary of my finances.',
  },
  {
    icon: CircleDollarSign,
    label: 'Current net worth',
    question: 'What is my current net worth?',
  },
  {
    icon: CalendarDays,
    label: 'Spending this month',
    question: 'How much have I spent this month?',
  },
  {
    icon: ReceiptText,
    label: 'Largest expenses',
    question: 'What are my largest recent expenses?',
  },
  {
    icon: ChartNoAxesColumnIncreasing,
    label: 'Budget progress',
    question: 'Am I staying within my budgets?',
  },
  {
    icon: Target,
    label: 'Savings goals',
    question: 'How are my savings goals progressing?',
  },
]

export function AssistantWelcome({
  disabled,
  onSelect,
}: AssistantWelcomeProps) {
  return (
    <div className="flex min-h-full flex-col items-center justify-start px-1 py-4 text-center md:justify-center md:py-2">
      <AssistantMark size="lg" className="mb-5" />
      <h3 className="text-base font-black text-gray-800 dark:text-slate-100">
        What would you like to know?
      </h3>
      <p className="mt-1 max-w-xs text-xs font-medium leading-relaxed text-gray-500 dark:text-slate-400">
        Choose a popular question or write your own below.
      </p>

      <div className="mt-5 grid w-full grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1">
        {suggestions.map(({ icon: Icon, label, question }) => (
          <button
            key={question}
            type="button"
            onClick={() => onSelect(question)}
            disabled={disabled}
            title={question}
            className="group/suggestion flex min-h-12 items-center gap-3 rounded-lg border border-pink-100 bg-pink-50/50 px-3 py-2 text-left transition duration-200 hover:-translate-y-0.5 hover:border-pink-300 hover:bg-pink-50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-none dark:border-slate-700 dark:bg-slate-800/70 dark:hover:border-pink-500 dark:hover:bg-slate-800"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-pink-600 shadow-sm dark:bg-slate-900 dark:text-pink-400">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1 text-xs font-bold leading-snug text-gray-700 dark:text-slate-200">
              {label}
            </span>
            <ArrowUpRight
              className="h-4 w-4 shrink-0 text-gray-300 transition group-hover/suggestion:-translate-y-0.5 group-hover/suggestion:translate-x-0.5 group-hover/suggestion:text-pink-500 motion-reduce:transform-none dark:text-slate-600"
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
