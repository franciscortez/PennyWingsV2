import type { Page } from '@playwright/test'
import { fixtureBankCards, fixtureEWallets, fixtureMembers, fixtureInvites, fixtureProfiles } from './accountsModalFixtures'

export async function mockAccountsDesign(page: Page, options: { extreme?: boolean; empty?: boolean; withoutCash?: boolean } = {}) {
  const requests: { table: string; method: string; body: Record<string, unknown> }[] = []
  const cards: Record<string, unknown>[] = options.empty ? [] : fixtureBankCards(3).map((card, index) => ({
    ...card,
    card_name: index === 0 ? (options.extreme ? 'Longaccountname'.repeat(12) : 'Personal Reserve') : index === 1 ? 'Shared Viewer' : 'Shared Transactor',
    user_id: index === 0 ? 'test-user-id' : 'another-owner',
    color: index === 0 ? '#F472B6' : card.color,
    balance: options.extreme ? 999999999999.99 : index === 0 ? -123.45 : card.balance,
  }))
  cards.push(...(options.empty ? [] : [{ ...fixtureBankCards(1)[0], id: 'hidden-card', card_name: 'Hidden Shared', user_id: 'another-owner' }, { ...fixtureBankCards(1)[0], id: 'archived-card', card_name: 'Archived Reserve', is_active: false, status: 'archived' }]))
  const wallets: Record<string, unknown>[] = options.empty ? [] : fixtureEWallets(1).filter(row => !options.withoutCash || row.wallet_type !== 'cash')
  const memberships = options.empty ? [] : [
    { id: 'viewer-membership', resource_type: 'bank_card', resource_id: 'card-fixture-2', role: 'viewer', is_hidden: false },
    { id: 'transactor-membership', resource_type: 'bank_card', resource_id: 'card-fixture-3', role: 'transactor', is_hidden: false },
    { id: 'hidden-membership', resource_type: 'bank_card', resource_id: 'hidden-card', role: 'viewer', is_hidden: true },
  ]
  let members: Record<string, unknown>[] = fixtureMembers.map(row => ({ ...row }))
  let invites: Record<string, unknown>[] = fixtureInvites.map(row => ({ ...row }))
  for (const [table, rows] of [['bank_cards', cards], ['e_wallets', wallets]] as const) {
    await page.route(`**/rest/v1/${table}*`, async route => {
      const method = route.request().method(), query = new URL(route.request().url()).searchParams
      const id = query.get('id')?.replace('eq.', '')
      if (method === 'GET') {
        const isArchived = query.get('status') === 'eq.archived' || query.get('is_active') === 'eq.false'
        await route.fulfill({
          json: rows.filter((row) =>
            isArchived
              ? row.status === 'archived' || row.is_active === false
              : (row.status ?? 'active') === 'active' && row.is_active !== false,
          ),
        })
      } else {
        const body = route.request().postDataJSON() as Record<string, unknown> | null
        requests.push({ table, method, body: body ?? {} })
        if (method === 'PATCH') Object.assign(rows.find(row => row.id === id) ?? {}, body)
        if (method === 'POST') rows.push({ ...body, id: `created-${rows.length}`, created_at: new Date().toISOString() })
        if (method === 'DELETE') { const index = rows.findIndex(row => row.id === id); if (index >= 0) rows.splice(index, 1) }
        await route.fulfill({ status: 204 })
      }
    })
  }
  await page.route('**/rest/v1/account_memberships*', async route => {
    const method = route.request().method(), query = new URL(route.request().url()).searchParams
    if (method === 'GET') await route.fulfill({ json: query.has('resource_id') ? members : memberships })
    else {
      const id = query.get('id')?.replace('eq.', '')
      requests.push({ table: 'account_memberships', method, body: { id } })
      const own = memberships.find(row => row.id === id)
      if (own) { const index = cards.findIndex(row => row.id === own.resource_id); if (index >= 0) cards.splice(index, 1) }
      members = members.filter(row => row.id !== id)
      await route.fulfill({ status: 204 })
    }
  })
  await page.route('**/rest/v1/joint_account_invites*', async route => {
    if (route.request().method() === 'GET') await route.fulfill({ json: invites })
    else {
      const body = route.request().postDataJSON() as Record<string, unknown>
      requests.push({ table: 'joint_account_invites', method: 'POST', body })
      invites.push({ ...body, id: `new-invite-${invites.length}`, created_at: new Date().toISOString() })
      await route.fulfill({ status: 204 })
    }
  })
  await page.route('**/rest/v1/profiles*', route => route.fulfill({ json: fixtureProfiles }))
  await page.route('**/rest/v1/rpc/*', async route => {
    const name = new URL(route.request().url()).pathname.split('/').at(-1)!
    const body = route.request().postDataJSON() as Record<string, unknown>
    requests.push({ table: name, method: 'POST', body })
    if (name === 'set_account_membership_hidden') {
      const row = memberships.find(row => row.id === body.p_membership_id)
      if (row) row.is_hidden = Boolean(body.p_hidden)
    }
    if (name === 'update_account_member_role') { const row = members.find(row => row.id === body.p_membership_id); if (row) row.role = body.p_role }
    if (name === 'revoke_joint_account_invite') invites = invites.filter(row => row.id !== body.p_invite_id)
    if (name === 'accept_joint_account_invite' && body.p_code === 'WING-000000') await route.fulfill({ status: 400, json: { message: 'Fixture invitation expired', code: 'P0001' } })
    else await route.fulfill({ json: null })
  })
  return requests
}
