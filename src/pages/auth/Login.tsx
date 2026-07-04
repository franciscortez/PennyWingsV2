import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'

import { useAuth } from '@/hooks/useAuth'
import {
  AuthDivider,
  AuthShell,
  GoogleAuthButton,
  PasswordInput,
  TextInput,
} from '@/sections/auth'
import { loginSchema } from '@/validation/authSchemas'
import { getZodErrorMessage } from '@/validation/zodError'

const loginFeatures = [
  {
    title: 'Real-time Tracking',
    description:
      'Monitor your expenses and income as they happen across all your accounts.',
    icon: 'zap' as const,
  },
  {
    title: 'Smart Budgets',
    description: 'Set intelligent budget limits and get alerts before you overspend.',
    icon: 'check' as const,
  },
  {
    title: 'Visual Analytics',
    description: 'Beautiful charts and insights to understand your spending patterns.',
    icon: 'chart' as const,
  },
  {
    title: 'Secure & Private',
    description: 'Bank-level encryption keeps your financial data safe and private.',
    icon: 'lock' as const,
  },
]

export default function Login() {
  const { loading: authLoading, signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const formData = new FormData(event.currentTarget)
    const result = loginSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
    })

    if (!result.success) {
      setError(getZodErrorMessage(result.error, 'Invalid sign in details.'))
      return
    }

    setLoading(true)
    const { error: signInError } = await signIn(
      result.data.email,
      result.data.password,
    )

    if (signInError) {
      setError(signInError.message)
    } else {
      navigate('/dashboard')
    }

    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setError('')
    setGoogleLoading(true)

    const { error: googleError } = await signInWithGoogle()

    if (googleError) {
      setError(googleError.message)
      setGoogleLoading(false)
    }
  }

  return (
    <AuthShell
      title="Sign In"
      subtitle="Enter your credentials to access your account"
      heroTitle="Welcome back to your financial journey"
      heroDescription="Continue tracking your expenses, managing your budgets, and achieving your financial goals with ease."
      features={loginFeatures}
    >
      {error ? (
        <div className="mb-6 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <TextInput
          id="login-email"
          label="Email Address"
          type="email"
          name="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        <PasswordInput
          id="login-password"
          label="Password"
          name="password"
          placeholder="Password"
          autoComplete="current-password"
          forgotPassword
        />

        <button
          type="submit"
          disabled={loading || googleLoading || authLoading}
          className="w-full rounded-xl bg-gradient-to-r from-pink-600 to-pink-700 py-3.5 font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:from-pink-700 hover:to-pink-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <AuthDivider />
      <GoogleAuthButton
        disabled={loading || googleLoading || authLoading}
        onClick={handleGoogleLogin}
      />

      <div className="mt-8 text-center">
        <p className="text-sm text-pink-600">
          Don&apos;t have an account?{' '}
          <Link
            to="/signup"
            className="font-bold text-pink-700 transition hover:text-pink-800"
          >
            Create account
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
