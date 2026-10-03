import { Check } from 'lucide-react'

import { fieldLabel } from '@/components/ui/fieldStyles'
import { accountColors } from '@/sections/accounts/accountOptions'
import type { AccountColor } from '@/types'

export function AccountColorChoices({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (color: AccountColor) => void
}) {
  return (
    <fieldset className="min-w-0 space-y-3">
      <legend className={fieldLabel}>{label}</legend>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(2.75rem,1fr))] gap-3" data-account-colors>
        {accountColors.map(color => (
          <button
            key={color.value}
            type="button"
            aria-label={color.label}
            aria-pressed={value.toLowerCase() === color.value.toLowerCase()}
            onClick={() => onChange(color)}
            className="flex h-11 min-w-11 items-center justify-center rounded-full border border-slate-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-800 dark:focus-visible:outline-pink-300"
            style={{ backgroundColor: color.value }}
          >
            {value.toLowerCase() === color.value.toLowerCase() ? (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-950" aria-hidden="true">
                <Check className="h-4 w-4" />
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
