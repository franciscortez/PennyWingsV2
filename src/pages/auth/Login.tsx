import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { twMerge } from 'tailwind-merge'

import { useAuth } from '@/hooks/useAuth'
import { alerts } from '@/lib/alert'
import {
  AuthDivider,
  AuthShell,
  GoogleAuthButton,
  PasswordInput,
  TextInput,
} from '@/sections/auth'
import { authPanels } from '@/sections/auth/authContent'
import { actionDisabled, primaryAction, textLink } from '@/sections/shared'
import { loginSchema } from '@/validation/authSchemas'

type LoginFormValues = {
  email: string
  password: string
}

export default function Login() {
  const { loading: authLoading, signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '' },
    resolver: zodResolver(loginSchema),
  })

  const submitLogin = handleSubmit(async (values) => {
    setLoading(true)
    const { error: signInError } = await signIn(
      values.email,
      values.password,
    )

    if (signInError) {
      alerts.error(signInError.message)
    } else {
      navigate('/dashboard')
    }

    setLoading(false)
  })

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
      title="Welcome back"
      subtitle="Sign in to pick up where your ledger left off."
      panel={authPanels.login}
    >
      <form className="space-y-5" onSubmit={submitLogin} noValidate>
        <TextInput
          id="login-email"
          label="Email address"
          type="email"
          error={errors.email?.message}
          {...register('email')}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        <PasswordInput
          id="login-password"
          label="Password"
          error={errors.password?.message}
          {...register('password')}
          placeholder="Your password"
          autoComplete="current-password"
          forgotPassword
        />

        <button
          type="submit"
          disabled={loading || googleLoading || authLoading}
          className={twMerge(primaryAction, actionDisabled, 'w-full')}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <AuthDivider />
      <GoogleAuthButton
        disabled={loading || googleLoading || authLoading}
        onClick={handleGoogleLogin}
      />

      <p className="mt-8 text-sm text-slate-600">
        New to PennyWings?{' '}
        <Link to="/signup" className={textLink}>
          Start free
        </Link>
      </p>
    </AuthShell>
  )
}
