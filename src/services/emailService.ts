import { supabase } from '@/lib/supabase'
import { AppError } from '@/lib/errors'

export type SendEmailResult = {
  success: boolean
  message: string
  alertsCount?: number
  recipient?: string
  emailId?: string
}

export const sendThresholdAlertEmail = async (
  isTest = false,
): Promise<SendEmailResult> => {
  const { data, error } = await supabase.functions.invoke('send-alert-email', {
    body: { test: isTest },
  })

  if (error) {
    let errorMsg = 'Failed to send alert email notification.'
    if (error.context instanceof Response) {
      try {
        const body = await error.context.json()
        if (body?.error) errorMsg = body.error
      } catch {
        // use default fallback
      }
    }
    throw new AppError(errorMsg, { cause: error })
  }

  return data as SendEmailResult
}
