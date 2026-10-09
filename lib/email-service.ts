/**
 * Helper untuk mengirim email reset password menggunakan Nodemailer
 */

import nodemailer from 'nodemailer'

// Konfigurasi SMTP transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true untuk 465, false untuk port lain
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  })
}

/**
 * Kirim email kode reset password
 */
export async function sendResetCodeEmail(
  email: string,
  resetCode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter()

    const mailOptions = {
      from: `"${process.env.APP_NAME || 'BSCampus'}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Kode Reset Password - BSCampus',
      html: `
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
      `,
      text: `
Kode Reset Password BSCampus

Kode verifikasi Anda: ${resetCode}

Kode ini berlaku selama 10 menit.

Jika Anda tidak meminta reset password, abaikan email ini.

---
Tim BSCampus
Marketplace Mahasiswa Politeknik Negeri Lhokseumawe
      `
    }

    await transporter.sendMail(mailOptions)
    
    return { success: true }
  } catch (error: any) {
    console.error('[Email] Error sending reset code:', error)
    return { success: false, error: error.message }
  }
}
