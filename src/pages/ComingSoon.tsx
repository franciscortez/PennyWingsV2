import Layout from '@/components/Layout'
import { AppButton } from '@/components/ui'

type ComingSoonProps = {
  title: string
}

export default function ComingSoon({ title }: ComingSoonProps) {
  return (
    <Layout>
      <section className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-xl rounded-[2.5rem] border border-pink-50 bg-white p-8 text-center">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-pink-500">
            Next Phase
          </p>
          <h1 className="text-3xl font-black tracking-tight text-gray-950">
            {title}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm font-medium text-gray-500">
            This route is wired so dashboard navigation works. The full module
            can be built in the next phase.
          </p>
          <AppButton
            to="/dashboard"
            className="mt-8"
          >
            Back to Dashboard
          </AppButton>
        </div>
      </section>
    </Layout>
  )
}
