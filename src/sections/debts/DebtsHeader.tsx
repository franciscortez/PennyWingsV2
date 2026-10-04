import { Plus } from 'lucide-react'

import { AppButton } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'

type DebtsHeaderProps = {
  onAddDebt: () => void
}

export function DebtsHeader({ onAddDebt }: DebtsHeaderProps) {
  return (
    <PageHeader
      title="Debts"
      description="Track liabilities, credit cards, BNPL balances, and account-linked repayments."
      actions={
        <AppButton
          variant="primary"
          onClick={onAddDebt}
          className="flex items-center gap-2"
        >
          <Plus size={18} aria-hidden="true" />
          <span>Add Debt</span>
        </AppButton>
      }
    />
  )
}
