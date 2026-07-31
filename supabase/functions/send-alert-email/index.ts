import nodemailer from 'nodemailer'

import {
  createFunctionHttpContext,
  guardFunctionRequest,
} from '../_shared/http.ts'
import { getEnv, serve } from '../_shared/runtime.ts'
import {
  getAuthenticatedCaller,
  getBearerAuthorization,
} from '../_shared/supabase.ts'

type AlertItem = {
  name: string
  type: 'budget' | 'goal'
  current: number
  target: number
  percent: number
  status: 'near_limit' | 'reached' | 'exceeded'
}

serve(async (request) => {
  const http = createFunctionHttpContext(request)
  const guardResponse = guardFunctionRequest(request, http)
  if (guardResponse) return guardResponse

  const authorization = getBearerAuthorization(request)
  if (!authorization) {
    return http.jsonResponse({ error: 'Authentication is required.' }, 401)
  }

  const supabaseUrl = getEnv('SUPABASE_URL')
  const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY')
  const smtpEmail = getEnv('SMTP_EMAIL')
  const smtpPassword = getEnv('SMTP_PASSWORD')

  if (!supabaseUrl || !supabaseAnonKey) {
    return http.jsonResponse({ error: 'Supabase configuration is missing.' }, 503)
  }

  if (!smtpEmail || !smtpPassword) {
    return http.jsonResponse(
      {
        error:
          'Gmail sender is not configured in secrets (SMTP_EMAIL / SMTP_PASSWORD).',
      },
      503,
    )
  }

  const caller = await getAuthenticatedCaller(
    supabaseUrl,
    supabaseAnonKey,
    authorization,
  )

  if (!caller.user || !caller.client) {
    return http.jsonResponse({ error: 'Your session has expired.' }, 401)
  }

  const { client: supabase, user } = caller
  const recipientEmail = user.email

  if (!recipientEmail) {
    return http.jsonResponse({ error: 'User does not have a valid email address.' }, 400)
  }

  let isTestRequest = false
  try {
    const rawBody = await request.text()
    if (rawBody) {
      const parsed = JSON.parse(rawBody)
      if (parsed?.test === true) {
        isTestRequest = true
      }
    }
  } catch {
    // optional body
  }

  // Fetch budgets and goals to evaluate thresholds
  const [budgetsResult, goalsResult, expensesResult] = await Promise.all([
    supabase
      .from('budgets')
      .select('id, category_id, limit_amount, period, category:categories(name)')
      .eq('user_id', user.id),
    supabase
      .from('goals')
      .select('id, name, target_amount, current_amount')
      .eq('user_id', user.id),
    supabase
      .from('transactions')
      .select('amount, category_id')
      .eq('user_id', user.id)
      .eq('type', 'expense'),
  ])

  const alerts: AlertItem[] = []

  // Calculate budget expenses per category
  const expenseTotals: Record<string, number> = {}
  if (expensesResult.data) {
    for (const exp of expensesResult.data) {
      if (exp.category_id) {
        expenseTotals[exp.category_id] =
          (expenseTotals[exp.category_id] || 0) + Number(exp.amount || 0)
      }
    }
  }

  if (budgetsResult.data) {
    for (const b of budgetsResult.data) {
      const category = Array.isArray(b.category) ? b.category[0] : b.category
      const categoryName = category?.name || 'Category'
      const limit = Number(b.limit_amount || 0)
      const spent = b.category_id ? (expenseTotals[b.category_id] || 0) : 0
      if (limit > 0) {
        const percent = Math.round((spent / limit) * 100)
        if (percent >= 100) {
          alerts.push({
            name: `${categoryName} Budget`,
            type: 'budget',
            current: spent,
            target: limit,
            percent,
            status: 'exceeded',
          })
        } else if (percent >= 80) {
          alerts.push({
            name: `${categoryName} Budget`,
            type: 'budget',
            current: spent,
            target: limit,
            percent,
            status: 'near_limit',
          })
        }
      }
    }
  }

  if (goalsResult.data) {
    for (const g of goalsResult.data) {
      const target = Number(g.target_amount || 0)
      const current = Number(g.current_amount || 0)
      if (target > 0) {
        const percent = Math.round((current / target) * 100)
        if (percent >= 100) {
          alerts.push({
            name: g.name,
            type: 'goal',
            current,
            target,
            percent,
            status: 'reached',
          })
        } else if (percent >= 80) {
          alerts.push({
            name: g.name,
            type: 'goal',
            current,
            target,
            percent,
            status: 'near_limit',
          })
        }
      }
    }
  }

  // If test request and no actual alerts, add mock alert items to test email delivery
  if (isTestRequest && alerts.length === 0) {
    alerts.push({
      name: 'Sample Monthly Budget (Test)',
      type: 'budget',
      current: 850,
      target: 1000,
      percent: 85,
      status: 'near_limit',
    })
    alerts.push({
      name: 'Emergency Fund Goal (Test)',
      type: 'goal',
      current: 5000,
      target: 5000,
      percent: 100,
      status: 'reached',
    })
  }

  if (alerts.length === 0 && !isTestRequest) {
    return http.jsonResponse({
      alertsSent: 0,
      message: 'No budgets or goals are near or at threshold limits.',
      success: true,
    })
  }

  // Build HTML email content
  const alertRowsHtml = alerts
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
          <td style="padding: 12px; color: #cbd5e1;">$${item.current.toLocaleString()} / $${item.target.toLocaleString()}</td>
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

  const emailSubject = isTestRequest
    ? '[PennyWings Test] Budget & Goal Threshold Notification'
    : alerts.some((a) => a.status === 'exceeded')
      ? '⚠️ PennyWings Alert: Budget Exceeded'
      : '🎯 PennyWings Alert: Goal / Budget Threshold Update'

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${emailSubject}</title>
      </head>
      <body style="font-family: system-ui, -apple-system, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; padding: 24px; border: 1px solid #334155;">
          <h2 style="color: #38bdf8; margin-top: 0;">PennyWings Threshold Alert</h2>
          <p style="color: #94a3b8; line-height: 1.5;">
            ${
              isTestRequest
                ? 'This is a <strong>test notification</strong> from PennyWings via Resend to verify your email alert system configuration.'
                : 'Here is an automated summary of your budgets and financial goals that have met or are close to reaching their threshold limits:'
            }
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
            <tbody>
              ${alertRowsHtml}
            </tbody>
          </table>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #334155; text-align: center; color: #64748b; font-size: 12px;">
            PennyWings Personal Finance Tracker • Notification via Resend
          </div>
        </div>
      </body>
    </html>
  `

  // Send via Gmail SMTP (port 465/SSL — Supabase Edge Functions block 25 and 587)
  try {
    const transport = nodemailer.createTransport({
      auth: { pass: smtpPassword, user: smtpEmail },
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
    })

    await transport.sendMail({
      from: smtpEmail,
      html: htmlBody,
      subject: emailSubject,
      to: recipientEmail,
    })

    return http.jsonResponse({
      alertsCount: alerts.length,
      message: `Alert email successfully sent to ${recipientEmail}.`,
      recipient: recipientEmail,
      success: true,
    })
  } catch (err) {
    return http.jsonResponse(
      {
        error: err instanceof Error ? err.message : 'Error sending email via Gmail SMTP.',
      },
      500,
    )
  }
})
