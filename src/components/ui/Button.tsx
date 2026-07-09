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

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-pink-600 text-white hover:bg-pink-700',
  secondary:
    'border border-pink-100 bg-white text-pink-700 hover:border-pink-200 hover:bg-pink-50',
  ghost: 'text-gray-400 hover:bg-pink-50 hover:text-pink-600',
  danger: 'text-rose-600 hover:bg-rose-50 hover:text-rose-700',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-10 px-4 py-2 text-xs',
  md: 'min-h-12 px-5 py-3 text-sm',
  icon: 'h-10 w-10 p-0',
}

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-2xl font-black transition duration-200 active:scale-95 disabled:pointer-events-none disabled:opacity-60'

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
