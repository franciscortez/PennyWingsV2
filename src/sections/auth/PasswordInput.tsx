import { Eye, EyeOff } from 'lucide-react'
import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
} from 'react'
import { Link } from 'react-router'

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
      className = '',
      ...props
    },
    ref,
  ) {
    const [showPassword, setShowPassword] = useState(false)
    const errorId = `${id}-error`

    return (
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor={id} className="block text-sm font-bold text-pink-700">
            {label}
          </label>
          {forgotPassword ? (
            <Link
              to="/forgot-password"
              className="text-xs font-bold text-pink-600 transition hover:text-pink-700"
            >
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
            className={`w-full rounded-xl border-2 bg-white px-4 py-3 pr-12 text-sm text-pink-900 transition placeholder:text-pink-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-pink-500 ${error ? 'border-red-300' : 'border-pink-200'} ${className}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-pink-400 transition-colors hover:text-pink-600"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Eye className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
        {error ? (
          <p id={errorId} className="mt-2 text-xs font-bold text-red-500">
            {error}
          </p>
        ) : null}
      </div>
    )
  },
)
