import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

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

  // E-mail Outgoing Logs Handler / Simulation Route
  app.post("/api/email/send", async (req, res) => {
    const { to, subject, body, attachmentName, smtpConfig } = req.body;
    if (!to || !subject) {
      return res.status(400).json({ error: "Recipient and subject are required" });
    }

    try {
      // Simulate SMTP delay with realistic tracing
      const serverHost = smtpConfig?.host || "smtp.gmail.com";
      const serverPort = smtpConfig?.port || 587;
      const serverUser = smtpConfig?.user || "noreply@forsdig-office.co.id";

      console.log(`[SMTP SIMULATION] Connecting to ${serverHost}:${serverPort} as ${serverUser}...`);
      console.log(`[SMTP SIMULATION] Dispatching outgoing corporate mail to: ${to}`);
      if (attachmentName) {
        console.log(`[SMTP SIMULATION] Attaching compiled PDF: ${attachmentName}`);
      }

      // Simulate a brief delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      return res.json({
        success: true,
        message: "Email digital berhasil terkirim melalui antrean SMTP!",
        log: {
          timestamp: new Date().toISOString(),
          recipient: to,
          subject: subject,
          smtpHost: serverHost,
          smtpUser: serverUser,
          attachments: attachmentName ? [attachmentName] : [],
          status: "DELIVERED"
        }
      });
    } catch (error: any) {
      console.error("SMTP Simulation error:", error);
      res.status(500).json({ error: "Gagal menghubungkan ke server SMTP" });
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
