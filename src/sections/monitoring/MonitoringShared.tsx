import { Pencil, Plus, Trash2, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { AppButton, ModalFrame } from '@/components/ui'
import { FormattedFigure } from '@/components/ui/FormattedFigure'
import { surface, surfaceNested, textMuted } from '@/components/ui/surfaces'
import { appModalPanel } from '@/sections/shared/appDesignStyles'

export type ModalMode = 'create' | 'edit'

export function ActionButtons({ deleteLabel, deleting, editLabel, onDelete, onEdit }: {
  deleteLabel: string
  deleting: boolean
  editLabel: string
  onDelete: () => void
  onEdit: () => void
}) {
  return <div className="flex shrink-0 gap-1">
    <AppButton type="button" size="icon" variant="ghost" onClick={onEdit} disabled={deleting} className="h-11 w-11 motion-reduce:transform-none motion-reduce:transition-none" aria-label={editLabel} title={editLabel}><Pencil className="h-4 w-4" aria-hidden="true" /></AppButton>
    <AppButton type="button" size="icon" variant="danger" onClick={onDelete} disabled={deleting} className="h-11 w-11 motion-reduce:transform-none motion-reduce:transition-none" aria-label={deleteLabel} title={deleteLabel}><Trash2 className="h-4 w-4" aria-hidden="true" /></AppButton>
  </div>
}

export function MetricBox({ label, value }: { label: string; value: string }) {
  return <div className={`${surfaceNested} min-w-0 p-4`}>
    <p className={`text-sm ${textMuted}`}>{label}</p>
    <p className="mt-1 text-base font-semibold text-slate-950 dark:text-slate-100"><FormattedFigure value={value} /></p>
  </div>
}

export function EmptyPanel({ actionLabel, description, icon: Icon, onAction, title }: {
  actionLabel: string
  description: string
  icon: LucideIcon
  onAction: () => void
  title: string
}) {
  return <section className={`${surface} px-4 py-12 text-center sm:px-6`}>
    <Icon className="mx-auto mb-5 h-10 w-10 text-pink-700 dark:text-pink-400" aria-hidden="true" />
    <h2 className="text-xl font-semibold tracking-tighter text-slate-950 dark:text-white">{title}</h2>
    <p className={`mx-auto mt-2 max-w-md text-base ${textMuted}`}>{description}</p>
    <AppButton type="button" onClick={onAction} className="mt-6 motion-reduce:transform-none motion-reduce:transition-none"><Plus className="h-5 w-5" aria-hidden="true" />{actionLabel}</AppButton>
  </section>
}

export function CardSkeletonGrid() {
  return <section className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2" aria-label="Loading monitoring plans" aria-busy="true">
    {[1, 2, 3, 4].map(item => <div key={item} className={`${surface} h-72 p-6 motion-safe:animate-pulse`} aria-hidden="true"><div className="mb-8 h-12 w-2/3 rounded-full bg-slate-200 dark:bg-slate-700" /><div className="mb-4 h-20 rounded-[1.25rem] bg-slate-100 dark:bg-slate-800" /><div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700" /></div>)}
  </section>
}

export function ModalShell({ actions, children, onClose, saving, title }: {
  actions?: ReactNode
  children: ReactNode
  onClose: () => void
  saving: boolean
  title: string
}) {
  return <ModalFrame actions={actions} closeDisabled={saving} closeLabel="Close monitoring form" onClose={onClose} panelClassName={`${appModalPanel} max-w-lg`} title={title} titleId="monitoring-modal-title">{children}</ModalFrame>
}

export function ModalActions({ formId, onClose, saving, submitLabel, waitingLabel }: {
  formId: string
  onClose: () => void
  saving: boolean
  submitLabel: string
  waitingLabel: string
}) {
  return <div className="flex flex-wrap items-center justify-end gap-3">
    <AppButton type="button" variant="secondary" onClick={onClose} disabled={saving} className="motion-reduce:transform-none motion-reduce:transition-none">Cancel</AppButton>
    <AppButton type="submit" form={formId} disabled={saving} className="motion-reduce:transform-none motion-reduce:transition-none">{saving ? waitingLabel : submitLabel}</AppButton>
  </div>
}
