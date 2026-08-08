import { Component, type ReactNode } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <main className="flex min-h-screen items-center justify-center bg-pink-50 p-6 text-gray-900 dark:bg-slate-950 dark:text-slate-100">
        <section
          role="alert"
          className="w-full max-w-lg rounded-[2.5rem] border border-pink-100 bg-white p-8 text-center shadow-xl shadow-pink-100/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
        >
          <p className="text-xs font-black uppercase tracking-[0.24em] text-pink-500">
            PennyWings
          </p>
          <h1 className="mt-3 text-2xl font-black">Something went wrong</h1>
          <p className="mt-3 text-sm font-medium text-gray-500 dark:text-slate-400">
            Reload the page to continue. Your saved financial data remains in your account.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-2xl bg-pink-500 px-7 py-3 text-sm font-black text-white transition hover:bg-pink-600"
          >
            Reload page
          </button>
        </section>
      </main>
    )
  }
}
