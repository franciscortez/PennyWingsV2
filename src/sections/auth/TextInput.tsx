import { forwardRef, type InputHTMLAttributes } from 'react'

import { fieldError, fieldInput, fieldLabel } from '@/components/ui/fieldStyles'

type TextInputProps = {
  error?: string
  id: string
  label: string
} & InputHTMLAttributes<HTMLInputElement>

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput({ error, id, label, className, ...props }, ref) {
    const errorId = `${id}-error`

    return (
      <div className="grid gap-2">
        <label htmlFor={id} className={fieldLabel}>
          {label}
        </label>
        <input
          {...props}
          ref={ref}
          id={id}
          aria-describedby={error ? errorId : props['aria-describedby']}
          aria-invalid={error ? true : props['aria-invalid']}
          className={fieldInput(Boolean(error), className)}
        />
        {error ? (
          <p id={errorId} className={fieldError}>
            {error}
          </p>
        ) : null}
      </div>
    )
  },
)
