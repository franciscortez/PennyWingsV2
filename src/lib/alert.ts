import Swal, { type SweetAlertIcon, type SweetAlertOptions } from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

type AlertMessage =
  | string
  | {
      text?: string
      title: string
    }

const normalizeMessage = (message: AlertMessage) =>
  typeof message === 'string' ? { title: message } : message

const toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: false,
  background: '#ffffff',
  color: '#1f2937',
  iconColor: '#ec4899',
  customClass: {
    popup: 'rounded-2xl border border-pink-50 shadow-lg',
  },
})

const confirm = Swal.mixin({
  background: '#ffffff',
  color: '#111827',
  confirmButtonColor: '#ec4899',
  cancelButtonColor: '#94a3b8',
  reverseButtons: false,
  customClass: {
    popup: 'rounded-[2.5rem] border border-pink-50 p-8 shadow-lg',
    title: 'mb-2 text-2xl font-black tracking-tight',
    htmlContainer: 'mb-4 text-base font-medium opacity-80',
    confirmButton: 'mr-2 rounded-2xl px-8 py-4 text-sm font-black uppercase',
    cancelButton: 'rounded-2xl px-6 py-4 text-sm font-black uppercase',
  },
})

const showToast = (icon: SweetAlertIcon, message: AlertMessage) => {
  const { text, title } = normalizeMessage(message)

  void toast.fire({
    icon,
    text,
    title,
  })
}

const ask = async (options: SweetAlertOptions) => {
  const result = await confirm.fire({
    showCancelButton: true,
    ...options,
  })

  return result.isConfirmed
}

export const alerts = {
  success: (message: AlertMessage) => showToast('success', message),
  error: (message: AlertMessage) => showToast('error', message),
  warning: (message: AlertMessage) => showToast('warning', message),
  info: (message: AlertMessage) => showToast('info', message),
  confirm: ask,
  confirmDelete: (itemName = 'item', text?: string) =>
    ask({
      title: `Delete ${itemName}?`,
      text: text ?? 'Every penny counts! This action cannot be undone.',
      icon: 'warning',
      confirmButtonText: 'Yes, Delete It',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f43f5e',
    }),
  confirmLogout: () =>
    ask({
      title: 'Wait! Leaving?',
      text: 'Are you sure you want to sign out?',
      icon: 'warning',
      confirmButtonText: 'Yes, Log Me Out',
      cancelButtonText: 'Cancel',
    }),
}
