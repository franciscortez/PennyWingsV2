import { Link } from 'react-router'

import {
  AuthDivider,
  AuthShell,
  GoogleAuthButton,
  PasswordInput,
  TextInput,
} from '@/sections/auth'

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
  return (
    <AuthShell
      title="Create Account"
      subtitle="Get started with your free account"
      heroTitle="Start your journey to financial freedom"
      heroDescription="Join thousands of users who are taking control of their finances. Track expenses, set budgets, and achieve your goals."
      features={signupFeatures}
    >
      <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
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
          className="w-full rounded-xl bg-gradient-to-r from-pink-600 to-pink-700 py-3.5 font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:from-pink-700 hover:to-pink-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none"
        >
          Create Account
        </button>
      </form>

      <AuthDivider />
      <GoogleAuthButton />

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
