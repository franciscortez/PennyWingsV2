import { useEffect, useRef, useState } from 'react'

/**
 * Keeps a text field's draft in local state and reports it to the owner only
 * after the user pauses. The field stays responsive on every keystroke while
 * the owner (here, a URL-backed query) updates once per pause instead of once
 * per character.
 *
 * `value` is the owner's committed value. When it changes from outside, such as
 * browser back, the draft follows it.
 */
export function useDebouncedInput(
  value: string,
  onCommit: (next: string) => void,
  delayMs = 250,
): readonly [string, (next: string) => void] {
  const [draft, setDraft] = useState(value)
  const [seenValue, setSeenValue] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onCommitRef = useRef(onCommit)

  // Adopt an external change during render, so no stale frame is painted.
  if (value !== seenValue) {
    setSeenValue(value)
    setDraft(value)
  }

  useEffect(() => {
    onCommitRef.current = onCommit
  })

  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
    },
    [],
  )

  const update = (next: string) => {
    setDraft(next)
    if (timerRef.current !== null) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      onCommitRef.current(next)
    }, delayMs)
  }

  return [draft, update] as const
}
