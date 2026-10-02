import { Moon, Sun } from 'lucide-react'

import { AppButton } from '@/components/ui/Button'
import { SidebarTooltip } from '@/components/ui/SidebarTooltip'
import { useTheme } from '@/context/ThemeContext'

type ThemeToggleProps = {
  expanded: boolean
}

export function ThemeToggle({ expanded }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const label = `Switch to ${theme === 'light' ? 'dark' : 'light'} mode`
  const Icon = theme === 'light' ? Moon : Sun

  return (
    <SidebarTooltip enabled={!expanded} label={label}>
      {(tooltipProps) => (
        <AppButton
          {...tooltipProps}
          type="button"
          onClick={toggleTheme}
          variant="ghost"
          aria-label={label}
          className={`w-full motion-reduce:transform-none motion-reduce:transition-none dark:hover:text-pink-400 ${expanded ? 'justify-start gap-3 px-4' : 'px-0'}`}
        >
          <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          {expanded && <span className="truncate">{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>}
        </AppButton>
      )}
    </SidebarTooltip>
  )
}
