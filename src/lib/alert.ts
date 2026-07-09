import Swal, { type SweetAlertIcon, type SweetAlertOptions } from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

type AlertMessage =
  | string
  | {
      text?: string
      title: string
    }

const lightTheme = {
  background: '#ffffff',
  cancelButtonColor: '#94a3b8',
  color: '#111827',
  confirmButtonColor: '#ec4899',
  dangerButtonColor: '#f43f5e',
  iconColor: '#ec4899',
}

const darkTheme = {
  background: '#0f172a',
  cancelButtonColor: '#475569',
  color: '#e2e8f0',
  confirmButtonColor: '#db2777',
  dangerButtonColor: '#e11d48',
  iconColor: '#f472b6',
}

const normalizeMessage = (message: AlertMessage) =>
  typeof message === 'string' ? { title: message } : message

const getAlertTheme = () =>
  document.documentElement.classList.contains('dark') ? darkTheme : lightTheme

const toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: false,
  customClass: {
    popup:
      'rounded-2xl border border-pink-50 shadow-lg dark:border-slate-800',
  },
})

const confirm = Swal.mixin({
  reverseButtons: false,
  customClass: {
    popup:
      'rounded-[2.5rem] border border-pink-50 p-8 shadow-lg dark:border-slate-800',
    title: 'mb-2 text-2xl font-black tracking-tight',
    htmlContainer: 'mb-4 text-base font-medium opacity-80',
    confirmButton: 'mr-2 rounded-2xl px-8 py-4 text-sm font-black uppercase',
    cancelButton: 'rounded-2xl px-6 py-4 text-sm font-black uppercase',
  },
})

const showToast = (icon: SweetAlertIcon, message: AlertMessage) => {
  const { text, title } = normalizeMessage(message)
  const theme = getAlertTheme()

  void toast.fire({
    background: theme.background,
    color: theme.color,
    icon,
    iconColor: theme.iconColor,
    text,
    title,
  })
}

const ask = async (options: SweetAlertOptions) => {
  const theme = getAlertTheme()
  const result = await confirm.fire({
    background: theme.background,
    cancelButtonColor: theme.cancelButtonColor,
    color: theme.color,
    confirmButtonColor: theme.confirmButtonColor,
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
      confirmButtonColor: getAlertTheme().dangerButtonColor,
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
