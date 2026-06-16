import { Resend } from "resend";

// Lazily initialize Resend client
let resendClient: Resend | null = null;
function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key || key === "MY_RESEND_API_KEY" || key.trim() === "") {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(key);
  }
  return resendClient;
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { to, subject, body, attachmentName, letterData } = req.body;
  if (!to || !subject) {
    return res.status(400).json({ error: "Recipient and subject are required" });
  }

  const emailHtmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f8fafc;
      padding: 30px 15px;
      box-sizing: border-box;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      border: 1px solid #e2e8f0;
    }
    .header {
      background-color: #1e3a8a;
      padding: 24px 30px;
      text-align: left;
      border-bottom: 3px solid #3b82f6;
    }
    .header-logo {
      color: #ffffff;
      font-size: 20px;
      font-weight: bold;
      letter-spacing: 0.05em;
      margin: 0;
    }
    .header-sub {
      color: #93c5fd;
      font-size: 11px;
      margin-top: 4px;
      font-weight: bold;
      letter-spacing: 0.05em;
    }
    .content {
      padding: 30px;
    }
    .subject-title {
      font-size: 16px;
      font-weight: bold;
      color: #0f172a;
      margin: 0 0 20px 0;
      border-left: 4px solid #1e3a8a;
      padding-left: 12px;
    }
    .text-body {
      font-size: 13.5px;
      line-height: 1.625;
      color: #334155;
      white-space: pre-line;
      margin-bottom: 25px;
    }
    .metadata-box {
      background-color: #f8fafc;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 25px;
      border: 1px solid #eaebf0;
    }
    .metadata-title {
      font-size: 11px;
      font-weight: bold;
      color: #475569;
      text-transform: uppercase;
      margin: 0 0 12px 0;
      letter-spacing: 0.05em;
    }
    .meta-grid {
      width: 100%;
      border-collapse: collapse;
    }
    .meta-row {
      border-bottom: 1px solid #f1f5f9;
    }
    .meta-row:last-child {
      border-bottom: none;
    }
    .meta-label {
      padding: 8px 0;
      font-size: 12px;
      color: #64748b;
      width: 32%;
      font-weight: 500;
      text-align: left;
    }
    .meta-value {
      padding: 8px 0;
      font-size: 12px;
      color: #1e293b;
      font-weight: bold;
      text-align: left;
    }
    .meta-mono {
      font-family: monospace;
      color: #0f172a;
      background-color: #f1f5f9;
      padding: 2px 5px;
      border-radius: 4px;
    }
    .tte-badge {
      display: inline-block;
      background-color: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .footer {
      background-color: #f8fafc;
      padding: 20px 30px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 11px;
      color: #64748b;
      line-height: 1.5;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1 class="header-logo">PT. Foresyndo Global Indonesia</h1>
        <div class="header-sub">SISTEM KORESPONDENSI & ARSIP DIGITAL TERPADU</div>
      </div>
      <div class="content">
        <h2 class="subject-title">${subject}</h2>
        <div class="text-body">${body}</div>
        
        ${letterData ? `
        <div class="metadata-box">
          <div class="metadata-title">Sertifikasi & Kredensial TTE</div>
          <table class="meta-grid">
            <tr class="meta-row">
              <td class="meta-label">Nomor Surat</td>
              <td class="meta-value meta-mono">${letterData.letterNumber || '-'}</td>
            </tr>
            <tr class="meta-row">
              <td class="meta-label">Tanggal Surat</td>
              <td class="meta-value">${letterData.letterDate || '-'}</td>
            </tr>
            <tr class="meta-row">
              <td class="meta-label">Penerima</td>
              <td class="meta-value">${letterData.recipient || '-'} (${letterData.recipientInstitution || '-'})</td>
            </tr>
            <tr class="meta-row">
              <td class="meta-label">Penandatangan</td>
              <td class="meta-value">${letterData.signatory || '-'}</td>
            </tr>
            <tr class="meta-row">
              <td class="meta-label">Kode Verifikasi TTE</td>
              <td class="meta-value meta-mono">${letterData.verificationCode || '-'}</td>
            </tr>
            <tr class="meta-row">
              <td class="meta-label">Status Dokumen</td>
              <td class="meta-value">
                <span class="tte-badge">
                  ✓ TERKIRIM & RESERVED TTE
                </span>
              </td>
            </tr>
          </table>
        </div>
        ` : ''}
      </div>
      <div class="footer">
        <p class="footer-text">
          Pemberitahuan resmi ini dikirimkan secara otomatis oleh modul FGI Office Analytics Hub.<br>
          Gedung FGI Hub, Lt. 12, Jakarta Selatan, DKI Jakarta.<br>
          <em>Harap tidak membalas email ini secara langsung karena transmisi ini berjalan di bawah protokol otomatis.</em>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

  try {
    const resend = getResendClient();
    
    if (resend) {
      console.log(`[RESEND ENGINE] Transmitting email to ${to} via Vercel official Resend SMTP Gateway...`);
      const response = await resend.emails.send({
        from: "FGI Office <noreply@foresyndoglobalindonesia.my.id>",
        to: to,
        subject: subject,
        html: emailHtmlContent,
      });

      return res.json({
        success: true,
        deliveryMethod: "RESEND",
        message: `Surat resmi berhasil terkirim secara nyata ke ${to} via Resend Cloud Gateway!`,
        log: {
          timestamp: new Date().toISOString(),
          recipient: to,
          subject: subject,
          deliveryType: "Resend Official",
          attachments: attachmentName ? [attachmentName] : [],
          status: "DELIVERED"
        }
      });
    } else {
      console.log(`[RESEND SIMULATION] RESEND_API_KEY is not defined. Simulating delivery to ${to}...`);
      await new Promise((resolve) => setTimeout(resolve, 600));

      return res.json({
        success: true,
        deliveryMethod: "SIMULATION (Resend API Key Missing)",
        message: `Pemberitahuan terkirim (Mode Simulasi)! Konfigurasi 'RESEND_API_KEY' di panel secrets untuk mengaktifkan pengiriman email nyata.`,
        log: {
          timestamp: new Date().toISOString(),
          recipient: to,
          subject: subject,
          deliveryType: "Simulation",
          attachments: attachmentName ? [attachmentName] : [],
          status: "SIMULATED"
        }
      });
    }
  } catch (error: any) {
    console.error("Resend delivery failed:", error);
    res.status(500).json({ error: error.message || "Gagal menghubungkan ke Resend API Gateway" });
  }
}
