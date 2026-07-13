import {
  AlertTriangle,
  BarChart3,
  Database,
  FileText,
  KeyRound,
  LifeBuoy,
  LockKeyhole,
  Scale,
  ShieldCheck,
  Trash2,
  UsersRound,
  WalletCards,
} from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

type TermsIcon = ComponentType<SVGProps<SVGSVGElement>>

type TermsSection = {
  id: string
  title: string
  icon: TermsIcon
  paragraphs: string[]
}

const termsSections: TermsSection[] = [
  {
    id: 'acceptance-of-terms',
    title: 'Acceptance of terms',
    icon: ShieldCheck,
    paragraphs: [
      'By creating an account, signing in, or using PennyWings, you agree to follow these Terms and Conditions. If you do not agree, you should not access or use the service.',
      'These terms apply to the PennyWings website, dashboard, tools, and related features made available to you.',
    ],
  },
  {
    id: 'what-pennywings-provides',
    title: 'What PennyWings provides',
    icon: WalletCards,
    paragraphs: [
      'PennyWings is a personal finance tracking application for organizing accounts, transactions, budgets, goals, reports, and shared finance records.',
      'PennyWings is not a bank, broker, lender, tax adviser, investment adviser, or legal adviser. The service is intended to help you review and organize information that you or your members enter.',
    ],
  },
  {
    id: 'user-accounts-and-security',
    title: 'User accounts and security',
    icon: KeyRound,
    paragraphs: [
      'You are responsible for providing accurate account information, keeping your login credentials secure, and monitoring activity under your account.',
      'You should notify the project owner or support contact if you believe your account has been accessed without permission.',
    ],
  },
  {
    id: 'financial-data-and-records',
    title: 'Financial data and user-entered records',
    icon: Database,
    paragraphs: [
      'PennyWings stores financial records that users enter or manage, including account groups, balances, transactions, budgets, goals, and related notes.',
      'The accuracy of this data depends on the information entered by you and your authorized members. PennyWings does not independently verify every financial record.',
    ],
  },
  {
    id: 'budgets-goals-reports-and-limitations',
    title: 'Budgets, goals, reports, and accuracy limitations',
    icon: BarChart3,
    paragraphs: [
      'Budgets, goals, summaries, charts, and reports are provided for planning and informational purposes only.',
      'Calculations may be affected by delayed entries, incomplete records, user error, system changes, or other limitations. You should review important financial decisions with qualified professionals.',
    ],
  },
  {
    id: 'shared-accounts-and-permissions',
    title: 'Shared accounts and member permissions',
    icon: UsersRound,
    paragraphs: [
      'PennyWings may allow users to invite or manage members in shared account spaces. Account owners are responsible for choosing appropriate roles and permissions.',
      'Members may be able to view, add, update, or remove information depending on the access granted to them. Only invite people you trust to handle the relevant finance records.',
    ],
  },
  {
    id: 'account-deletion-and-data-removal',
    title: 'Account deletion and data removal',
    icon: Trash2,
    paragraphs: [
      'You may request or initiate account deletion where the application makes that feature available. Deletion may remove profile information, account records, transactions, and related user data.',
      'Some information may remain for a limited period in backups, logs, audit records, security records, or where retention is required for legal, operational, or fraud-prevention reasons.',
    ],
  },
  {
    id: 'prohibited-use',
    title: 'Prohibited use',
    icon: LockKeyhole,
    paragraphs: [
      'You may not use PennyWings for unlawful activity, unauthorized access, harassment, abuse, fraud, spam, malware distribution, reverse engineering, or attempts to disrupt the service.',
      'You may not misrepresent your identity, interfere with other users, bypass security controls, or upload content that you do not have the right to provide.',
    ],
  },
  {
    id: 'service-availability-and-changes',
    title: 'Service availability and changes',
    icon: LifeBuoy,
    paragraphs: [
      'PennyWings may be updated, changed, paused, or discontinued as the product evolves. Features may be added, removed, limited, or modified without prior notice.',
      'The service may occasionally be unavailable because of maintenance, hosting issues, network problems, security events, or other circumstances outside reasonable control.',
    ],
  },
  {
    id: 'limitation-of-liability',
    title: 'Limitation of liability',
    icon: Scale,
    paragraphs: [
      'PennyWings is provided on an as-is and as-available basis. To the maximum extent permitted by law, no guarantee is made that the service will be uninterrupted, error-free, or perfectly accurate.',
      'To the maximum extent permitted by law, PennyWings and its operators are not liable for indirect, incidental, special, consequential, or punitive damages, including financial loss caused by reliance on user-entered records or reports.',
    ],
  },
  {
    id: 'privacy-and-data-handling-summary',
    title: 'Privacy and data handling summary',
    icon: FileText,
    paragraphs: [
      'PennyWings collects and processes account information and finance records needed to provide the application. Access to user data should be limited to what is necessary for product operation, support, security, and maintenance.',
      'No internet service can promise absolute security. You should avoid entering unnecessary sensitive information and should keep your account credentials private.',
    ],
  },
  {
    id: 'contact-and-update-notice',
    title: 'Contact and update notice',
    icon: AlertTriangle,
    paragraphs: [
      'These terms may be updated as PennyWings changes. When updates are posted, continued use of the service means you accept the updated terms.',
      'Questions about these terms should be directed to the PennyWings project owner or the support channel made available with the application.',
    ],
  },
]

export function TermsContentSection() {
  return (
    <section className="px-4 pb-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start">
        <aside className="rounded-3xl border border-pink-100 bg-white p-5 shadow-sm shadow-pink-100 lg:sticky lg:top-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-pink-500">
            On this page
          </p>
          <nav aria-label="Terms sections" className="mt-4 space-y-1">
            {termsSections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="block rounded-xl px-3 py-2 text-sm font-bold leading-6 text-gray-500 transition hover:bg-pink-50 hover:text-pink-700"
              >
                {section.title}
              </a>
            ))}
          </nav>
        </aside>

        <div className="space-y-5">
          <div className="rounded-3xl border border-pink-100 bg-white p-5 shadow-sm shadow-pink-100 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink-100 text-pink-700">
                <AlertTriangle className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-xl font-black text-gray-950">
                  Legal review notice
                </h2>
                <p className="mt-2 text-sm font-medium leading-7 text-gray-600 sm:text-base">
                  This is a production-oriented draft for product use and
                  should be reviewed by qualified counsel before launch or
                  public reliance.
                </p>
              </div>
            </div>
          </div>

          {termsSections.map((section, index) => {
            const Icon = section.icon

            return (
              <article
                key={section.id}
                id={section.id}
                className="scroll-mt-6 rounded-3xl border border-pink-100 bg-white p-5 shadow-sm shadow-pink-100 sm:p-7"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-pink-600">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-pink-400">
                      Section {index + 1}
                    </p>
                    <h2 className="mt-1 text-2xl font-black leading-tight text-gray-950">
                      {section.title}
                    </h2>
                    <div className="mt-4 space-y-4 text-base font-medium leading-8 text-gray-600">
                      {section.paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
