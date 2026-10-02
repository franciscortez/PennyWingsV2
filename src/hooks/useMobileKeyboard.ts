import { useEffect, useState } from 'react'

export function useMobileKeyboard() {
  const [keyboardOpen, setKeyboardOpen] = useState(false)

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    const update = () => {
      // Normalizing zoom keeps a pinch gesture from looking like a keyboard.
      const lostHeight = window.innerHeight - viewport.height * viewport.scale
      const openThreshold = Math.max(120, window.innerHeight * 0.2)
      const closeThreshold = Math.max(80, window.innerHeight * 0.12)
      setKeyboardOpen((current) => lostHeight > (current ? closeThreshold : openThreshold))
    }

    update()
    viewport.addEventListener('resize', update)
    return () => viewport.removeEventListener('resize', update)
  }, [])

  return keyboardOpen
}
