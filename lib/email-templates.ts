export function generateResetCodeEmailTemplate(name: string, code: string): { text: string; html: string } {
  const text = `
Halo ${name},

Anda menerima email ini karena telah meminta reset password untuk akun BSCampus Anda.

Kode Verifikasi: ${code}

Kode ini berlaku selama 15 menit.

Jika Anda tidak meminta reset password, abaikan email ini.

Terima kasih,
Tim BSCampus
Politeknik Negeri Lhokseumawe
  `.trim()

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
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
      <p>Halo <strong>${name}</strong>,</p>
      
      <p>Anda menerima email ini karena telah meminta reset password untuk akun BSCampus Anda.</p>
      
      <div class="code-box">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">Kode Verifikasi Anda:</p>
        <div class="code">${code}</div>
        <p style="margin: 10px 0 0 0; font-size: 12px; color: #6b7280;">Kode berlaku selama 15 menit</p>
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
  `.trim()

  return { text, html }
}
