import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
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
import { fieldError } from '@/sections/auth/fieldStyles'
import { actionDisabled, primaryAction, textLink } from '@/sections/shared'
import { registerSchema } from '@/validation/authSchemas'

type RegisterFormValues = {
  acceptedTerms: boolean
  confirm: string
  email: string
  password: string
}

export default function Register() {
  const { loading: authLoading, signInWithGoogle, signUp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<RegisterFormValues>({
    defaultValues: {
      acceptedTerms: false,
      confirm: '',
      email: '',
      password: '',
    },
    resolver: zodResolver(registerSchema),
  })

  const submitRegistration = handleSubmit(async (values) => {
    setLoading(true)
    const { error: signUpError } = await signUp(
      values.email,
      values.password,
    )

    if (signUpError) {
      alerts.error(signUpError.message)
    } else {
      alerts.success('Account created! Please check your email to confirm your account.')
      reset()
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
      title="Create your account"
      subtitle="Sign up with your email, or continue with Google."
      panel={authPanels.signup}
    >
      <form className="space-y-5" onSubmit={submitRegistration} noValidate>
        <TextInput
          id="register-email"
          label="Email address"
          type="email"
          error={errors.email?.message}
          {...register('email')}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        <PasswordInput
          id="register-password"
          label="Password"
          error={errors.password?.message}
          {...register('password')}
          placeholder="Min. 6 characters"
          autoComplete="new-password"
        />
        <PasswordInput
          id="register-confirm-password"
          label="Confirm password"
          error={errors.confirm?.message}
          {...register('confirm')}
          placeholder="Repeat your password"
          autoComplete="new-password"
        />

        <div className="flex items-start gap-3">
          <input
            aria-describedby={errors.acceptedTerms ? 'accepted-terms-error' : undefined}
            aria-invalid={Boolean(errors.acceptedTerms)}
            type="checkbox"
            id="terms"
            {...register('acceptedTerms')}
            className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-pink-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-800"
          />
          <label
            htmlFor="terms"
            className="cursor-pointer text-sm leading-relaxed text-slate-600"
          >
            I agree to the{' '}
            <Link to="/terms-and-conditions" className={textLink}>
              Terms and Agreement
            </Link>{' '}
            and understand how my data is handled.
          </label>
        </div>
        {errors.acceptedTerms ? (
          <p id="accepted-terms-error" className={fieldError}>
            {errors.acceptedTerms.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading || googleLoading || authLoading}
          className={twMerge(primaryAction, actionDisabled, 'w-full')}
        >
          {loading ? 'Creating account...' : 'Start free'}
        </button>
      </form>

      <AuthDivider />
      <GoogleAuthButton
        disabled={loading || googleLoading || authLoading}
        onClick={handleGoogleLogin}
      />

      <p className="mt-8 text-sm text-slate-600">
        Already have an account?{' '}
        <Link to="/login" className={textLink}>
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
