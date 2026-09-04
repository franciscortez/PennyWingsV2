import { twMerge } from 'tailwind-merge'

import { PennyWingsMark } from '@/sections/shared'

type AssistantMarkProps = {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: {
    container: 'h-8 w-11 rounded-lg',
    mark: 'h-7 w-10',
  },
  md: {
    container: 'h-10 w-14 rounded-xl',
    mark: 'h-9 w-13',
  },
  lg: {
    container: 'h-14 w-20 rounded-2xl',
    mark: 'h-13 w-19',
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
