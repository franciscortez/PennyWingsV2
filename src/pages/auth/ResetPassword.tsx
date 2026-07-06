import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'

import { useAuth } from '@/hooks/useAuth'
import { alerts } from '@/lib/alert'
import { AuthShell, PasswordInput } from '@/sections/auth'
import { resetPasswordSchema } from '@/validation/authSchemas'
import { getZodErrorMessage } from '@/validation/zodError'

const resetPasswordFeatures = [
  {
    title: 'Strong Encryption',
    description:
      'All passwords are hashed and salted using industry-standard protocols.',
    icon: 'lock' as const,
  },
  {
    title: 'Enhanced Security',
    description: 'Automatic log out from other devices after password change.',
    icon: 'shield' as const,
  },
  {
    title: 'Instant Sync',
    description: 'Your new password works across all your devices immediately.',
    icon: 'zap' as const,
  },
  {
    title: 'Quick Updates',
    description: 'Your new password is encrypted instantly.',
    icon: 'check' as const,
  },
]

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
      title="Set New Password"
      subtitle="Create a secure password for your account"
      heroTitle="Create your new secure password"
      heroDescription="We take your security seriously. Choose a strong password to protect your financial data and continue your journey."
      features={resetPasswordFeatures}
      backTo="/login"
      backLabel="Back to Login"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <PasswordInput
          id="reset-password"
          label="New Password"
          name="password"
          placeholder="Min. 6 characters"
          autoComplete="new-password"
        />
        <PasswordInput
          id="reset-confirm-password"
          label="Confirm New Password"
          name="confirm"
          placeholder="Password"
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-pink-600 to-pink-700 py-3.5 font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:from-pink-700 hover:to-pink-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-pink-600">
          Password already updated?{' '}
          <Link
            to="/login"
            className="font-bold text-pink-700 transition hover:text-pink-800"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
