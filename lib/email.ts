import { sendEmailWithResend } from './email-resend'
import { sendEmailWithSendGrid } from './email-sendgrid'

export interface EmailOptions {
  to: string
  subject: string
  text: string
  html?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (process.env.EMAIL_SERVICE === 'resend' && process.env.RESEND_API_KEY) {
    return await sendEmailWithResend(options)
  }
  
  if (process.env.EMAIL_SERVICE === 'sendgrid' && process.env.SENDGRID_API_KEY) {
    return await sendEmailWithSendGrid(options)
  }

  console.log('[Email] No email service configured. Using console log.')
  console.log('=================================')
  console.log(`To: ${options.to}`)
  console.log(`Subject: ${options.subject}`)
  console.log(`Text: ${options.text}`)
  console.log('=================================')
  return true
}
