import { AppButton } from '@/components/ui'
import { AssistantMark } from '@/sections/assistant/AssistantMark'

type AssistantLauncherProps = {
  expanded: boolean
  onOpen: () => void
}

export function AssistantLauncher({
  expanded,
  onOpen,
}: AssistantLauncherProps) {
  return (
    <div className="group fixed bottom-6 right-6 z-30 hidden md:block">
      <div
        id="assistant-launcher-tooltip"
        role="tooltip"
        className="pointer-events-none absolute bottom-full right-0 mb-3 w-max max-w-56 translate-y-1 rounded-lg border border-pink-100 bg-white px-3 py-2 text-left opacity-0 shadow-lg shadow-pink-100/60 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 motion-reduce:transition-none dark:border-slate-700 dark:bg-slate-800 dark:shadow-none"
      >
        <span className="block text-xs font-black text-gray-800 dark:text-slate-100">
          Ask PennyWings AI
        </span>
        <span className="mt-0.5 block text-[11px] font-medium text-gray-500 dark:text-slate-400">
          Get answers from your financial snapshot
        </span>
      </div>

      <AppButton
        type="button"
        onClick={onOpen}
        size="icon"
        className="h-16 w-16 rounded-full border-4 border-white bg-pink-600 shadow-xl shadow-pink-200/70 transition duration-200 hover:-translate-y-1 hover:bg-pink-700 focus-visible:ring-4 focus-visible:ring-pink-300 motion-reduce:transform-none motion-reduce:transition-none dark:border-slate-900 dark:shadow-none"
        aria-label="Open PennyWings AI Assistant"
        aria-describedby="assistant-launcher-tooltip"
        aria-expanded={expanded}
      >
        <AssistantMark
          size="md"
          className="bg-transparent shadow-none transition-transform duration-200 group-hover:scale-110 motion-reduce:transform-none"
        />
      </AppButton>
    </div>
  )
}
