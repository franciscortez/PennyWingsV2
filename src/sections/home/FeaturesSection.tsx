import { BadgeCheck, RefreshCw, Zap } from 'lucide-react'

const features = [
  {
    title: 'Smart Tracking',
    desc: 'Automatically categorize your spending so you know exactly where your money flows.',
    icon: <Zap className="h-6 w-6 text-pink-600" aria-hidden="true" />,
  },
  {
    title: 'Goal Setting',
    desc: 'Set and track savings goals for that dream vacation or comfortable emergency fund.',
    icon: <BadgeCheck className="h-6 w-6 text-pink-600" aria-hidden="true" />,
  },
  {
    title: 'Seamless Sync',
    desc: 'Connect your bank cards and e-wallets securely to see your financial ecosystem in one place.',
    icon: <RefreshCw className="h-6 w-6 text-pink-600" aria-hidden="true" />,
  },
]

export function FeaturesSection() {
  return (
    <section className="bg-white px-4 py-24">
      <div className="mx-auto max-w-6xl text-center">
        <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
          Everything you need to{' '}
          <span className="bg-gradient-to-r from-pink-500 to-pink-700 bg-clip-text text-transparent">
            thrive
          </span>{' '}
          financially
        </h2>
        <p className="mx-auto mb-16 max-w-2xl text-gray-500">
          Ditch the complicated spreadsheets. Our tools are designed to be
          gorgeous, intuitive, and highly effective.
        </p>

        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group flex flex-col items-center rounded-[2rem] border border-pink-200 bg-pink-50/50 p-8 text-center transition-all duration-300 hover:-translate-y-2"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                {feature.icon}
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900">
                {feature.title}
              </h3>
              <p className="leading-relaxed text-gray-600">{feature.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
