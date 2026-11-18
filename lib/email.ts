/**
 * Pengirim email transaksional memakai Brevo REST API.
 * Tidak ada SDK tambahan: cukup fetch ke /v3/smtp/email.
 *
 * Environment:
 * - BREVO_API_KEY  (wajib)
 * - BREVO_FROM_EMAIL (opsional, format "Nama <email>" atau email saja)
 */

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

function getSender(): { name: string; email: string } {
  const raw = (process.env.BREVO_FROM_EMAIL || "BSCampus <no-reply@bscampus.com>").trim();
  const match = raw.match(/^(.*?)\s*<([^>]+)>$/);

  if (match) {
    return {
      name: match[1].trim() || "BSCampus",
      email: match[2].trim(),
    };
  }

  return { name: "BSCampus", email: raw };
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      // Jangan log isi email (bisa berisi kode reset) dan jangan berpura-pura sukses.
      console.error("[Brevo] BREVO_API_KEY belum dikonfigurasi - email tidak terkirim");
      return false;
    }

    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: getSender(),
        to: [{ email: options.to }],
        subject: options.subject,
        textContent: options.text,
        htmlContent: options.html || options.text.replace(/\n/g, "<br/>"),
      }),
    });

    if (!response.ok) {
      // Jangan log body respons karena bisa memuat detail akun/email.
      console.error(`[Brevo] Gagal mengirim email (status ${response.status})`);
      return false;
    }

    const result = (await response.json().catch(() => ({}))) as { messageId?: string };
    console.log("[Brevo] Email terkirim:", result.messageId ?? "tanpa messageId");
    return true;
  } catch (error) {
    console.error("[Brevo] Error:", error);
    return false;
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
`;

  const text = `Kode Reset Password BSCampus

Kode verifikasi Anda: ${resetCode}

Kode ini berlaku selama 10 menit.

Jika Anda tidak meminta reset password, abaikan email ini.

---
Tim BSCampus
Marketplace Mahasiswa Politeknik Negeri Lhokseumawe`;

  return await sendEmail({
    to: email,
    subject: "Kode Reset Password - BSCampus",
    text,
    html,
  });
}
