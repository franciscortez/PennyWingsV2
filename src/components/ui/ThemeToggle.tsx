import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

type ThemeToggleProps = {
  expanded: boolean
}

export function ThemeToggle({ expanded }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`flex items-center rounded-xl py-3 font-bold transition-all w-full text-gray-400 hover:bg-pink-50/70 hover:text-pink-500 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-pink-400 ${
        expanded ? 'gap-3 px-4' : 'justify-center px-0'
      }`}
      title={expanded ? undefined : `Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <>
          <Moon className="h-6 w-6 shrink-0" aria-hidden="true" />
          {expanded && <span className="truncate">Dark Mode</span>}
        </>
      ) : (
        <>
          <Sun className="h-6 w-6 shrink-0 text-amber-400" aria-hidden="true" />
          {expanded && <span className="truncate text-amber-400">Light Mode</span>}
        </>
      )}
    </button>
  )
}
