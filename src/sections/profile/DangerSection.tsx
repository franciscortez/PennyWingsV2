import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'

import { useAuth } from '@/hooks/useAuth'
import { alerts } from '@/lib/alert'
import type { DeleteAccountFormValues } from '@/types'
import { deleteAccountFormSchema } from '@/validation/profileSchemas'

export default function DangerSection() {
  const { user, deleteAccount } = useAuth()
  const navigate = useNavigate()
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const isGoogleUser =
    user?.app_metadata?.provider === 'google' ||
    user?.identities?.some((identity) => identity.provider === 'google')

  const {
    register: registerDelete,
    handleSubmit: handleSubmitDelete,
    watch: watchDelete,
    formState: { errors: deleteErrors },
    reset: resetDeleteForm,
  } = useForm<DeleteAccountFormValues>({
    resolver: zodResolver(deleteAccountFormSchema),
    defaultValues: {
      password: '',
    },
  })

  // Reset delete account form when modal is closed
  useEffect(() => {
    if (!showDeleteModal) {
      resetDeleteForm()
    }
  }, [showDeleteModal, resetDeleteForm])

  // eslint-disable-next-line react-hooks/incompatible-library
  const isPasswordEntered = !!watchDelete('password')

  const onDeleteAccount = async (values?: DeleteAccountFormValues) => {
    setDeletingAccount(true)
    const { error } = await deleteAccount(values?.password)
    setDeletingAccount(false)

    if (error) {
      alerts.error(error.message)
    } else {
      setShowDeleteModal(false)
      alerts.success('Your account has been deleted.')
      navigate('/')
    }
  }

  const handleDeleteTrigger = async () => {
    if (isGoogleUser) {
      const confirmed = await alerts.confirmDelete(
        'Account',
        'Delete your account permanently? All bank cards, wallets, and transactions will be deleted.',
      )
      if (confirmed) {
        await onDeleteAccount()
      }
    } else {
      setShowDeleteModal(true)
    }
  }

  return (
    <>
      <article className="rounded-3xl border border-red-100 bg-red-50/20 p-6 dark:border-red-950/40 dark:bg-red-950/10 sm:p-8">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-500">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-800 dark:text-slate-200">Delete Account</h3>
            <p className="mt-1 text-sm font-medium leading-relaxed text-gray-500 dark:text-slate-400">
              Permanently delete your profile and all associated data, including bank cards, digital wallets, and transaction histories. This action is irreversible.
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-red-100/60 pt-6 text-center sm:text-left dark:border-red-950/30">
          <button
            type="button"
            onClick={handleDeleteTrigger}
            className="rounded-2xl bg-red-600 px-6 py-3 text-sm font-black text-white hover:bg-red-700 active:scale-95 transition-all"
          >
            Delete My Account
          </button>
        </div>
      </article>

      {/* Delete Password Verification Modal */}
      {showDeleteModal ? (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setShowDeleteModal(false)}
            className="absolute inset-0 animate-fade-in bg-black/40"
            aria-label="Close verify modal"
          />
          <section className="relative z-10 w-full max-w-md overflow-hidden rounded-[2.5rem] border border-red-100 bg-white animate-fade-in dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3 border-b border-red-50 p-6 pb-4 dark:border-slate-800/80">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-black text-gray-800 dark:text-slate-100">Verify Password</h2>
            </div>

            <form
              onSubmit={handleSubmitDelete((values) => onDeleteAccount(values))}
              className="space-y-6 p-6"
            >
              <p className="text-xs font-semibold leading-relaxed text-gray-500 dark:text-slate-400">
                For security, please enter your password to confirm deleting your PennyWings account.
              </p>

              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                  Password
                </label>
                <input
                  autoFocus
                  type="password"
                  placeholder="••••••••"
                  {...registerDelete('password')}
                  className={`w-full rounded-2xl border-2 px-4 py-3 text-sm font-bold text-gray-800 outline-none transition-all dark:bg-slate-800 dark:text-slate-200 ${
                    deleteErrors.password
                      ? 'border-red-300 focus:border-red-500 dark:border-red-900/50'
                      : 'border-pink-100 focus:border-pink-500 dark:border-slate-700 dark:focus:border-pink-500'
                  }`}
                />
                {deleteErrors.password && (
                  <p className="text-xs font-bold text-red-500">{deleteErrors.password.message}</p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 rounded-2xl border border-gray-200 py-3.5 text-sm font-black text-gray-500 hover:bg-gray-50 active:scale-95 transition-all dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deletingAccount || !isPasswordEntered}
                  className="flex-1 rounded-2xl bg-red-600 py-3.5 text-sm font-black text-white hover:bg-red-700 active:scale-95 transition-all disabled:opacity-40"
                >
                  {deletingAccount ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  )
}
