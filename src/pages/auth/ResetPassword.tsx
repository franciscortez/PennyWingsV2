import { Link } from 'react-router'

import { AuthShell, PasswordInput } from '@/sections/auth'

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
      <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
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
          className="w-full rounded-xl bg-gradient-to-r from-pink-600 to-pink-700 py-3.5 font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:from-pink-700 hover:to-pink-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none"
        >
          Update Password
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
