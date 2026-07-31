import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

import { getEnv, serve } from '../_shared/runtime.ts'

type AlertItem = {
  name: string
  type: 'budget' | 'goal'
  current: number
  target: number
  percent: number
  status: 'near_limit' | 'reached' | 'exceeded'
}

type RowUpdate = {
  table: 'budgets' | 'goals'
  id: string
  percent: number
}

const tierFor = (percent: number) => (percent >= 100 ? 100 : percent >= 80 ? 80 : 0)

const buildEmailHtml = (alerts: AlertItem[]) => {
  const rows = alerts
    .map((item) => {
      const badgeColor =
        item.status === 'exceeded'
          ? '#ef4444'
          : item.status === 'reached'
            ? '#10b981'
            : '#f59e0b'
      const statusLabel =
        item.status === 'exceeded'
          ? 'Budget Exceeded'
          : item.status === 'reached'
            ? 'Goal Reached!'
            : 'Close to Threshold'

      return `
        <tr style="border-bottom: 1px solid #334155;">
          <td style="padding: 12px; color: #f8fafc; font-weight: 600;">${item.name}</td>
          <td style="padding: 12px; color: #cbd5e1;">₱${item.current.toLocaleString()} / ₱${item.target.toLocaleString()}</td>
          <td style="padding: 12px; color: #cbd5e1;">${item.percent}%</td>
          <td style="padding: 12px;">
            <span style="background-color: ${badgeColor}; color: #ffffff; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
              ${statusLabel}
            </span>
          </td>
        </tr>
      `
    })
    .join('')

  const subject = alerts.some((a) => a.status === 'exceeded')
    ? '⚠️ PennyWings Alert: Budget Exceeded'
    : '🎯 PennyWings Alert: Goal / Budget Threshold Update'

  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><title>${subject}</title></head>
      <body style="font-family: system-ui, -apple-system, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; padding: 24px; border: 1px solid #334155;">
          <h2 style="color: #38bdf8; margin-top: 0;">PennyWings Threshold Alert</h2>
          <p style="color: #94a3b8; line-height: 1.5;">
            Here is an automated summary of your budgets and financial goals that have met or are close to reaching their threshold limits:
          </p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; text-align: left;">
            <thead>
              <tr style="border-bottom: 2px solid #475569; color: #94a3b8;">
                <th style="padding: 8px 12px;">Item</th>
                <th style="padding: 8px 12px;">Progress</th>
                <th style="padding: 8px 12px;">%</th>
                <th style="padding: 8px 12px;">Status</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #334155; text-align: center; color: #64748b; font-size: 12px;">
            PennyWings Personal Finance Tracker
          </div>
        </div>
      </body>
    </html>
  `

  return { html, subject }
}

serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed.' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 405,
    })
  }

  const cronSecret = getEnv('CRON_SECRET')
  const providedSecret = request.headers.get('x-cron-secret')
  if (!cronSecret || providedSecret !== cronSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized.' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 401,
    })
  }

  const supabaseUrl = getEnv('SUPABASE_URL')
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')
  const smtpEmail = getEnv('SMTP_EMAIL')
  const smtpPassword = getEnv('SMTP_PASSWORD')

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: 'Supabase service role configuration is missing.' }),
      { headers: { 'Content-Type': 'application/json' }, status: 503 },
    )
  }

  if (!smtpEmail || !smtpPassword) {
    return new Response(
      JSON.stringify({
        error: 'Gmail sender is not configured in secrets (SMTP_EMAIL / SMTP_PASSWORD).',
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 503 },
    )
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const [budgetsResult, goalsResult, expensesResult] = await Promise.all([
    supabase
      .from('budgets')
      .select('id, user_id, category_id, limit_amount, last_alert_percent, category:categories(name)'),
    supabase
      .from('goals')
      .select('id, user_id, name, target_amount, current_amount, last_alert_percent'),
    supabase.from('transactions').select('user_id, amount, category_id').eq('type', 'expense'),
  ])

  const expenseTotals: Record<string, number> = {}
  for (const exp of expensesResult.data ?? []) {
    if (exp.category_id) {
      const key = `${exp.user_id}:${exp.category_id}`
      expenseTotals[key] = (expenseTotals[key] || 0) + Number(exp.amount || 0)
    }
  }

  const alertsByUser = new Map<string, AlertItem[]>()
  const rowUpdates: RowUpdate[] = []

  for (const b of budgetsResult.data ?? []) {
    const limit = Number(b.limit_amount || 0)
    if (limit <= 0) continue
    const spent = expenseTotals[`${b.user_id}:${b.category_id}`] || 0
    const percent = Math.round((spent / limit) * 100)
    const tier = tierFor(percent)
    const previousTier = Number(b.last_alert_percent || 0)

    if (tier !== previousTier) {
      rowUpdates.push({ id: b.id, percent: tier, table: 'budgets' })
    }

    if (tier > previousTier && tier > 0) {
      const category = Array.isArray(b.category) ? b.category[0] : b.category
      const list = alertsByUser.get(b.user_id) ?? []
      list.push({
        current: spent,
        name: `${category?.name || 'Category'} Budget`,
        percent,
        status: percent >= 100 ? 'exceeded' : 'near_limit',
        target: limit,
        type: 'budget',
      })
      alertsByUser.set(b.user_id, list)
    }
  }

  for (const g of goalsResult.data ?? []) {
    const target = Number(g.target_amount || 0)
    if (target <= 0) continue
    const current = Number(g.current_amount || 0)
    const percent = Math.round((current / target) * 100)
    const tier = tierFor(percent)
    const previousTier = Number(g.last_alert_percent || 0)

    if (tier !== previousTier) {
      rowUpdates.push({ id: g.id, percent: tier, table: 'goals' })
    }

    if (tier > previousTier && tier > 0) {
      const list = alertsByUser.get(g.user_id) ?? []
      list.push({
        current,
        name: g.name,
        percent,
        status: percent >= 100 ? 'reached' : 'near_limit',
        target,
        type: 'goal',
      })
      alertsByUser.set(g.user_id, list)
    }
  }

  await Promise.all(
    rowUpdates.map((update) =>
      supabase.from(update.table).update({ last_alert_percent: update.percent }).eq('id', update.id),
    ),
  )

  let emailsSent = 0
  if (alertsByUser.size > 0) {
    const emailByUserId = new Map<string, string>()
    let page = 1
    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
      if (error || !data) break
      for (const u of data.users) {
        if (u.email) emailByUserId.set(u.id, u.email)
      }
      if (data.users.length < 1000) break
      page += 1
    }

    const transport = nodemailer.createTransport({
      auth: { pass: smtpPassword, user: smtpEmail },
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
    })

    for (const [userId, alerts] of alertsByUser) {
      const recipient = emailByUserId.get(userId)
      if (!recipient) continue
      const { html, subject } = buildEmailHtml(alerts)
      try {
        await transport.sendMail({ from: smtpEmail, html, subject, to: recipient })
        emailsSent += 1
      } catch {
        // continue notifying remaining users even if one delivery fails
      }
    }
  }

  return new Response(
    JSON.stringify({
      emailsSent,
      rowsUpdated: rowUpdates.length,
      usersWithAlerts: alertsByUser.size,
    }),
    { headers: { 'Content-Type': 'application/json' }, status: 200 },
  )
})
