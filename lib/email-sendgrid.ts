import sgMail from '@sendgrid/mail'

export interface EmailOptions {
  to: string
  subject: string
  text: string
  html?: string
}

export async function sendEmailWithSendGrid(options: EmailOptions): Promise<boolean> {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY || '')

    const msg = {
      to: options.to,
      from: process.env.SENDGRID_FROM_EMAIL || 'no-reply@bscampus.com',
      subject: options.subject,
      text: options.text,
      html: options.html
    }

    const response = await sgMail.send(msg)
    return response[0].statusCode === 202
  } catch (error) {
    console.error('[SendGrid Email] Error:', error)
    return false
  }
}
