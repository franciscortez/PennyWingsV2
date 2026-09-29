import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { twMerge } from 'tailwind-merge'

import { useAuth } from '@/hooks/useAuth'
import { alerts } from '@/lib/alert'
import { AuthShell, PasswordInput } from '@/sections/auth'
import { authPanels } from '@/sections/auth/authContent'
import { actionDisabled, primaryAction, textLink } from '@/sections/shared'
import { resetPasswordSchema } from '@/validation/authSchemas'
import { getZodErrorMessage } from '@/validation/zodError'

export default function ResetPassword() {
  const { updatePassword } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const result = resetPasswordSchema.safeParse({
      password: formData.get('password'),
      confirm: formData.get('confirm'),
    })

    if (!result.success) {
      alerts.warning(getZodErrorMessage(result.error, 'Invalid password.'))
      return
    }

    setLoading(true)
    const { error: updateError } = await updatePassword(result.data.password)

    if (updateError) {
      alerts.error(updateError.message)
    } else {
      alerts.success('Your password has been updated successfully!')
      event.currentTarget.reset()
    }

    setLoading(false)
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a password with at least 6 characters."
      panel={authPanels.recovery}
      backTo="/login"
      backLabel="Back to sign in"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <PasswordInput
          id="reset-password"
          label="New password"
          name="password"
          placeholder="Min. 6 characters"
          autoComplete="new-password"
        />
        <PasswordInput
          id="reset-confirm-password"
          label="Confirm new password"
          name="confirm"
          placeholder="Repeat your password"
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={loading}
          className={twMerge(primaryAction, actionDisabled, 'w-full')}
        >
          {loading ? 'Updating...' : 'Update password'}
        </button>
      </form>

      <p className="mt-8 text-sm text-slate-600">
        Password already updated?{' '}
        <Link to="/login" className={textLink}>
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
