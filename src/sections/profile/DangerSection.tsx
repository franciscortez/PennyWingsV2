import { AppButton, ModalFrame } from '@/components/ui'
import { appModalPanel } from '@/sections/shared/appDesignStyles'
import { fieldInput, fieldLabel, fieldError } from '@/components/ui/fieldStyles'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, ShieldAlert } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'

import { useAuth } from '@/hooks/useAuth'
import { alerts } from '@/lib/alert'
import type { DeleteAccountFormValues } from '@/types'
import { deleteAccountFormSchema } from '@/validation/profileSchemas'

type DangerSectionProps = {
  googleReauthenticationComplete: boolean
  onGoogleReauthenticationHandled: () => void
}

export default function DangerSection({
  googleReauthenticationComplete,
  onGoogleReauthenticationHandled,
}: DangerSectionProps) {
  const { user, deleteAccount, reauthenticateWithGoogleForDeletion } = useAuth()
  const navigate = useNavigate()
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [reauthenticating, setReauthenticating] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const handledGoogleReauthentication = useRef(false)

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

  const onDeleteAccount = useCallback(async (values?: DeleteAccountFormValues) => {
    setDeletingAccount(true)

    try {
      const { error } = await deleteAccount(values?.password)

      if (error) {
        await alerts.error(error.message)
      } else {
        setShowDeleteModal(false)
        await alerts.success('Your account has been deleted.')
        navigate('/login')
      }
    } finally {
      setDeletingAccount(false)
    }
  }, [deleteAccount, navigate])

  const confirmGoogleDeletion = useCallback(async () => {
    const confirmed = await alerts.confirmDelete(
      'Account',
      'Delete your account permanently? All bank cards, wallets, transactions, budgets, goals, and reports will be deleted.',
    )

    if (confirmed) {
      await onDeleteAccount()
    }
  }, [onDeleteAccount])

  useEffect(() => {
    if (
      !googleReauthenticationComplete ||
      handledGoogleReauthentication.current
    ) {
      return
    }

    handledGoogleReauthentication.current = true
    onGoogleReauthenticationHandled()
    void confirmGoogleDeletion()
  }, [
    confirmGoogleDeletion,
    googleReauthenticationComplete,
    onGoogleReauthenticationHandled,
  ])

  const handleDeleteTrigger = async () => {
    if (isGoogleUser) {
      const confirmed = await alerts.confirmDelete(
        'Verify with Google',
        'Continue to Google to verify your identity before permanently deleting this account.',
      )

      if (confirmed) {
        setReauthenticating(true)
        const { error } = await reauthenticateWithGoogleForDeletion()

        if (error) {
          setReauthenticating(false)
          await alerts.error(error.message)
        }
      }
    } else {
      setShowDeleteModal(true)
    }
  }

  return (
    <>
      <article className="rounded-[2rem] border border-red-100 bg-red-50/20 p-6 dark:border-red-950/40 dark:bg-red-950/10 sm:p-8">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300">
            <ShieldAlert className="h-8 w-8" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 tracking-tighter">Delete account</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Permanently delete your profile and all associated data, including bank cards, digital wallets, and transaction histories. This action is irreversible.
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-red-100/60 pt-6 text-center sm:text-left dark:border-red-950/30">
          <AppButton
            type="button"
            variant="danger"
            onClick={handleDeleteTrigger}
            disabled={deletingAccount || reauthenticating}
            className="bg-red-700 text-white hover:bg-red-800 hover:text-white dark:bg-red-700 dark:text-white dark:hover:bg-red-800 dark:hover:text-white motion-reduce:transform-none motion-reduce:transition-none"
          >
            {reauthenticating ? 'Opening Google...' : 'Delete my account'}
          </AppButton>
        </div>
      </article>

      {showDeleteModal ? (
        <ModalFrame title="Verify password" titleId="delete-account-title" closeLabel="Close verify modal" onClose={() => setShowDeleteModal(false)} closeDisabled={deletingAccount} panelClassName={`${appModalPanel} max-w-md`} headerLeading={<AlertTriangle className="h-5 w-5 shrink-0 text-red-700 dark:text-red-300" aria-hidden="true" />} actions={
          <div className="flex flex-wrap justify-end gap-3">
            <AppButton type="button" variant="secondary" disabled={deletingAccount} onClick={() => setShowDeleteModal(false)}>Cancel</AppButton>
            <AppButton type="submit" form="delete-account-form" variant="danger" disabled={deletingAccount || !isPasswordEntered} className="bg-red-700 text-white hover:bg-red-800 hover:text-white dark:bg-red-700 dark:text-white dark:hover:bg-red-800 dark:hover:text-white">{deletingAccount ? 'Deleting...' : 'Delete account'}</AppButton>
          </div>
        }>
          <form id="delete-account-form" onSubmit={handleSubmitDelete((values) => onDeleteAccount(values))} className="space-y-6">
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">For security, please enter your password to confirm deleting your PennyWings account.</p>
            <div className="space-y-2">
              <label htmlFor="delete-account-password" className={fieldLabel}>Password</label>
              <input id="delete-account-password" autoComplete="current-password" type="password" placeholder="••••••••" {...registerDelete('password')} aria-invalid={!!deleteErrors.password} aria-describedby={deleteErrors.password ? 'delete-account-password-error' : undefined} className={fieldInput(!!deleteErrors.password)} />
              {deleteErrors.password ? <p id="delete-account-password-error" aria-live="polite" className={fieldError}>{deleteErrors.password.message}</p> : null}
            </div>
          </form>
        </ModalFrame>
      ) : null}
    </>
  )
}
