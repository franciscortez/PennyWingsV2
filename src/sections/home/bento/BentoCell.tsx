import type { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

import { Reveal } from '@/sections/home/Reveal'

type BentoTone = 'white' | 'tint' | 'deep' | 'dots'

const toneClasses: Record<BentoTone, { cell: string; body: string }> = {
  white: {
    cell: 'border border-pink-100 bg-white text-slate-950',
    body: 'text-slate-600',
  },
  tint: {
    cell: 'bg-pink-100 text-slate-950',
    body: 'text-slate-700',
  },
  deep: {
    cell: 'bg-pink-900 text-white',
    body: 'text-pink-100',
  },
  dots: {
    cell: 'border border-pink-100 bg-paper bg-[radial-gradient(var(--color-pink-200)_1px,transparent_1px)] [background-size:18px_18px] text-slate-950',
    body: 'text-slate-600',
  },
}

type BentoCellProps = {
  title: string
  body: string
  tone?: BentoTone
  className?: string
  delay?: number
  children: ReactNode
}

export function BentoCell({
  title,
  body,
  tone = 'white',
  className,
  delay,
  children,
}: BentoCellProps) {
  const classes = toneClasses[tone]

  return (
    <Reveal delay={delay} className={twMerge('flex', className)}>
      <article
        className={twMerge(
          'flex w-full min-w-0 flex-col gap-8 rounded-[2rem] p-6 sm:p-8',
          classes.cell,
        )}
      >
        <div>
          <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
          <p className={twMerge('mt-2 max-w-[44ch] text-[15px] leading-relaxed', classes.body)}>
            {body}
          </p>
        </div>
        <div className="mt-auto">{children}</div>
      </article>
    </Reveal>
  )
}
