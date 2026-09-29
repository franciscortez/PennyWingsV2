import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { twMerge } from 'tailwind-merge'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'icon'

type ButtonBaseProps = {
  children: ReactNode
  className?: string
  size?: ButtonSize
  variant?: ButtonVariant
}

type AppButtonProps = ButtonBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    to?: never
  }

type AppButtonLinkProps = ButtonBaseProps &
  LinkProps & {
    to: LinkProps['to']
  }

// Light variants mirror `primaryAction` / `secondaryAction` in
// `src/sections/shared/brandActions.ts`. White on pink-700 is about 4.7:1,
// slate-600 ghost text on white about 7.6:1, red-700 danger about 6.5:1.
const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-pink-700 text-white shadow-wing hover:bg-pink-800 dark:shadow-none',
  secondary:
    'border border-pink-200 bg-white text-pink-900 hover:border-pink-300 hover:bg-pink-50 dark:border-slate-700 dark:bg-slate-900 dark:text-pink-200 dark:hover:border-slate-600 dark:hover:bg-slate-800',
  ghost:
    'text-slate-600 hover:bg-pink-50 hover:text-pink-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-pink-200',
  danger:
    'text-red-700 hover:bg-red-50 hover:text-red-800 dark:text-red-300 dark:hover:bg-red-950/40 dark:hover:text-red-200',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-10 px-4 py-2 text-sm',
  md: 'min-h-12 px-6 py-3 text-sm',
  icon: 'h-10 w-10 p-0',
}

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-800 dark:focus-visible:outline-pink-300 disabled:pointer-events-none disabled:opacity-60'

export function AppButton(props: AppButtonProps | AppButtonLinkProps) {
  const { children, className, size = 'md', variant = 'primary' } = props
  const classes = twMerge(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className,
  )

  if (props.to !== undefined) {
    const linkProps = { ...props } as Record<string, unknown>
    delete linkProps.children
    delete linkProps.className
    delete linkProps.size
    delete linkProps.variant

    return (
      <Link {...(linkProps as unknown as LinkProps)} className={classes}>
        {children}
      </Link>
    )
  }

  const buttonProps = { ...props } as Record<string, unknown>
  delete buttonProps.children
  delete buttonProps.className
  delete buttonProps.size
  delete buttonProps.variant

  return (
    <button
      {...(buttonProps as ButtonHTMLAttributes<HTMLButtonElement>)}
      className={classes}
    >
      {children}
    </button>
  )
}
