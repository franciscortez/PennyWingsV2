import { Link } from 'react-router'

import {
  AuthDivider,
  AuthShell,
  GoogleAuthButton,
  PasswordInput,
  TextInput,
} from '@/sections/auth'

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
  return (
    <AuthShell
      title="Sign In"
      subtitle="Enter your credentials to access your account"
      heroTitle="Welcome back to your financial journey"
      heroDescription="Continue tracking your expenses, managing your budgets, and achieving your financial goals with ease."
      features={loginFeatures}
    >
      <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
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
          className="w-full rounded-xl bg-gradient-to-r from-pink-600 to-pink-700 py-3.5 font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:from-pink-700 hover:to-pink-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none"
        >
          Sign In
        </button>
      </form>

      <AuthDivider />
      <GoogleAuthButton />

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
