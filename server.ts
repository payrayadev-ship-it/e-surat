import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

// Lazily initialize Resend client so it doesn't crash on startup if key is missing
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

// Lazily initialize Gemini client so it doesn't crash on startup if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY" || key.trim() === "") {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Log incoming requests for audit transparency
  app.use((req, res, next) => {
    console.log(`[HTTP] ${req.method} ${req.url}`);
    next();
  });

  // REST API Endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // AI Generation Router
  app.post("/api/gemini/generate", async (req, res) => {
    const { prompt, language = "id" } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    try {
      const ai = getGeminiClient();
      if (!ai) {
        // Safe visual fallback if API Key is not set yet
        console.log("No Gemini API key detected, serving rich mock template response.");
        return res.json({
          fallback: true,
          subject: `Surat Penawaran / Permohonan: Terkait ${prompt.substring(0, 30)}`,
          opening: `Dengan hormat,\n\nSehubungan dengan informasi yang kami terima terkait rencana pengadaan barang/jasa, perkenankan kami dari FORSDIG OFFICE mengajukan rincian penawaran resmi ini kepada instansi Bapak/Ibu.`,
          body: `Melalui surat ini, kami bermaksud menawarkan layanan profesional kami yang disesuaikan untuk memenuhi kebutuhan organisasi Anda. Solusi yang kami tawarkan meliputi integrasi teknologi e-Office terbaru, otomatisasi surat-menyurat perusahaan secara digital, serta sistem pengarsipan yang andal. Kami berkomitmen untuk memberikan kualitas terbaik dengan dukungan teknis penuh selama masa implementasi berlangsung.\n\nAdapun rincian detail spesifikasi, harga, serta jadwal pelaksanaan dapat disesuaikan kembali melalui pertemuan lanjutan atau diskusi kesepakatan lebih lanjut.`,
          closing: `Demikian surat ini kami sampaikan. Kami sangat mengharap kerja sama yang baik dapat terjalin antara perusahaan kami dengan perusahaan/instansi Bapak/Ibu. Atas perhatian dan kesempatan yang diberikan, kami ucapkan terima kasih.`,
          signatoryRole: "Direktur Operasional"
        });
      }

      // Format responseSchema conforming to the standard Types
      const promptText = `Anda adalah asisten administrasi kantor modern "FORSDIG Office" (e-Office Perusahaan). 
Tugas Anda adalah membuat isi surat resmi perusahaan berdasarkan instruksi user berikut ini: "${prompt}".
Tulis dalam Bahasa ${language === "id" ? "Indonesia yang baku, formal, sopan, dan profesional" : "English (formal and professional format)"}.

PENTING: Anda harus mengembalikan respons yang valid sebagai JSON objek dengan kunci-kunci berikut (dan pastikan nilainya adalah string yang diformat dengan baik tanpa tag kode markdown penutup di dalam JSON):
{
  "subject": "Perihal surat resmi secara singkat dan lugas",
  "opening": "Salam pembuka (misalnya 'Dengan hormat,') dilanjutkan paragraf pembuka saja",
  "body": "Isi utama surat lengkap berisi rincian penawaran, permohonan, atau pemberitahuan dengan rapi",
  "closing": "Paragraf penutup, salam penutup (misalnya 'Hormat kami,'), nama perusahaan, dan baris kosong di atas tanda tangan",
  "signatoryRole": "Jabatan penandatangan, misal 'Direktur Utama', 'Manager HRD', 'Kepala Divisi Legal'"
}

Instruksi User: ${prompt}`;

      let response;
      try {
        console.log("[GEMINI] Initiating prompt execution with structured responseSchema...");
        response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: promptText,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                subject: {
                  type: Type.STRING,
                  description: "Perihal surat resmi secara singkat dan lugas"
                },
                opening: {
                  type: Type.STRING,
                  description: "Salam pembuka (misalnya 'Dengan hormat,') dilanjutkan paragraf pembuka saja"
                },
                body: {
                  type: Type.STRING,
                  description: "Isi utama surat lengkap berisi rincian penawaran, permohonan, atau pemberitahuan dengan rapi"
                },
                closing: {
                  type: Type.STRING,
                  description: "Paragraf penutup, salam penutup (misalnya 'Hormat kami,'), nama perusahaan, dan baris kosong di atas tanda tangan"
                },
                signatoryRole: {
                  type: Type.STRING,
                  description: "Jabatan penandatangan, misal 'Direktur Utama', 'Manager HRD', 'Kepala Divisi Legal'"
                }
              },
              required: ["subject", "opening", "body", "closing", "signatoryRole"]
            }
          },
        });
      } catch (e: any) {
        console.log("[GEMINI] Primary processor busy or failed, activating secondary query with structured schema...");
        try {
          response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: promptText,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  subject: {
                    type: Type.STRING,
                    description: "Perihal surat resmi secara singkat dan lugas"
                  },
                  opening: {
                    type: Type.STRING,
                    description: "Salam pembuka (misalnya 'Dengan hormat,') dilanjutkan paragraf pembuka saja"
                  },
                  body: {
                    type: Type.STRING,
                    description: "Isi utama surat lengkap berisi rincian penawaran, permohonan, atau pemberitahuan dengan rapi"
                  },
                  closing: {
                    type: Type.STRING,
                    description: "Paragraf penutup, salam penutup (misalnya 'Hormat kami,'), nama perusahaan, dan baris kosong di atas tanda tangan"
                  },
                  signatoryRole: {
                    type: Type.STRING,
                    description: "Jabatan penandatangan, misal 'Direktur Utama', 'Manager HRD', 'Kepala Divisi Legal'"
                  }
                },
                required: ["subject", "opening", "body", "closing", "signatoryRole"]
              }
            },
          });
        } catch (subE: any) {
          console.log("[GEMINI] Secondary processor busy, triggering standard offline templates...");
          
          // Provide a realistic programmatically custom fallback letter matching their prompt
          return res.json({
            fallback: true,
            subject: `Surat Terkait: ${prompt.substring(0, 50)}${prompt.length > 50 ? "..." : ""}`,
            opening: `Dengan hormat,\n\nSehubungan dengan permohonan dan kebutuhan koordinasi bertema "${prompt}" yang disampaikan ke bagian administrasi, kami dari FORSDIG OFFICE merilis draf rancangan surat resmi ini sebagai tindak lanjut komprehensif.`,
            body: `Melalui surat ini kami sampaikan bahwa seluruh jajaran koordinasi operasional di instansi kami menyambut baik rencana tersebut. Kami akan memfasilitasi kebutuhan yang diuraikan termasuk integrasi layanan sistem e-Office modern, pengawalan berkas digital, penataan dokumen kop resmi, serta peningkatan efisiensi alur administrasi.\n\nAdapun hal-hal teknis mengenai waktu pelaksanaan, rincian biaya penunjang, serta klausul penandatanganan e-Signature akan diatur lebih lanjut oleh tim penanggung jawab yang ditunjuk.`,
            closing: `Demikian pemberitahuan ini disampaikan. Atas kerja sama dan kepercayaan yang diberikan, kami mengucapkan terima kasih.`,
            signatoryRole: "Kepala Divisi Operasional"
          });
        }
      }

      let text = response?.text;
      if (!text) {
        throw new Error("No response body produced by Gemini AI");
      }

      // Safeguard against Markdown code blocks in JSON response
      text = text.trim();
      if (text.startsWith("```")) {
        text = text.replace(/^```(json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      }

      const parsed = JSON.parse(text);
      res.json(parsed);

    } catch (err: any) {
      console.error("Gemini route error:", err);
      res.status(500).json({ error: err.message || "Failed to generate AI letter content" });
    }
  });

  // E-mail Outgoing Logs Handler / Resend Dispatch Route
  app.post("/api/email/send", async (req, res) => {
    const { to, subject, body, attachmentName, letterData } = req.body;
    if (!to || !subject) {
      return res.status(400).json({ error: "Recipient and subject are required" });
    }

    // Build modern responsive corporate email template (HTML)
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
        console.log(`[RESEND ENGINE] Transmitting email to ${to} via official Resend SMTP Gateway...`);
        
        const response = await resend.emails.send({
          from: "FGI Office <noreply@foresyndoglobalindonesia.my.id>",
          to: to,
          subject: subject,
          html: emailHtmlContent,
        });

        console.log("[RESEND ENGINE] Dispatch success response data:", response);

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
        // Fallback simulation mode
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
  });

  // Vite development vs production compiler modes
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[FORSDIG SERVER] e-Office server successfully listening on port ${PORT}`);
    console.log(`[FORSDIG SERVER] Mode: ${process.env.NODE_ENV || "development"}`);
  });
}

startServer();
