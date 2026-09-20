import { useEffect, useRef, useState } from 'react'

import { ModalFrame } from '@/components/ui/ModalFrame'
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
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const handleSubmit = async () => {
    const trimmed = code.trim().toUpperCase()

    const parseResult = joinAccountSchema.safeParse({ code: trimmed })
    if (!parseResult.success) {
      const message = getZodErrorMessage(parseResult.error, 'Invalid invitation code.')
      alerts.warning(message)
      return
    }

    const { error } = await joinAccount(trimmed)

    if (!isMountedRef.current) {
      return
    }

    if (error) {
      alerts.error(error.message)
      return
    }

    alerts.success('You have joined the shared account!')
    onJoined()
  }

  return (
    <ModalFrame
      closeDisabled={false}
      closeLabel="Close join modal"
      onClose={onClose}
      panelClassName="max-w-md rounded-[2.5rem]"
      title="Join Shared Account"
      titleId="join-account-title"
    >
      <div className="space-y-6">
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
    </ModalFrame>
  )
}
