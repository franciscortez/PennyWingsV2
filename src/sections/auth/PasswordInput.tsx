import { Eye, EyeOff } from 'lucide-react'
import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
} from 'react'
import { Link } from 'react-router'

import { fieldError, fieldInput, fieldLabel } from '@/sections/auth/fieldStyles'
import { textLink } from '@/sections/shared'

type PasswordInputProps = {
  error?: string
  forgotPassword?: boolean
  id: string
  label: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'>

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    {
      error,
      forgotPassword = false,
      id,
      label,
      required = true,
      className,
      ...props
    },
    ref,
  ) {
    const [showPassword, setShowPassword] = useState(false)
    const errorId = `${id}-error`

    return (
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-4">
          <label htmlFor={id} className={fieldLabel}>
            {label}
          </label>
          {forgotPassword ? (
            <Link to="/forgot-password" className={`text-sm ${textLink}`}>
              Forgot password?
            </Link>
          ) : null}
        </div>
        <div className="relative">
          <input
            {...props}
            ref={ref}
            id={id}
            type={showPassword ? 'text' : 'password'}
            required={required}
            aria-describedby={error ? errorId : props['aria-describedby']}
            aria-invalid={error ? true : props['aria-invalid']}
            className={fieldInput(Boolean(error), `pr-14 ${className ?? ''}`)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-1.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-pink-50 hover:text-pink-900 focus-visible:outline-2 focus-visible:outline-pink-800"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <Eye className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            )}
          </button>
        </div>
        {error ? (
          <p id={errorId} className={fieldError}>
            {error}
          </p>
        ) : null}
      </div>
    )
  },
)
