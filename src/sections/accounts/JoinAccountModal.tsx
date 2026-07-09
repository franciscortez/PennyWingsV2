import { FaXmark } from 'react-icons/fa6'
import { useState } from 'react'

import { useAuth } from '@/hooks/useAuth'
import { useJoinAccount } from '@/hooks/useJointAccountData'
import { alerts } from '@/lib/alert'

import { joinAccountSchema } from '@/validation/accountSchemas'
import { getZodErrorMessage } from '@/validation/zodError'

type JoinAccountModalProps = {
  onClose: () => void
  onJoined: () => void
}

export function JoinAccountModal({ onClose, onJoined }: JoinAccountModalProps) {
  const { user } = useAuth()
  const { joinAccount, joining } = useJoinAccount(user?.id)
  const [code, setCode] = useState('')

  const handleSubmit = async () => {
    const trimmed = code.trim().toUpperCase()

    const parseResult = joinAccountSchema.safeParse({ code: trimmed })
    if (!parseResult.success) {
      const message = getZodErrorMessage(parseResult.error, 'Invalid invitation code.')
      alerts.warning(message)
      return
    }

    const { error } = await joinAccount(trimmed)

    if (error) {
      alerts.error(error.message)
      return
    }

    alerts.success('You have joined the shared account!')
    onJoined()
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-black/40"
        aria-label="Close join modal"
      />
      <section className="relative z-10 w-full max-w-md overflow-hidden rounded-[2.5rem] border border-pink-100 bg-white animate-fade-in dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-pink-50 p-6 pb-4 dark:border-slate-800">
          <h2 className="text-2xl font-black tracking-tight text-gray-800 dark:text-slate-100">
            Join Shared Account
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-all duration-200 hover:rotate-90 hover:bg-pink-50 active:scale-90 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <FaXmark className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-6 p-6 pt-4">
          <p className="text-sm font-medium leading-relaxed text-gray-500 dark:text-slate-400">
            Enter the invitation code you received from the account owner.
            Codes look like{' '}
            <span className="font-bold text-pink-500">WING-123456</span>.
          </p>

          <div>
            <label className="mb-3 ml-1 block text-xs font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
              Invitation Code
            </label>
            <input
              autoFocus
              type="text"
              placeholder="WING-000000"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              className="w-full rounded-2xl border-2 border-pink-100 bg-pink-50/30 px-5 py-4 text-center font-mono text-xl font-black tracking-[0.15em] text-gray-800 outline-none transition-all placeholder:text-pink-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200 dark:focus:border-pink-500"
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={joining || !code.trim()}
            className="w-full rounded-2xl bg-linear-to-r from-pink-500 to-pink-600 py-4 text-lg font-black text-white transition-all hover:-translate-y-0.5 disabled:opacity-40"
          >
            {joining ? 'Joining...' : 'Join Account'}
          </button>
        </div>
      </section>
    </div>
  )
}
