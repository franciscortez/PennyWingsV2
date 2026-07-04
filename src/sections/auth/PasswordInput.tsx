import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'

type PasswordInputProps = {
  id: string
  label: string
  name: string
  placeholder: string
  autoComplete: string
  forgotPassword?: boolean
}

export function PasswordInput({
  id,
  label,
  name,
  placeholder,
  autoComplete,
  forgotPassword = false,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)

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
          id={id}
          type={showPassword ? 'text' : 'password'}
          name={name}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-xl border-2 border-pink-200 bg-white px-4 py-3 pr-12 text-sm text-pink-900 transition placeholder:text-pink-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-pink-500"
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
    </div>
  )
}
