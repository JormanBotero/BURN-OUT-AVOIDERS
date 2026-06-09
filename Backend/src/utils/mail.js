import nodemailer from 'nodemailer'

let transporter = null

function getTransporter() {
  if (transporter) return transporter

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  return transporter
}

function limpiarValor(valor) {
  if (!valor) return valor
  return valor.replace(/^["']|["']$/g, '').trim()
}

export async function sendVerificationCode(email, code) {
  const transport = getTransporter()

  if (!transport) {
    console.log(`[DEV] Código de verificación para ${email}: ${code}`)
    return
  }

  try {
    const from = limpiarValor(process.env.SMTP_FROM) || `"StudyMind" <${process.env.SMTP_USER}>`
    await transport.sendMail({
      from,
      to: email,
      subject: 'Verifica tu correo — StudyMind',
      html: `
        <div style="font-family:'DM Sans',sans-serif;max-width:480px;margin:0 auto">
          <div style="padding:32px 24px;background:linear-gradient(135deg,#4f3ef4,#6b5df6);border-radius:16px 16px 0 0;text-align:center">
            <h1 style="color:white;margin:0;font-size:1.5rem;letter-spacing:-0.02em">StudyMind</h1>
          </div>
          <div style="padding:32px 24px;background:#fff;border-radius:0 0 16px 16px">
            <p style="font-size:1rem;color:#12102a;margin:0 0 16px">Tu código de verificación es:</p>
            <div style="text-align:center;padding:20px;background:#f5f4fb;border-radius:12px;font-size:2.2rem;font-weight:700;letter-spacing:8px;color:#4f3ef4;font-family:monospace">${code}</div>
            <p style="font-size:0.85rem;color:#45426b;margin-top:20px">Este código expira en 10 minutos.</p>
          </div>
        </div>
      `,
    })
  } catch (err) {
    console.error('[SMTP ERROR] No se pudo enviar el correo:', err.message)
    console.error('[SMTP ERROR] Detalle:', err)
  }
}
