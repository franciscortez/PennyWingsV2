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
      <article className="rounded-3xl border border-pink-100 bg-linear-to-br from-white to-pink-50/20 p-6 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/60 sm:p-8">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-500 dark:bg-blue-950/40 dark:text-blue-400">
            <FcGoogle className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-800 dark:text-slate-200">OAuth Security</h3>
            <p className="mt-1 text-sm font-medium leading-relaxed text-gray-500 dark:text-slate-400">
              Your account is protected using Google authentication. Passwords and sign-in credentials are managed entirely by Google.
            </p>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="rounded-3xl border border-pink-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
      <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-6">
        <div className="flex items-center gap-3">
          <KeyRound className="h-5 w-5 text-pink-500 dark:text-pink-400" />
          <h3 className="text-lg font-black text-gray-800 dark:text-slate-200">Change Password</h3>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...registerPassword('password')}
                className={`w-full rounded-2xl border-2 pl-4 pr-11 py-3 text-sm font-bold text-gray-800 outline-none transition-all dark:bg-slate-800 dark:text-slate-200 ${
                  passwordErrors.password
                    ? 'border-red-300 focus:border-red-500 dark:border-red-900/50'
                    : 'border-pink-100 focus:border-pink-500 dark:border-slate-700 dark:focus:border-pink-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-500 transition dark:text-slate-500 dark:hover:text-pink-400"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {passwordErrors.password && (
              <p className="text-xs font-bold text-red-500">{passwordErrors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...registerPassword('confirm')}
                className={`w-full rounded-2xl border-2 pl-4 pr-11 py-3 text-sm font-bold text-gray-800 outline-none transition-all dark:bg-slate-800 dark:text-slate-200 ${
                  passwordErrors.confirm
                    ? 'border-red-300 focus:border-red-500 dark:border-red-900/50'
                    : 'border-pink-100 focus:border-pink-500 dark:border-slate-700 dark:focus:border-pink-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-500 transition dark:text-slate-500 dark:hover:text-pink-400"
                aria-label="Toggle password visibility"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {passwordErrors.confirm && (
              <p className="text-xs font-bold text-red-500">{passwordErrors.confirm.message}</p>
            )}
          </div>
        </div>

        <AppButton type="submit" disabled={updatingPassword} className="w-full sm:w-auto">
          {updatingPassword ? 'Changing Password...' : 'Change Password'}
        </AppButton>
      </form>
    </article>
  )
}
