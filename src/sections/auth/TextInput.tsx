import { forwardRef, type InputHTMLAttributes } from 'react'

type TextInputProps = {
  error?: string
  id: string
  label: string
} & InputHTMLAttributes<HTMLInputElement>

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput({ error, id, label, className = '', ...props }, ref) {
    const errorId = `${id}-error`

    return (
      <div>
        <label htmlFor={id} className="mb-2 block text-sm font-bold text-pink-700">
          {label}
        </label>
        <input
          {...props}
          ref={ref}
          id={id}
          aria-describedby={error ? errorId : props['aria-describedby']}
          aria-invalid={error ? true : props['aria-invalid']}
          className={`w-full rounded-xl border-2 bg-white px-4 py-3 text-sm text-pink-900 transition placeholder:text-pink-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-pink-500 ${error ? 'border-red-300' : 'border-pink-200'} ${className}`}
        />
        {error ? (
          <p id={errorId} className="mt-2 text-xs font-bold text-red-500">
            {error}
          </p>
        ) : null}
      </div>
    )
  },
)
