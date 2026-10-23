import { useEffect } from 'react'

/** One shell-owned measurement shared by portaled forms and the assistant. */
export function useVisualViewport() {
  useEffect(() => {
    const viewport = window.visualViewport
    const root = document.documentElement
    const update = () => {
      // Preserve browser pinch zoom instead of resizing content inside it.
      if (viewport && viewport.scale !== 1) return
      root.style.setProperty('--app-viewport-height', `${viewport?.height ?? window.innerHeight}px`)
      root.style.setProperty('--app-viewport-top', `${viewport?.offsetTop ?? 0}px`)
      root.dataset.keyboard = String(window.innerHeight - (viewport?.height ?? window.innerHeight) > Math.max(120, window.innerHeight * 0.2))
    }
    update()
    viewport?.addEventListener('resize', update)
    viewport?.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    return () => {
      viewport?.removeEventListener('resize', update)
      viewport?.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      root.style.removeProperty('--app-viewport-height')
      root.style.removeProperty('--app-viewport-top')
      delete root.dataset.keyboard
    }
  }, [])
}
