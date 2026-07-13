import { Eraser, X } from 'lucide-react'

import { AppButton } from '@/components/ui'
import { AssistantMark } from '@/sections/assistant/AssistantMark'

type AssistantHeaderProps = {
  canClear: boolean
  onClear: () => void
  onClose: () => void
}

export function AssistantHeader({
  canClear,
  onClear,
  onClose,
}: AssistantHeaderProps) {
  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-pink-100 bg-white/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] dark:border-slate-800 dark:bg-slate-900/95 md:py-3">
      <AssistantMark />
      <div className="min-w-0 flex-1">
        <h2
          id="assistant-title"
          className="truncate text-base font-black text-gray-800 dark:text-slate-100"
        >
          PennyWings AI
        </h2>
        <p className="truncate text-xs font-semibold text-gray-500 dark:text-slate-400">
          Answers from your financial snapshot
        </p>
      </div>
      {canClear ? (
        <AppButton
          type="button"
          onClick={onClear}
          size="icon"
          variant="ghost"
          aria-label="Clear conversation"
          title="Start a new conversation"
        >
          <Eraser className="h-5 w-5" aria-hidden="true" />
        </AppButton>
      ) : null}
      <AppButton
        type="button"
        onClick={onClose}
        size="icon"
        variant="ghost"
        aria-label="Close PennyWings AI Assistant"
        title="Close assistant"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </AppButton>
    </header>
  )
}
