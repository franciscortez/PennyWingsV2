import { twMerge } from 'tailwind-merge'

import { PennyWingsMark } from '@/sections/shared'

type AssistantMarkProps = {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: {
    container: 'h-8 w-8 rounded-lg',
    mark: 'h-5 w-5',
  },
  md: {
    container: 'h-10 w-10 rounded-xl',
    mark: 'h-6 w-6',
  },
  lg: {
    container: 'h-14 w-14 rounded-2xl',
    mark: 'h-8 w-8',
  },
} as const

export function AssistantMark({
  className,
  size = 'md',
}: AssistantMarkProps) {
  const styles = sizes[size]

  return (
    <span
      className={twMerge(
        'relative inline-flex shrink-0 items-center justify-center bg-pink-600 text-white shadow-sm shadow-pink-200 dark:shadow-none',
        styles.container,
        className,
      )}
      aria-hidden="true"
    >
      <PennyWingsMark className={styles.mark} />
    </span>
  )
}
