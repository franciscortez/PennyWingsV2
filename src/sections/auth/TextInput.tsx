import type { InputHTMLAttributes } from 'react'

type TextInputProps = {
  id: string
  label: string
} & InputHTMLAttributes<HTMLInputElement>

export function TextInput({ id, label, className = '', ...props }: TextInputProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-bold text-pink-700">
        {label}
      </label>
      <input
        id={id}
        className={`w-full rounded-xl border-2 border-pink-200 bg-white px-4 py-3 text-sm text-pink-900 transition placeholder:text-pink-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-pink-500 ${className}`}
        {...props}
      />
    </div>
  )
}
