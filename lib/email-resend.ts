import { Resend } from 'resend'

export interface EmailOptions {
  to: string
  subject: string
  text: string
  html?: string
}

export async function sendEmailWithResend(options: EmailOptions): Promise<boolean> {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY || '')

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'no-reply@bscampus.com',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    })

    if (result.error) {
      console.error('[Resend Email] Error:', result.error)
      return false
    }

    return true
  } catch (error) {
    console.error('[Resend Email] Error:', error)
    return false
  }
}
