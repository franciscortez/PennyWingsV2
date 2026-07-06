import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'

import { useAuth } from '@/hooks/useAuth'
import { alerts } from '@/lib/alert'
import {
  AuthDivider,
  AuthShell,
  GoogleAuthButton,
  PasswordInput,
  TextInput,
} from '@/sections/auth'
import { registerSchema } from '@/validation/authSchemas'
import { getZodErrorMessage } from '@/validation/zodError'

const signupFeatures = [
  {
    title: 'Multi-Account Support',
    description: 'Connect cards & e-wallets seamlessly in one unified dashboard.',
    icon: 'card' as const,
  },
  {
    title: 'Beautiful Interface',
    description: 'Intuitive design that makes financial management a pleasure.',
    icon: 'check' as const,
  },
  {
    title: 'Goal Tracking',
    description: 'Set savings goals and watch your progress grow over time.',
    icon: 'check' as const,
  },
  {
    title: 'Bank-Level Security',
    description: 'Your financial data is encrypted and protected at all times.',
    icon: 'shield' as const,
  },
]

export default function Register() {
  const { loading: authLoading, signInWithGoogle, signUp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const result = registerSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
      confirm: formData.get('confirm'),
      acceptedTerms: formData.get('acceptedTerms') === 'on',
    })

    if (!result.success) {
      alerts.warning(getZodErrorMessage(result.error, 'Invalid account details.'))
      return
    }

    setLoading(true)
    const { error: signUpError } = await signUp(
      result.data.email,
      result.data.password,
    )

    if (signUpError) {
      alerts.error(signUpError.message)
    } else {
      alerts.success('Account created! Please check your email to confirm your account.')
      event.currentTarget.reset()
    }

    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)

    const { error: googleError } = await signInWithGoogle()

    if (googleError) {
      alerts.error(googleError.message)
      setGoogleLoading(false)
    }
  }

  return (
    <AuthShell
      title="Create Account"
      subtitle="Get started with your free account"
      heroTitle="Start your journey to financial freedom"
      heroDescription="Join thousands of users who are taking control of their finances. Track expenses, set budgets, and achieve your goals."
      features={signupFeatures}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <TextInput
          id="register-email"
          label="Email Address"
          type="email"
          name="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        <PasswordInput
          id="register-password"
          label="Password"
          name="password"
          placeholder="Min. 6 characters"
          autoComplete="new-password"
        />
        <PasswordInput
          id="register-confirm-password"
          label="Confirm Password"
          name="confirm"
          placeholder="Password"
          autoComplete="new-password"
        />

        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="terms"
            name="acceptedTerms"
            className="mt-1.5 h-4 w-4 cursor-pointer rounded border-2 border-pink-200 text-pink-600 accent-pink-600 transition focus:ring-pink-500"
          />
          <label
            htmlFor="terms"
            className="cursor-pointer text-sm leading-relaxed text-pink-600"
          >
            I agree to the{' '}
            <Link
              to="/terms-and-conditions"
              className="font-bold text-pink-700 transition hover:text-pink-800"
            >
              Terms and Agreement
            </Link>{' '}
            and understand how my data is handled.
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading || authLoading}
          className="w-full rounded-xl bg-gradient-to-r from-pink-600 to-pink-700 py-3.5 font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:from-pink-700 hover:to-pink-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <AuthDivider />
      <GoogleAuthButton
        disabled={loading || googleLoading || authLoading}
        onClick={handleGoogleLogin}
      />

      <div className="mt-8 text-center">
        <p className="text-sm text-pink-600">
          Already have an account?{' '}
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
