import { reportCurrency } from '@/lib/currency'
import { AssistantMark } from '@/sections/assistant/AssistantMark'
import { ImageSlot } from '@/sections/home/ImageSlot'
import { landingImages } from '@/sections/home/landingContent'
import { mockBudgets, mockGoal } from '@/sections/home/landingMock'
import { Reveal } from '@/sections/home/Reveal'

const sampleQuestions = [
  'Where did most of my money go last month?',
  'How much is left in my grocery budget?',
  'What is my savings rate this month?',
  'How much have I lent out?',
  'When will I reach my emergency fund?',
  'What did I spend on transport this week?',
  'Which category grew the most since July?',
]

const budget = mockBudgets.monthly
const goalRemaining = mockGoal.target - mockGoal.current
const weeklyToGoal = Math.ceil(goalRemaining / Math.ceil(mockGoal.daysLeft / 7) / 50) * 50

const conversation = [
  { from: 'you', text: 'How much did I spend on food this month?' },
  {
    from: 'assistant',
    text: `You've spent ${reportCurrency.format(budget.spent)} on Food & dining, ${Math.round((budget.spent / budget.limit) * 100)}% of your ${reportCurrency.format(budget.limit)} monthly budget. That leaves ${reportCurrency.format(budget.limit - budget.spent)} for the rest of the month.`,
  },
  { from: 'you', text: 'Am I on track for my emergency fund?' },
  {
    from: 'assistant',
    text: `You're at ${reportCurrency.format(mockGoal.current)} of ${reportCurrency.format(mockGoal.target)} with ${mockGoal.daysLeft} days left. Setting aside about ${reportCurrency.format(weeklyToGoal)} a week gets you there.`,
  },
] as const

export function AssistantSection() {
  return (
    <section aria-labelledby="assistant-title" className="py-24 lg:py-32">
      <div
        className="landing-marquee overflow-hidden border-y border-pink-100 bg-white py-4"
        aria-label="Questions you can ask the assistant"
        role="region"
      >
        <div className="landing-marquee-track flex w-max gap-3">
          {[0, 1].map((copy) => (
            <ul key={copy} className="flex shrink-0 gap-3" aria-hidden={copy === 1 ? true : undefined}>
              {sampleQuestions.map((question) => (
                <li
                  key={question}
                  className="whitespace-nowrap rounded-full border border-pink-100 bg-pink-50 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  {question}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-16 grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:mt-24 lg:grid-cols-12 lg:gap-10 lg:px-8">
        <Reveal className="order-2 lg:order-1 lg:col-span-5">
          <ImageSlot image={landingImages.assistant} />
        </Reveal>

        <div className="order-1 lg:order-2 lg:col-span-7 lg:pl-6">
          <Reveal>
            <h2
              id="assistant-title"
              className="text-4xl font-semibold leading-[1.08] tracking-tighter text-slate-950 md:text-5xl"
            >
              Ask your money a question.
            </h2>
            <p className="mt-5 max-w-[56ch] text-lg leading-relaxed text-slate-600">
              The built-in assistant reads the accounts, budgets, goals and
              reports you&apos;ve logged, then answers in plain words.
            </p>
          </Reveal>

          <Reveal delay={0.06} className="mt-10">
            <ol
              aria-label="Example conversation"
              className="space-y-3 rounded-[2rem] border border-pink-100 bg-white p-5 shadow-wing sm:p-6"
            >
              {conversation.map((message, index) =>
                message.from === 'you' ? (
                  <li key={index} className="flex justify-end">
                    <p className="max-w-[80%] rounded-[1.25rem] rounded-br-md bg-pink-700 px-4 py-3 text-[15px] leading-relaxed text-white">
                      <span className="sr-only">You: </span>
                      {message.text}
                    </p>
                  </li>
                ) : (
                  <li key={index} className="flex items-end gap-3">
                    <AssistantMark size="sm" className="rounded-full" />
                    <p className="max-w-[85%] rounded-[1.25rem] rounded-bl-md bg-pink-50 px-4 py-3 text-[15px] leading-relaxed text-slate-800">
                      <span className="sr-only">Assistant: </span>
                      {message.text}
                    </p>
                  </li>
                ),
              )}
            </ol>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
