import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'

import { useAuth } from '@/hooks/useAuth'
import { alerts } from '@/lib/alert'
import { AuthShell, TextInput } from '@/sections/auth'
import { forgotPasswordSchema } from '@/validation/authSchemas'
import { getZodErrorMessage } from '@/validation/zodError'

const forgotPasswordFeatures = [
  {
    title: 'Secure Process',
    description: 'Password reset links are encrypted and expire after one use.',
    icon: 'lock' as const,
  },
  {
    title: 'Quick Recovery',
    description: 'Receive your reset link instantly via email.',
    icon: 'zap' as const,
  },
  {
    title: 'Email Verification',
    description: "We'll verify your email before sending the reset link.",
    icon: 'check' as const,
  },
  {
    title: 'Easy Steps',
    description: 'Simple process to get you back into your account.',
    icon: 'check' as const,
  },
]

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
      title="Reset Password"
      subtitle="Enter your email and we'll send you a reset link"
      heroTitle="Forgot your password? No worries!"
      heroDescription="We'll send you a secure link to reset your password and get you back on track with your financial goals."
      features={forgotPasswordFeatures}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <TextInput
          id="forgot-email"
          label="Email Address"
          type="email"
          name="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-pink-600 to-pink-700 py-3.5 font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:from-pink-700 hover:to-pink-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-pink-600">
          Remember your password?{' '}
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
