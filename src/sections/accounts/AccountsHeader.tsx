import { Plus } from 'lucide-react'

import { AppButton } from '@/components/ui'

type AccountsHeaderProps = {
  onCreate: () => void
}

export function AccountsHeader({ onCreate }: AccountsHeaderProps) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-pink-500">
          Accounts
        </p>
        <h1 className="text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
          Cards & Wallets
        </h1>
        <p className="mt-2 max-w-2xl text-sm font-medium italic text-gray-500 sm:text-base">
          Keep every balance visible before your next transaction.
        </p>
      </div>
      <AppButton type="button" onClick={onCreate} className="self-start md:self-auto">
        <Plus className="h-5 w-5" aria-hidden="true" />
        Add Account
      </AppButton>
    </header>
  )
}
