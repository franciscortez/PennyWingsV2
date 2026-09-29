import { Check, Minus, RefreshCw, Smartphone } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

import { ImageSlot } from '@/sections/home/ImageSlot'
import { landingImages, sectionIds } from '@/sections/home/landingContent'
import { Reveal } from '@/sections/home/Reveal'

type DemoRole = 'viewer' | 'transactor'

const steps = [
  {
    title: 'Create a code',
    body: 'Owners generate a WING code for one account. It expires after an hour.',
  },
  {
    title: 'Pick a role',
    body: 'Viewers see the balance and activity. Transactors can also log transactions on it.',
  },
  {
    title: 'Stay in charge',
    body: 'Revoke pending codes, change roles or remove members at any time. Members can hide the account or leave.',
  },
]

// Mirrors the shared-account permission model: viewer is read-only,
// transactor may add transactions, and managing members stays with the owner.
const permissions: { label: string; roles: DemoRole[] }[] = [
  { label: 'See the balance and activity', roles: ['viewer', 'transactor'] },
  { label: 'Add transactions to this account', roles: ['transactor'] },
  { label: 'Hide the account or leave it', roles: ['viewer', 'transactor'] },
  { label: 'Change roles or remove members', roles: [] },
]

const roleOptions: { value: DemoRole; label: string }[] = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'transactor', label: 'Transactor' },
]

// Demo only: a fresh six-digit code in the same WING-XXXXXX shape the app
// issues. Nothing is sent anywhere.
function makeDemoCode() {
  const [value] = crypto.getRandomValues(new Uint32Array(1))
  return `WING-${String(value % 1_000_000).padStart(6, '0')}`
}

export function SharingSection() {
  return (
    <section
      id={sectionIds.sharing}
      aria-labelledby="sharing-title"
      className="scroll-mt-20 border-t border-pink-100 bg-pink-50 px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:sticky lg:top-28 lg:col-span-5 lg:self-start">
          <Reveal>
            <p className="font-geist-mono text-xs font-medium uppercase tracking-[0.18em] text-pink-900">
              Shared accounts
            </p>
            <h2
              id="sharing-title"
              className="mt-4 text-4xl font-semibold leading-[1.08] tracking-tighter text-slate-950 md:text-5xl"
            >
              Share an account, not your whole wallet.
            </h2>
            <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-slate-600">
              Invite a partner, parent or housemate into one account.
              Everything else stays private to you.
            </p>
          </Reveal>

          <ol className="mt-10 space-y-6">
            {steps.map((step, index) => (
              <li key={step.title} className="border-t border-pink-200 pt-5">
                <Reveal delay={index * 0.06} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4">
                  <span className="font-geist-mono text-sm font-medium text-pink-900" aria-hidden="true">
                    0{index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-slate-950">{step.title}</h3>
                    <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{step.body}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-6 lg:col-span-7">
          <Reveal>
            <InviteDemo />
          </Reveal>
          <Reveal delay={0.05}>
            <ImageSlot image={landingImages.sharing} />
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function InviteDemo() {
  const [code, setCode] = useState('WING-482917')
  const [role, setRole] = useState<DemoRole>('transactor')

  return (
    <div className="rounded-[2rem] border border-pink-100 bg-white p-6 shadow-wing-lg sm:p-8">
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-900">
          <Smartphone className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-950">Household e-wallet</p>
          <p className="text-sm text-slate-600">You own this account</p>
        </div>
      </div>

      <div className="mt-6 rounded-[1.25rem] bg-pink-50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-600">Invite code</p>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.p
                key={code}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                className="mt-1 font-geist-mono text-2xl font-semibold tracking-wider text-slate-950 sm:text-3xl"
                aria-live="polite"
              >
                {code}
              </motion.p>
            </AnimatePresence>
          </div>
          <button
            type="button"
            onClick={() => setCode(makeDemoCode())}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-pink-200 bg-white px-4 text-sm font-semibold text-pink-900 transition-[background-color,transform] hover:bg-pink-100 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-pink-800"
          >
            <RefreshCw className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            New code
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-600">
          Valid for 60 minutes. Stored only as a hash.
        </p>
      </div>

      <div className="mt-6">
        <p id="demo-role-label" className="text-sm font-semibold text-slate-900">
          Joins as
        </p>
        <div
          role="group"
          aria-labelledby="demo-role-label"
          className="mt-2 inline-flex rounded-full bg-pink-50 p-1"
        >
          {roleOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={role === option.value}
              onClick={() => setRole(option.value)}
              className={[
                'h-9 rounded-full px-5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-pink-800',
                role === option.value
                  ? 'bg-white text-pink-900 shadow-wing'
                  : 'text-slate-600 hover:text-pink-900',
              ].join(' ')}
            >
              {option.label}
            </button>
          ))}
        </div>

        <ul className="mt-5 divide-y divide-pink-100 border-t border-pink-100">
          {permissions.map((permission) => {
            const isAllowed = permission.roles.includes(role)

            return (
              <li key={permission.label} className="flex items-center gap-3 py-3 text-[15px]">
                <span
                  className={[
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors',
                    isAllowed ? 'bg-pink-700 text-white' : 'bg-slate-100 text-slate-500',
                  ].join(' ')}
                >
                  {isAllowed ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
                  ) : (
                    <Minus className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
                  )}
                </span>
                <span className={isAllowed ? 'text-slate-900' : 'text-slate-600'}>
                  {permission.label}
                  <span className="sr-only">{isAllowed ? ': allowed' : ': not allowed'}</span>
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
