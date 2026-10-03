import { fieldInput, fieldLabel, fieldError } from '@/components/ui/fieldStyles'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FcGoogle } from 'react-icons/fc'

import { AppButton } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { alerts } from '@/lib/alert'
import type { ChangePasswordFormValues } from '@/types'
import { changePasswordSchema } from '@/validation/profileSchemas'

export default function SecuritySection() {
  const { user, updatePassword } = useAuth()
  const [updatingPassword, setUpdatingPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const isGoogleUser =
    user?.app_metadata?.provider === 'google' ||
    user?.identities?.some((identity) => identity.provider === 'google')

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      confirm: '',
      password: '',
    },
  })

  const onChangePassword = async (values: ChangePasswordFormValues) => {
    setUpdatingPassword(true)
    const { error } = await updatePassword(values.password)
    setUpdatingPassword(false)

    if (error) {
      alerts.error(error.message)
    } else {
      alerts.success('Password changed successfully.')
      resetPasswordForm()
    }
  }

  if (isGoogleUser) {
    return (
      <article className="rounded-[2rem] border border-pink-100 bg-white shadow-wing dark:shadow-none p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] bg-pink-50 dark:bg-slate-800">
            <FcGoogle className="h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 tracking-tighter">OAuth Security</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Your account is protected using Google authentication. Passwords and sign-in credentials are managed entirely by Google.
            </p>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="rounded-[2rem] border border-pink-100 bg-white shadow-wing dark:shadow-none p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
      <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-6">
        <div className="flex items-center gap-3">
          <KeyRound className="h-5 w-5 text-pink-700 dark:text-pink-400" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 tracking-tighter">Change password</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="profile-password" className={fieldLabel}>
              New password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                id="profile-password"
                autoComplete="new-password"
              aria-invalid={!!passwordErrors.password}
              aria-describedby={passwordErrors.password ? 'profile-password-error' : undefined}
              {...registerPassword('password')}
                className={fieldInput(!!passwordErrors.password, 'pr-14 min-w-0')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-slate-600 hover:bg-pink-50 focus-visible:outline-2 focus-visible:outline-pink-800 dark:text-slate-300 dark:focus-visible:outline-pink-300"
                aria-label={showPassword ? "Hide new password" : "Show new password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
            {passwordErrors.password && (
              <p id="profile-password-error" aria-live="polite" className={fieldError}>{passwordErrors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="profile-password-confirm" className={fieldLabel}>
              Confirm new password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                id="profile-password-confirm"
                autoComplete="new-password"
              aria-invalid={!!passwordErrors.confirm}
              aria-describedby={passwordErrors.confirm ? 'profile-password-confirm-error' : undefined}
              {...registerPassword('confirm')}
                className={fieldInput(!!passwordErrors.confirm, 'pr-14 min-w-0')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-pink-700 transition dark:text-slate-400 dark:hover:text-pink-400"
                aria-label="Toggle password visibility"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
            {passwordErrors.confirm && (
              <p id="profile-password-confirm-error" aria-live="polite" className={fieldError}>{passwordErrors.confirm.message}</p>
            )}
          </div>
        </div>

        <AppButton type="submit" disabled={updatingPassword} className="w-full sm:w-auto">
          {updatingPassword ? 'Changing...' : 'Change password'}
        </AppButton>
      </form>
    </article>
  )
}
