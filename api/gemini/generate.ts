import { GoogleGenAI, Type } from "@google/genai";

// Lazily initialize Gemini client
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

export default async function handler(req: any, res: any) {
  // Set CORS headers if accessed from another host
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
    return res.status(405).json({ success: false, text: null, error: "Method Not Allowed" });
  }

  const { prompt, language = "id", mode = "auto" } = req.body;
  if (!prompt) {
    return res.status(400).json({ success: false, text: null, error: "Prompt is required" });
  }

  try {
    const ai = getGeminiClient();
    if (!ai) {
      console.log("No Gemini API key detected, serving rich mock template fallback.");
      
      const lowerPrompt = prompt.toLowerCase();
      if (lowerPrompt.includes("ringkas") || lowerPrompt.includes("summary") || lowerPrompt.includes("notulen") || lowerPrompt.includes("analisis")) {
        return res.json({
          success: true,
          fallback: true,
          text: `[FALLBACK SUMMARY] Dokumen resmi ini telah dianalisis secara cerdas oleh FORSDIG AI.\n\nBerikut ringkasan poin penting:\n1. Relevansi Administrasi Tinggi: Dokumen memenuhi aspek legalitas penomoran formal.\n2. Alur Koordinasi: Teridentifikasi tenggat respon dalam 3 hari kerja.\n3. Tindak Lanjut: Memerlukan peninjauan berkas lampiran pendukung oleh bagian terkait secara seksama.`,
          error: null
        });
      }
      
      return res.json({
        success: true,
        fallback: true,
        subject: `Draf Resmi: Terkait ${prompt.substring(0, 30)}`,
        opening: `Dengan hormat,\n\nSehubungan dengan koordinasi administrasi "${prompt}" yang disampaikan ke bagian sekretariat, perkenankan kami mengajukan pemberitahuan resmi ini.`,
        body: `Melalui surat ini kami sampaikan penjelasan detail bahwa jajaran pimpinan menyetujui program kerja dimaksud. Rincian detail penawaran, spesifikasi teknis, serta tanggal pelaksanaan akan dicocokkan otomatis ke sistem e-Office.`,
        closing: `Demikian pemberitahuan ini. Atas perhatian dan kerja sama yang baik, kami ucapkan terima kasih.`,
        signatoryRole: "Direktur Operasional",
        text: `Subjek: Draf Resmi: Terkait ${prompt.substring(0, 30)}\n\nDengan hormat,\n\nSehubungan dengan koordinasi administrasi "${prompt}" yang disampaikan ke bagian sekretariat...\n\nDemikian pemberitahuan ini. Atas perhatian dan kerja sama yang baik, kami ucapkan terima kasih.`,
        error: null
      });
    }

    const isLetterRequest = mode === "structured" || (mode === "auto" && !prompt.toLowerCase().includes("ringkas") && !prompt.toLowerCase().includes("summar") && !prompt.toLowerCase().includes("analis") && !prompt.toLowerCase().includes("notulen") && !prompt.toLowerCase().includes("disposisi"));

    if (isLetterRequest) {
      const promptText = `Anda adalah asisten administrasi kantor modern "FORSDIG Office" (e-Office Perusahaan). 
Tugas Anda adalah membuat isi surat resmi perusahaan berdasarkan instruksi user berikut ini: "${prompt}".
Tulis dalam Bahasa ${language === "id" ? "Indonesia yang baku, formal, sopan, dan profesional" : "English (formal and professional format)"}.

Respons Anda harus dalam format JSON dengan kunci exact:
{
  "subject": "Perihal surat resmi secara singkat dan lugas",
  "opening": "Salam pembuka (misalnya 'Dengan hormat,') dilanjutkan paragraf pembuka saja",
  "body": "Isi utama surat lengkap berisi rincian penawaran, permohonan, atau pemberitahuan dengan rapi",
  "closing": "Paragraf penutup, salam penutup (misalnya 'Hormat kami,'), nama perusahaan, dan baris kosong di atas tanda tangan",
  "signatoryRole": "Jabatan penandatangan, misal 'Direktur Utama', 'Manager HRD', 'Kepala Divisi Legal'"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              opening: { type: Type.STRING },
              body: { type: Type.STRING },
              closing: { type: Type.STRING },
              signatoryRole: { type: Type.STRING }
            },
            required: ["subject", "opening", "body", "closing", "signatoryRole"]
          }
        }
      });

      let text = response.text || "";
      text = text.trim();
      if (text.startsWith("```")) {
        text = text.replace(/^```(json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      }

      const parsed = JSON.parse(text);
      return res.json({
        success: true,
        text: `${parsed.opening}\n\n${parsed.body}\n\n${parsed.closing}`,
        error: null,
        ...parsed
      });

    } else {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt
      });

      const text = response.text || "";
      return res.json({
        success: true,
        text: text,
        error: null
      });
    }

  } catch (err: any) {
    console.error("Gemini Vercel Function Error:", err);
    return res.status(500).json({
      success: false,
      text: null,
      error: err.message || "Failed to generate AI content"
    });
  }
}
