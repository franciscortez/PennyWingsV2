import { useEffect, useRef, useState } from 'react'

import { AppButton } from '@/components/ui/Button'
import { fieldInput, fieldLabel } from '@/components/ui/fieldStyles'
import { textMuted } from '@/components/ui/surfaces'
import { accountModalPanel } from '@/sections/accounts/accountStyles'
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
    isMountedRef.current = true
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
      panelClassName={`${accountModalPanel} max-w-md`}
      title="Join Shared Account"
      titleId="join-account-title"
    >
      <div className="space-y-6">
        <p className={`text-sm leading-relaxed ${textMuted}`}>
          Enter the invitation code you received from the account owner.
          Codes look like{' '}
          <span className="font-semibold text-pink-700 dark:text-pink-400">WING-123456</span>.
        </p>

        <div>
          <label htmlFor="account-invitation-code" className={`mb-3 block ${fieldLabel}`}>
            Invitation Code
          </label>
          <input
            id="account-invitation-code"
            type="text"
            placeholder="WING-000000"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            className={fieldInput(false, "min-w-0 font-geist-mono")}
          />
        </div>

        <AppButton
          type="button"
          onClick={handleSubmit}
          disabled={joining || !code.trim()}
          className="w-full min-w-0 whitespace-normal"
        >
          {joining ? 'Joining...' : 'Join Account'}
        </AppButton>
      </div>
    </ModalFrame>
  )
}
