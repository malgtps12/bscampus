import { Resend } from 'resend'

export interface EmailOptions {
  to: string
  subject: string
  text: string
  html?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.warn('[Resend] No API key configured. Email not sent.')
      console.log(`To: ${options.to}, Subject: ${options.subject}`)
      return true
    }

    const resend = new Resend(apiKey)

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'no-reply@bscampus.com',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text.replace(/\n/g, '<br/>')
    })

    if (result.error) {
      console.error('[Resend Email] Error:', result.error)
      return false
    }

    console.log('[Resend Email] Sent successfully:', result.data?.id)
    return true
  } catch (error) {
    console.error('[Resend Email] Error:', error)
    return false
  }
}

export async function sendResetCodeEmail(
  email: string,
  resetCode: string
): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3b82f6; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .code-box { background: #f3f4f6; border: 2px dashed #3b82f6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
    .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e40af; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">BSCampus</h1>
      <p style="margin: 10px 0 0 0;">Reset Password</p>
    </div>
    
    <div class="content">
      <p>Halo,</p>
      
      <p>Anda menerima email ini karena telah meminta reset password untuk akun BSCampus Anda.</p>
      
      <div class="code-box">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">Kode Verifikasi Anda:</p>
        <div class="code">${resetCode}</div>
        <p style="margin: 10px 0 0 0; font-size: 12px; color: #6b7280;">Kode berlaku selama 10 menit</p>
      </div>
      
      <p>Masukkan kode ini di halaman reset password untuk melanjutkan.</p>
      
      <div class="warning">
        <strong>⚠️ Perhatian:</strong> Jika Anda tidak meminta reset password, abaikan email ini. Akun Anda tetap aman.
      </div>
    </div>
    
    <div class="footer">
      <p><strong>Tim BSCampus</strong></p>
      <p>Marketplace Mahasiswa Politeknik Negeri Lhokseumawe</p>
      <p style="margin-top: 10px;">Email otomatis - Jangan balas email ini</p>
    </div>
  </div>
</body>
</html>
`

  const text = `Kode Reset Password BSCampus

Kode verifikasi Anda: ${resetCode}

Kode ini berlaku selama 10 menit.

Jika Anda tidak meminta reset password, abaikan email ini.

---
Tim BSCampus
Marketplace Mahasiswa Politeknik Negeri Lhokseumawe`

  return await sendEmail({
    to: email,
    subject: 'Kode Reset Password - BSCampus',
    text: text,
    html: html
  })
}

export async function sendTransactionEmail(
  email: string,
  transactionId: string,
  productTitle: string,
  amount: number,
  status: string
): Promise<boolean> {
  const formattedAmount = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3b82f6; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; }
    .status-box { padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; font-weight: bold; }
    .status-pending { background: #fef3c7; color: #92400e; border: 2px solid #f59e0b; }
    .status-completed { background: #d1fae5; color: #065f46; border: 2px solid #10b981; }
    .status-transferred { background: #e0e7ff; color: #3730a3; border: 2px solid #6366f1; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">BSCampus</h1>
      <p style="margin: 10px 0 0 0;">Notifikasi Transaksi</p>
    </div>
    
    <div class="content">
      <p>Halo,</p>
      
      <p>Status transaksi Anda telah diperbarui:</p>
      
      <div>
        <p><strong>ID Transaksi:</strong> ${transactionId}</p>
        <p><strong>Produk:</strong> ${productTitle}</p>
        <p><strong>Jumlah:</strong> ${formattedAmount}</p>
      </div>
      
      <div class="status-box status-${status}">
        Status: ${status}
      </div>
      
      <p>Silakan login ke akun BSCampus Anda untuk melihat detail lengkap transaksi.</p>
    </div>
    
    <div class="footer">
      <p><strong>Tim BSCampus</strong></p>
      <p>Marketplace Mahasiswa Politeknik Negeri Lhokseumawe</p>
      <p style="margin-top: 10px;">Email otomatis - Jangan balas email ini</p>
    </div>
  </div>
</body>
</html>
`

  const text = `Notifikasi Transaksi BSCampus

Status transaksi Anda telah diperbarui:

ID Transaksi: ${transactionId}
Produk: ${productTitle}
Jumlah: ${formattedAmount}
Status: ${status}

Silakan login ke akun BSCampus Anda untuk melihat detail lengkap transaksi.

---
Tim BSCampus
Marketplace Mahasiswa Politeknik Negeri Lhokseumawe`

  return await sendEmail({
    to: email,
    subject: 'Notifikasi Transaksi - BSCampus',
    text: text,
    html: html
  })
}
