import type { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

import { textMuted } from '@/components/ui/surfaces'

type PageHeaderProps = {
  title: string
  description?: ReactNode
  actions?: ReactNode
  className?: string
}

// The single page heading for authenticated pages: one h1, an optional
// description and an actions slot. Deliberately no eyebrow label.
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header
      className={twMerge(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-balance text-3xl font-semibold leading-[1.1] tracking-tighter text-slate-950 sm:text-4xl dark:text-white">
          {title}
        </h1>
        {description ? (
          <p className={twMerge('mt-2 max-w-[65ch] text-base leading-relaxed', textMuted)}>
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>
      ) : null}
    </header>
  )
}
