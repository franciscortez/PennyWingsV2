import { Link } from 'react-router'

import { AuthShell, TextInput } from '@/sections/auth'

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
  return (
    <AuthShell
      title="Reset Password"
      subtitle="Enter your email and we'll send you a reset link"
      heroTitle="Forgot your password? No worries!"
      heroDescription="We'll send you a secure link to reset your password and get you back on track with your financial goals."
      features={forgotPasswordFeatures}
    >
      <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
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
          className="w-full rounded-xl bg-gradient-to-r from-pink-600 to-pink-700 py-3.5 font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:from-pink-700 hover:to-pink-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none"
        >
          Send Reset Link
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
