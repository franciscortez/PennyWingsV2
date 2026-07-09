import { Pencil, Plus, Trash2, X, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export type ModalMode = 'create' | 'edit'

export function ActionButtons({
  deleteLabel,
  deleting,
  editLabel,
  light = false,
  onDelete,
  onEdit,
}: {
  deleteLabel: string
  deleting: boolean
  editLabel: string
  light?: boolean
  onDelete: () => void
  onEdit: () => void
}) {
  const buttonClass = light
    ? 'bg-white/15 text-white hover:bg-white/25 disabled:opacity-40'
    : 'border border-pink-50 bg-white text-gray-300 hover:bg-pink-50 hover:text-pink-600 disabled:opacity-40'

  return (
    <div className="flex shrink-0 gap-1">
      <button
        type="button"
        onClick={onEdit}
        disabled={deleting}
        className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${buttonClass}`}
        aria-label={editLabel}
        title={editLabel}
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${buttonClass}`}
        aria-label={deleteLabel}
        title={deleteLabel}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}
export function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-pink-50 bg-pink-50/50 p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
        {label}
      </p>
      <p className="mt-1 truncate text-base font-black text-gray-900">{value}</p>
    </div>
  )
}

export function EmptyPanel({
  actionLabel,
  description,
  icon: Icon,
  onAction,
  title,
}: {
  actionLabel: string
  description: string
  icon: LucideIcon
  onAction: () => void
  title: string
}) {
  return (
    <section className="rounded-[2.5rem] border-2 border-dashed border-pink-200/70 bg-white px-6 py-20 text-center">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-pink-50 text-pink-500">
        <Icon className="h-10 w-10" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-black uppercase tracking-widest text-gray-500">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm font-medium text-gray-400">
        {description}
      </p>
      <button
        type="button"
        onClick={onAction}
        className="mt-8 inline-flex items-center justify-center gap-2 rounded-[2rem] bg-pink-500 px-7 py-4 font-black text-white transition hover:bg-pink-600"
      >
        <Plus className="h-5 w-5" aria-hidden="true" />
        {actionLabel}
      </button>
    </section>
  )
}

export function CardSkeletonGrid() {
  return (
    <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="h-72 animate-pulse rounded-[2rem] border border-pink-50 bg-white p-6"
        >
          <div className="mb-8 h-12 w-2/3 rounded-2xl bg-pink-50" />
          <div className="mb-4 h-20 rounded-2xl bg-pink-50/70" />
          <div className="h-3 rounded-full bg-pink-50" />
        </div>
      ))}
    </section>
  )
}

export function ModalShell({
  children,
  onClose,
  saving,
  title,
}: {
  children: ReactNode
  onClose: () => void
  saving: boolean
  title: string
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
        aria-label="Close monitoring form"
      />
      <section className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[2.5rem] border border-pink-100 bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight text-gray-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-50 text-gray-400 transition hover:text-pink-600 disabled:opacity-50"
            aria-label="Close monitoring form"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}

export function ModalActions({
  onClose,
  saving,
  submitLabel,
  waitingLabel,
}: {
  onClose: () => void
  saving: boolean
  submitLabel: string
  waitingLabel: string
}) {
  return (
    <div className="flex items-center justify-end gap-3 pt-3">
      <button
        type="button"
        onClick={onClose}
        disabled={saving}
        className="rounded-2xl border border-pink-100 px-6 py-3 text-sm font-black text-gray-500 transition hover:bg-pink-50 disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={saving}
        className="rounded-2xl bg-pink-500 px-7 py-3 text-sm font-black text-white transition hover:bg-pink-600 disabled:opacity-50"
      >
        {saving ? waitingLabel : submitLabel}
      </button>
    </div>
  )
}
