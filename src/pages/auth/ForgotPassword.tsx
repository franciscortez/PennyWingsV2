import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { twMerge } from 'tailwind-merge'

import { useAuth } from '@/hooks/useAuth'
import { alerts } from '@/lib/alert'
import { AuthShell, TextInput } from '@/sections/auth'
import { authPanels } from '@/sections/auth/authContent'
import { actionDisabled, primaryAction, textLink } from '@/sections/shared'
import { forgotPasswordSchema } from '@/validation/authSchemas'
import { getZodErrorMessage } from '@/validation/zodError'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const result = forgotPasswordSchema.safeParse({
      email: formData.get('email'),
    })

    if (!result.success) {
      alerts.warning(getZodErrorMessage(result.error, 'Invalid email address.'))
      return
    }

    setLoading(true)
    const { error: resetError } = await resetPassword(result.data.email)

    if (resetError) {
      alerts.error(resetError.message)
    } else {
      alerts.success('Check your email for password reset instructions.')
      event.currentTarget.reset()
    }

    setLoading(false)
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email on your account and we'll send you a reset link."
      panel={authPanels.recovery}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <TextInput
          id="forgot-email"
          label="Email address"
          type="email"
          name="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className={twMerge(primaryAction, actionDisabled, 'w-full')}
        >
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      <p className="mt-8 text-sm text-slate-600">
        Remember your password?{' '}
        <Link to="/login" className={textLink}>
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
