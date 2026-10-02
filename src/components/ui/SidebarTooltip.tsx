import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

type SidebarTooltipProps = {
  children: (props: { 'aria-describedby'?: string }) => ReactNode
  enabled: boolean
  label: string
}

// The padded edge bridges the gap to the trigger. Portaling avoids clipping
// inside the sidebar's scroll region.
export function SidebarTooltip({ children, enabled, label }: SidebarTooltipProps) {
  const id = useId()
  const anchorRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hoveredRef = useRef(false)
  const focusedRef = useRef(false)
  const dismissedRef = useRef(false)
  const [open, setOpen] = useState(false)
  const visible = enabled && open

  const clearCloseTimer = () => {
    if (closeTimerRef.current !== null) clearTimeout(closeTimerRef.current)
    closeTimerRef.current = null
  }

  const show = () => {
    clearCloseTimer()
    if (enabled && !dismissedRef.current) setOpen(true)
  }

  const scheduleClose = () => {
    clearCloseTimer()
    if (!hoveredRef.current && !focusedRef.current) dismissedRef.current = false
    closeTimerRef.current = setTimeout(() => {
      if (!hoveredRef.current && !focusedRef.current) {
        setOpen(false)
        dismissedRef.current = false
      }
    }, 120)
  }

  useEffect(() => () => {
    if (closeTimerRef.current !== null) clearTimeout(closeTimerRef.current)
  }, [])

  useLayoutEffect(() => {
    if (!visible) return
    const anchor = anchorRef.current
    const tooltip = tooltipRef.current
    if (!anchor || !tooltip) return
    const scrollRegion = anchor.closest('[data-sidebar-scroll-region]')

    const dismiss = () => {
      dismissedRef.current = true
      setOpen(false)
    }

    const position = () => {
      const bounds = anchor.getBoundingClientRect()
      if (!bounds.width || !bounds.height) return
      const gutter = 8
      tooltip.style.left = `${Math.max(gutter, Math.min(bounds.right, window.innerWidth - tooltip.offsetWidth - gutter))}px`
      tooltip.style.top = `${Math.max(gutter, Math.min(bounds.top + (bounds.height - tooltip.offsetHeight) / 2, window.innerHeight - tooltip.offsetHeight - gutter))}px`
    }

    position()
    const resizeObserver = new ResizeObserver(position)
    resizeObserver.observe(anchor)
    resizeObserver.observe(tooltip)
    resizeObserver.observe(document.documentElement)
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || entry.intersectionRatio < 1) dismiss()
    }, { threshold: 1 })
    visibilityObserver.observe(anchor)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss()
    }
    scrollRegion?.addEventListener('scroll', dismiss, { passive: true })
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      scrollRegion?.removeEventListener('scroll', dismiss)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [visible, label])

  return (
    <div
      ref={anchorRef}
      onPointerEnter={(event) => {
        if (event.pointerType === 'touch') return
        hoveredRef.current = true
        show()
      }}
      onPointerLeave={() => {
        hoveredRef.current = false
        scheduleClose()
      }}
      onFocusCapture={() => {
        focusedRef.current = true
        show()
      }}
      onBlurCapture={() => {
        focusedRef.current = false
        scheduleClose()
      }}
      onClickCapture={() => {
        clearCloseTimer()
        dismissedRef.current = true
        setOpen(false)
      }}
    >
      {children({ 'aria-describedby': visible ? id : undefined })}
      {visible && createPortal(
        <div
          ref={tooltipRef}
          id={id}
          role="tooltip"
          className="fixed z-40 w-max max-w-[calc(100vw-1rem)] pl-2 font-geist text-sm font-medium text-slate-950 dark:text-slate-100"
          onPointerEnter={() => {
            hoveredRef.current = true
            clearCloseTimer()
          }}
          onPointerLeave={() => {
            hoveredRef.current = false
            scheduleClose()
          }}
        >
          <div className="max-w-56 rounded-[1.25rem] bg-paper px-4 py-2 shadow-wing dark:bg-slate-800 dark:shadow-none">
            {label}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
