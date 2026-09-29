// Copy for the brand panel beside each auth form.
//
// Every statement maps to something the product does today. The sources are
// the landing sections that were already checked against the code
// (`IntegritySection`, `BentoSection`, `FaqSection`): manual entries only, no
// bank or e-wallet linking, balances kept by checked database functions,
// row-level security, and hashed WING invite codes that expire after an hour.

export type AuthPanelPoint = {
  title: string
  body: string
}

export type AuthPanelContent = {
  headline: string
  body: string
  points: AuthPanelPoint[]
  // True when the points are steps the user follows in order.
  ordered?: boolean
}

const budgetsAndGoals: AuthPanelPoint = {
  title: 'Budgets and savings goals',
  body: 'Set a budget or a goal, then see how each month measures up in your reports.',
}

export const authPanels = {
  login: {
    headline: 'Every peso, right where you left it.',
    body: 'Your accounts, budgets and goals are as you last logged them. Nothing moves until you add an entry.',
    points: [
      {
        title: 'Four kinds of account, one total',
        body: "Cards, e-wallets, cash and money you've lent, added up in one place.",
      },
      budgetsAndGoals,
      {
        title: 'The database keeps the balances',
        body: 'Every entry runs through checked database functions, never browser math.',
      },
    ],
  },
  signup: {
    headline: 'One calm place for every peso.',
    body: 'You log income, expenses and transfers yourself. PennyWings does not link to banks or e-wallet providers.',
    points: [
      {
        title: 'Share an account, not your whole wallet',
        body: 'Invite someone to a single account with a WING code. Codes expire after an hour.',
      },
      budgetsAndGoals,
      {
        title: 'Every row knows its owner',
        body: 'Row-level security shows you your own records and the ones shared with you, nothing else.',
      },
    ],
  },
  recovery: {
    headline: 'Back into your ledger in three steps.',
    body: 'Changing your password only changes how you sign in. Your accounts and balances stay exactly as they are.',
    ordered: true,
    points: [
      {
        title: 'Request a reset link',
        body: 'Enter the email on your account and we send a link to that inbox.',
      },
      {
        title: 'Open the link',
        body: 'It brings you to a page where you choose a new password.',
      },
      {
        title: 'Sign in again',
        body: 'Use the new password the next time you sign in.',
      },
    ],
  },
} satisfies Record<string, AuthPanelContent>
