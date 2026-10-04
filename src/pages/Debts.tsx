import { useState } from 'react'

import Layout from '@/components/Layout'
import { useAccountsData } from '@/hooks/useAccountsData'
import { useAuth } from '@/hooks/useAuth'
import { useDebtsData } from '@/hooks/useDebtsData'
import { useErrorAlert } from '@/hooks/useErrorAlert'
import { alerts } from '@/lib/alert'
import {
  AddChargeModal,
  AddDebtModal,
  DebtPaymentHistoryModal,
  DebtsHeader,
  DebtsListSection,
  DebtsSkeleton,
  DebtsSummarySection,
  EditDebtModal,
  PayDebtModal,
} from '@/sections/debts'
import type {
  Debt,
  DebtChargeValues,
  DebtCreateValues,
  DebtPayMutationValues,
  DebtUpdateValues,
} from '@/types'

export default function Debts() {
  const { user } = useAuth()
  const {
    addCharge,
    addDebt,
    archiveDebt,
    charges,
    debts,
    dueSoonCount,
    editDebt,
    error,
    loading,
    overdueCount,
    payDebt,
    payments,
    reversePayment,
    saving,
    totalOutstanding,
    totalSettled,
    unarchiveDebt,
    voidCharge,
  } = useDebtsData(user?.id)

  const { accounts } = useAccountsData(user?.id)
  useErrorAlert(error)

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null)
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null)
  const [historyDebt, setHistoryDebt] = useState<Debt | null>(null)
  const [chargingDebt, setChargingDebt] = useState<Debt | null>(null)

  const handleAddDebt = async (values: DebtCreateValues) => {
    const success = await addDebt(values)
    if (success) {
      alerts.success('Debt record created successfully.')
    }
    return success
  }

  const handleEditDebt = async (id: string, values: DebtUpdateValues) => {
    const success = await editDebt(id, values)
    if (success) {
      alerts.success('Debt details updated.')
    }
    return success
  }

  const handleArchive = async (debt: Debt) => {
    const confirmed = await alerts.confirm({
      title: 'Archive debt?',
      text: `Are you sure you want to archive "${debt.providerName}"? It will be moved to the Archived tab.`,
      confirmButtonText: 'Yes, Archive',
    })

    if (confirmed) {
      const success = await archiveDebt(debt.id)
      if (success) {
        alerts.success('Debt archived.')
      }
    }
  }

  const handleUnarchive = async (debt: Debt) => {
    const success = await unarchiveDebt(debt.id)
    if (success) {
      alerts.success('Debt restored to active list.')
    }
  }

  const handlePay = async (values: DebtPayMutationValues) => {
    const success = await payDebt(values)
    if (success) {
      alerts.success('Repayment completed successfully.')
    }
    return success
  }

  const handleAddCharge = async (values: DebtChargeValues) => {
    const success = await addCharge(values)
    if (success) {
      alerts.success('Purchase added to your balance.')
    }
    return success
  }

  const handleVoidCharge = async (chargeId: string, reason?: string) => {
    const success = await voidCharge(chargeId, reason)
    if (success) {
      alerts.success('Purchase voided and balance updated.')
    }
    return success
  }

  const handleReverse = async (paymentId: string, reason?: string) => {
    const success = await reversePayment(paymentId, reason)
    if (success) {
      alerts.success('Repayment reversed and balance restored.')
    }
    return success
  }

  return (
    <Layout>
      <div className="space-y-8">
        <DebtsHeader onAddDebt={() => setAddModalOpen(true)} />

        {loading ? (
          <DebtsSkeleton />
        ) : (
          <>
            <DebtsSummarySection
              dueSoonCount={dueSoonCount}
              overdueCount={overdueCount}
              totalOutstanding={totalOutstanding}
              totalSettled={totalSettled}
            />

            <DebtsListSection
              charges={charges}
              debts={debts}
              onAddDebt={() => setAddModalOpen(true)}
              onAddPurchase={(debt) => setChargingDebt(debt)}
              onArchive={handleArchive}
              onEdit={(debt) => setEditingDebt(debt)}
              onHistory={(debt) => setHistoryDebt(debt)}
              onPay={(debt) => setPayingDebt(debt)}
              onUnarchive={handleUnarchive}
            />
          </>
        )}

        {/* Modals */}
        {addModalOpen && (
          <AddDebtModal
            existingDebts={debts}
            onAddPurchaseInstead={(debt) => {
              setAddModalOpen(false)
              setChargingDebt(debt)
            }}
            onClose={() => setAddModalOpen(false)}
            onSubmit={handleAddDebt}
            saving={saving}
          />
        )}

        {chargingDebt && (
          <AddChargeModal
            debt={chargingDebt}
            onClose={() => setChargingDebt(null)}
            onSubmit={handleAddCharge}
            saving={saving}
          />
        )}

        {editingDebt && (
          <EditDebtModal
            debt={editingDebt}
            onClose={() => setEditingDebt(null)}
            onSubmit={handleEditDebt}
            saving={saving}
          />
        )}

        {payingDebt && (
          <PayDebtModal
            accounts={accounts}
            debt={payingDebt}
            onClose={() => setPayingDebt(null)}
            onSubmit={handlePay}
            saving={saving}
          />
        )}

        {historyDebt && (
          <DebtPaymentHistoryModal
            charges={charges}
            debt={historyDebt}
            payments={payments}
            onClose={() => setHistoryDebt(null)}
            onReverse={handleReverse}
            onVoidCharge={handleVoidCharge}
            saving={saving}
          />
        )}
      </div>
    </Layout>
  )
}
