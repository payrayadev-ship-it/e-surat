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
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  const { contractText, action = "analyze", contractType = "custom", partyName = "" } = req.body;
  
  if (!contractText && action !== "draft") {
    return res.status(400).json({ success: false, error: "Isi teks kontrak atau deskripsi draf wajib diisi." });
  }

  try {
    const ai = getGeminiClient();
    if (!ai) {
      // High quality offline fallback depending on the contract theme / prompt
      console.log("No Gemini API key detected, serving rich legal template analysis fallback.");
      const textLower = (contractText || "").toLowerCase();
      
      let fallbackResult;
      if (textLower.includes("nda") || textLower.includes("confidential") || textLower.includes("kerahasiaan") || contractType === "nda") {
        fallbackResult = {
          summary: "Kontrak ini merupakan Perjanjian Kerahasiaan (Non-Disclosure Agreement / NDA) sepihak atau timbal balik untuk melindungi data sensitif, informasi hak milik, dan kekayaan intelektual antara PT Foresyndo Global Indonesia dengan mitra eksternal.",
          overallRiskLevel: "Medium",
          overallRiskExplanation: "Risiko berada pada tingkat menengah karena terdapat klausul ganti rugi yang tidak terbatas dan masa berlaku perlindungan kerahasiaan informasi yang bersifat selamanya (perpetual) tanpa batasan waktu yang wajar.",
          keyClauses: [
            {
              title: "Definisi Informasi Rahasia (Confidential Information)",
              originalText: "Semua informasi yang diungkapkan baik secara lisan, tertulis, maupun digital yang diidentifikasi sebagai rahasia atau secara wajar dianggap sebagai rahasia dagang.",
              riskRating: "Low",
              simpleExplanation: "Klausul ini mengunci semua berkas, data keuangan, dan percakapan bisnis yang kita berikan agar tidak boleh disebarluaskan ke pihak luar.",
              recommendation: "Klausul sudah cukup aman. Pastikan mencantumkan penandaan fisik 'RAHASIA' (Confidential Stamp) pada dokumen penting."
            },
            {
              title: "Batasan Penggunaan Informasi",
              originalText: "Penerima informasi hanya boleh menggunakan Informasi Rahasia untuk tujuan evaluasi kerja sama bisnis bersama saja.",
              riskRating: "Low",
              simpleExplanation: "Pihak kedua dilarang keras memakai rahasia kita untuk kepentingan pribadi mereka atau membuat produk tandingan.",
              recommendation: "Klausul standar dan aman untuk melindungi integritas bisnis."
            },
            {
              title: "Ganti Rugi & Penalti Pelanggaran",
              originalText: "Pihak Penerima wajib mengganti seluruh kerugian finansial, reputasi, dan biaya hukum akibat kebocoran informasi tanpa batasan nilai.",
              riskRating: "High",
              simpleExplanation: "Jika terjadi kelalaian tidak disengaja oleh staf kita, kita harus membayar denda tanpa batas maksimal, yang bisa membangkrutkan perusahaan.",
              recommendation: "Negosiasikan batas maksimal tanggung jawab (liability cap) senilai maksimal nilai kontrak aktual atau nilai ganti rugi tetap yang disepakati (misal: Rp 100.000.000)."
            }
          ],
          missingClauses: [
            {
              clauseName: "Pilihan Hukum & Penyelesaian Sengketa (Governing Law & Dispute Resolution)",
              reason: "Jika ada kebocoran informasi, tidak ada kejelasan pengadilan mana yang berwenang menyelesaikan sengketa, yang bisa berujung pada gugatan di yurisdiksi pihak lain.",
              recommendedDraft: "Perjanjian ini diatur oleh Hukum Negara Republik Indonesia. Setiap perselisihan yang timbul dari Perjanjian ini akan diselesaikan secara eksklusif melalui arbitrase di Badan Arbitrase Nasional Indonesia (BANI) Jakarta."
            },
            {
              clauseName: "Klausul Force Majeure (Keadaan Memaksa)",
              reason: "Menghindari wanprestasi jika kerahasiaan bocor akibat bencana alam, serangan siber pihak ketiga di luar kendali wajar, atau kegagalan infrastruktur negara.",
              recommendedDraft: "Tidak ada Pihak yang bertanggung jawab atas kegagalan memenuhi kewajibannya apabila kegagalan tersebut disebabkan oleh Keadaan Memaksa (Force Majeure) termasuk bencana alam, perang, sabotase siber masif, atau kebijakan pemerintah."
            }
          ],
          obligationsAndDeadlines: [
            {
              party: "Penerima Informasi (Mitra)",
              obligationText: "Menjaga kerahasiaan informasi dengan standar proteksi keamanan yang sama dengan dokumen internal mereka sendiri.",
              deadline: "Selama perjanjian berlangsung dan 5 tahun setelah pengakhiran",
              consequence: "Kewajiban ganti rugi penuh dan penghentian seketika hubungan bisnis."
            },
            {
              party: "Pengungkap Informasi (FGI / Kita)",
              obligationText: "Menandai secara jelas setiap berkas digital atau dokumen fisik yang dikategorikan rahasia sebelum dikirim.",
              deadline: "Pada saat pengungkapan pertama kali",
              consequence: "Jika tidak ditandai, sulit membuktikan secara hukum bahwa berkas tersebut bersifat rahasia."
            }
          ],
          customDraft: action === "draft" ? `# SURAT PERJANJIAN KERAHASIAN (NON-DISCLOSURE AGREEMENT)

**Nomor: NDA/FGI/2026/${Math.floor(Math.random() * 900 + 100)}**

Perjanjian Kerahasiaan ini ("Perjanjian") dibuat pada hari ini, tanggal **${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}**, oleh dan antara:

1. **PT. Foresyndo Global Indonesia**, sebuah perseroan terbatas yang didirikan berdasarkan hukum Indonesia, berkedudukan di Jakarta (selanjutnya disebut "**FGI**" atau "**Pihak Pengungkap**").
2. **${partyName || "PT. Mitra Sukses Digital"}**, sebuah badan usaha berkedudukan di Indonesia (selanjutnya disebut "**Pihak Penerima**").

### KLAUSUL UTAMA PERJANJIAN:

**Pasal 1 - Definisi Informasi Rahasia**
Informasi Rahasia mencakup segala data teknis, keuangan, strategi pemasaran, daftar klien, algoritma e-Office, kode verifikasi TTE, dan kekayaan intelektual milik Pihak Pengungkap yang diberikan kepada Pihak Penerima.

**Pasal 2 - Kewajiban Menjaga Kerahasiaan**
Pihak Penerima wajib menjaga kerahasiaan Informasi Rahasia dengan tingkat kehati-hatian yang tidak kurang dari standar yang wajar, serta tidak menggunakannya untuk tujuan apa pun selain pelaksanaan evaluasi kerja sama antara para pihak.

**Pasal 3 - Batasan Waktu & Retensi Berkas**
Kewajiban ini tetap mengikat kedua belah pihak selama jangka waktu **5 (lima) tahun** terhitung sejak Perjanjian ini ditandatangani, meskipun kerja sama operasional telah berakhir.

**Pasal 4 - Penyelesaian Sengketa**
Perjanjian ini diatur oleh hukum Negara Republik Indonesia. Segala perselisihan yang timbul akan diselesaikan secara mufakat, dan apabila tidak tercapai kesepakatan, akan diajukan ke Pengadilan Negeri Jakarta Selatan.` : ""
        };
      } else if (textLower.includes("spk") || textLower.includes("perintah kerja") || textLower.includes("kerja sama") || contractType === "spk" || contractType === "partnership") {
        fallbackResult = {
          summary: "Dokumen ini merupakan kontrak kemitraan komersial / Perjanjian Kerja Sama (PKS) atau Surat Perintah Kerja (SPK) untuk pengadaan modul e-Office, lisensi sistem, dan pemeliharaan server digital.",
          overallRiskLevel: "High",
          overallRiskExplanation: "Risiko tinggi karena tidak adanya klausul penalti denda keterlambatan (liquidated damages) untuk pihak pelaksana, serta pasal penyesuaian biaya (price adjustment clause) yang tidak menguntungkan FGI.",
          keyClauses: [
            {
              title: "Ruang Lingkup Pekerjaan & Deliverables",
              originalText: "Penyedia jasa wajib menyelesaikan seluruh implementasi sistem e-Office, integrasi API, sinkronisasi QR Code, dan database digital.",
              riskRating: "Low",
              simpleExplanation: "Klausul ini mengunci agar penyedia jasa tidak melarikan diri sebelum aplikasi benar-benar terpasang dan berfungsi dengan baik.",
              recommendation: "Tambahkan lampiran matriks spesifikasi teknis (SLA) secara rinci yang disetujui bersama agar tidak ada perselisihan fitur."
            },
            {
              title: "Termin Pembayaran (Payment Milestones)",
              originalText: "Pembayaran dilakukan 100% lunas di muka setelah penandatanganan Surat Perintah Kerja oleh kedua belah pihak.",
              riskRating: "High",
              simpleExplanation: "Sistem bayar penuh di depan sangat berisiko. Jika penyedia jasa berkinerja buruk atau terlambat menyelesaikan pekerjaan, kita kehilangan daya tawar untuk menuntut perbaikan.",
              recommendation: "Ubah termin pembayaran menjadi berbasis pencapaian (milestone): Down Payment 30%, Tahap Pengujian UAT 40%, dan Pelunasan 30% setelah Berita Acara Serah Terima (BAST)."
            },
            {
              title: "Sanksi & Denda Keterlambatan",
              originalText: "Keterlambatan penyelesaian pekerjaan oleh penyedia jasa akan dikenakan denda sesuai peraturan internal yang berlaku.",
              riskRating: "Medium",
              simpleExplanation: "Klausul denda keterlambatan ini terlalu abstrak karena tidak menyebutkan persentase denda harian secara nominal yang jelas.",
              recommendation: "Tetapkan nilai denda keterlambatan standar yang mengikat sebesar 1‰ (satu permil) dari nilai kontrak untuk setiap hari keterlambatan, dengan batas maksimum denda 5%."
            }
          ],
          missingClauses: [
            {
              clauseName: "Hak Kekayaan Intelektual (Intellectual Property Rights)",
              reason: "Tanpa klausul HKI, penyedia jasa dapat mengeklaim hak cipta atas database atau integrasi kode e-Office milik FGI yang dikembangkan selama masa kontrak.",
              recommendedDraft: "Seluruh Hak Kekayaan Intelektual, source code, data penomoran surat, dan dokumentasi sistem yang dikembangkan dalam rangka pemenuhan Kontrak ini sepenuhnya menjadi hak milik eksklusif PT Foresyndo Global Indonesia."
            },
            {
              clauseName: "Klausul Jaminan Layanan (Warranty & Maintenance)",
              reason: "Menjamin ketersediaan bantuan penanganan bug, error, atau kegagalan sistem setelah serah terima tanpa biaya tambahan.",
              recommendedDraft: "Penyedia Jasa wajib memberikan jaminan garansi fungsionalitas sistem (Warranty Period) bebas dari cacat program (bug/error) selama minimal 12 (dua belas) bulan terhitung sejak tanggal penandatanganan Berita Acara Serah Terima (BAST)."
            }
          ],
          obligationsAndDeadlines: [
            {
              party: "Penyedia Jasa (Mitra)",
              obligationText: "Menyerahkan draf rancangan sistem, skema database, dan dokumen analisis teknis.",
              deadline: "7 Hari kalender sejak SPK diterbitkan",
              consequence: "Peringatan tertulis pertama dan penangguhan termin uang muka."
            },
            {
              party: "PT Foresyndo Global Indonesia",
              obligationText: "Menyediakan akses infrastruktur server lokal, kredensial sandbox database, dan data master pegawai.",
              deadline: "3 Hari kerja setelah kick-off meeting",
              consequence: "Penambahan waktu pengerjaan (extend deadline) bagi mitra jika terjadi keterlambatan dari kita."
            }
          ],
          customDraft: action === "draft" ? `# SURAT PERINTAH KERJA & KERJA SAMA (PKS)

**Nomor: PKS/FGI/IT-OFFICE/2026/${Math.floor(Math.random() * 900 + 100)}**

Perjanjian Kerja Sama Pengadaan Sistem ini dibuat dan disepakati oleh pihak di bawah ini:

1. **PT. Foresyndo Global Indonesia**, diwakili oleh **Ir. Joko Sutrisno, M.T.** selaku Direktur, bertindak untuk dan atas nama PT. Foresyndo Global Indonesia (disebut "**FGI**" atau "**Pihak Pertama**").
2. **${partyName || "PT. Sinergi Integra Solusindo"}**, diwakili oleh perwakilan resminya selaku Penyedia Solusi TI (disebut "**Penyedia Jasa**" atau "**Pihak Kedua**").

### KETENTUAN DAN PASAL UTAMA:

**Pasal 1 - Lingkup Pekerjaan & Spesifikasi**
Pihak Kedua berkewajiban membangun, menguji, mengonfigurasi, dan melakukan go-live sistem korespondensi digital terintegrasi e-Office dengan standar TTE (Tanda Tangan Elektronik) QR Code tersertifikasi dan sinkronisasi arsip server cloud.

**Pasal 2 - Harga Kontrak & Pajak**
Total biaya pengadaan adalah sebesar **Rp 125.000.000 (Seratus Dua Puluh Lima Juta Rupiah)** yang sudah termasuk pajak pertambahan nilai (PPN) sesuai regulasi yang berlaku.

**Pasal 3 - Hak Cipta & Source Code**
Pihak Kedua menjamin bahwa seluruh source code sistem yang diserahkan bebas dari sengketa paten pihak ketiga, dan seluruh hak cipta penyesuaian khusus e-Office berpindah kepemilikannya ke Pihak Pertama secara penuh sejak BAST.

**Pasal 4 - Garansi & Dukungan Teknis**
Pihak Kedua memberikan garansi fungsionalitas penuh selama **365 (tiga ratus enam puluh lima) hari** pasca serah terima berkas, yang meliputi penanganan downtime server dan perbaikan bug minor.` : ""
        };
      } else {
        fallbackResult = {
          summary: "Kontrak ini dianalisis sebagai perjanjian hukum umum bisnis (General Corporate Agreement) yang mengatur hak, kewajiban, tata cara komersial, dan batasan tanggung jawab hukum para pihak.",
          overallRiskLevel: "Medium",
          overallRiskExplanation: "Risiko moderat karena bahasa hukum yang digunakan cukup standar, namun klausul penyelesaian sengketa (Arbitration vs Litigation) and ganti rugi pihak ketiga (indemnification) membutuhkan penajaman bahasa agar tidak merugikan kepentingan operasional.",
          keyClauses: [
            {
              title: "Kewajiban Pokok Para Pihak",
              originalText: contractText.substring(0, Math.min(contractText.length, 120)) + (contractText.length > 120 ? "..." : ""),
              riskRating: "Low",
              simpleExplanation: "Ketentuan ini merupakan jantung kontrak yang menjelaskan apa yang harus diserahkan oleh masing-masing pihak untuk kelangsungan transaksi.",
              recommendation: "Pastikan seluruh janji tertulis dan jadwal pengiriman selaras dengan kemampuan riil di lapangan."
            },
            {
              title: "Ketentuan Pengakhiran Perjanjian (Termination)",
              originalText: "Perjanjian ini dapat diakhiri sewaktu-waktu oleh salah satu pihak dengan pemberitahuan tertulis sebelumnya.",
              riskRating: "Medium",
              simpleExplanation: "Bahasa ini kurang spesifik. Jika diakhiri sepihak di tengah jalan secara mendadak tanpa kompensasi biaya yang sudah keluar, perusahaan bisa mengalami kerugian investasi.",
              recommendation: "Tambahkan syarat jangka waktu pemberitahuan minimal (misalnya: 30 hari kalender) dan penyelesaian kewajiban pembayaran tertunggak secara proporsional."
            }
          ],
          missingClauses: [
            {
              clauseName: "Klausul Kerahasiaan Informasi Terkait (Confidentiality)",
              reason: "Transaksi bisnis ini melibatkan pertukaran informasi internal yang sensitif. Tanpa ini, rahasia korporasi bisa disebarluaskan secara legal.",
              recommendedDraft: "Para Pihak sepakat untuk menjaga kerahasiaan seluruh informasi komersial, rahasia dagang, serta dokumen operasional yang diperoleh dalam rangka pelaksanaan Perjanjian ini selama jangka waktu hubungan kerja sama dan 3 (tiga) tahun setelahnya."
            }
          ],
          obligationsAndDeadlines: [
            {
              party: "Pihak Pertama",
              obligationText: "Melakukan peninjauan hasil kerja dan menyetujui invoice administrasi.",
              deadline: "5 Hari kerja setelah penyerahan laporan kemajuan",
              consequence: "Penundaan jadwal pekerjaan atau denda bunga pembayaran."
            },
            {
              party: "Pihak Kedua",
              obligationText: "Menyerahkan dokumen kerja, bukti kepatuhan legalitas, dan berkas transaksi resmi.",
              deadline: "Sesuai jadwal kerja di lampiran kontrak",
              consequence: "Hak penghentian kontrak sementara oleh Pihak Pertama."
            }
          ],
          customDraft: action === "draft" ? `# SURAT PERJANJIAN KERJA SAMA UMUM (MEMORANDUM OF UNDERSTANDING)

**Nomor: MOU/FGI/GEN/2026/${Math.floor(Math.random() * 900 + 100)}**

Perjanjian ini dibuat dan disepakati oleh dan antara:

1. **PT. Foresyndo Global Indonesia** ("**Pihak Pertama**")
2. **${partyName || "Mitra Kerja Sama Strategis"}** ("**Pihak Kedua**")

### KETENTUAN DAN MAKSUD KERJA SAMA:

**Pasal 1 - Maksud & Tujuan**
Tujuan Perjanjian ini adalah untuk menjalin kemitraan strategis yang saling menguntungkan dalam rangka optimalisasi manajemen korespondensi e-Office, pemanfaatan sumber daya bersama, serta peningkatan efisiensi operasional usaha.

**Pasal 2 - Hak & Kewajiban**
Para pihak saling berkoordinasi, memberikan informasi yang akurat, serta memfasilitasi kebutuhan logistik administrasi demi kelancaran agenda kerja sama yang disetujui.

**Pasal 3 - Biaya & Pembagian Hasil**
Setiap pengeluaran biaya finansial yang timbul untuk implementasi proyek akan dibahas, disetujui secara tertulis, dan dituangkan dalam adendum tersendiri yang tidak terpisahkan dari perjanjian ini.` : ""
        };
      }

      return res.json({
        success: true,
        fallback: true,
        ...fallbackResult,
        error: null
      });
    }

    // If Gemini API Key is active, let's construct highly structured prompt
    console.log(`[GEMINI CONTRACT] Generating AI response for action: ${action}, type: ${contractType}`);
    
    const promptText = `Anda adalah penasihat hukum perusahaan profesional (Corporate Legal Advisor) dan analis kontrak digital senior untuk "PT Foresyndo Global Indonesia" (FGI).
Tugas Anda adalah melakukan analisis, pembedahan risiko, penulisan klausul, atau penyusunan draf kontrak hukum berdasarkan instruksi berikut ini:

PILIHAN TINDAKAN: "${action}" (Tindakan ini bisa berupa 'analyze' untuk menganalisis, 'explain' untuk menjelaskan secara awam, atau 'draft' untuk membuat draf baru/revisi).
KATEGORI KONTRAK: "${contractType}" (nda, spk, partnership, atau custom).
NAMA MITRA JIKA ADA: "${partyName}".

BERIKUT ADALAH TEKS KONTRAK ATAU PETUNJUK USER:
"""
${contractText || `Buat draf kontrak baru dengan kategori ${contractType} antara PT Foresyndo Global Indonesia dengan mitra bernama ${partyName}`}
"""

Tulis seluruh hasil analisis dan klausul hukum dalam Bahasa Indonesia yang baku, formal, kokoh, dan akurat secara regulasi hukum perdata/dagang Indonesia.

Respons Anda harus berupa valid JSON objek dengan struktur exact sebagai berikut:
{
  "summary": "Ringkasan tingkat tinggi kontrak ini dalam 2-3 kalimat yang padat dan jelas.",
  "overallRiskLevel": "Tingkat risiko global kontrak: 'Low', 'Medium', 'High', atau 'Critical'.",
  "overallRiskExplanation": "Alasan penentuan tingkat risiko global tersebut berdasarkan analisis hukum objektif.",
  "keyClauses": [
    {
      "title": "Nama Klausul (misalnya: Ganti Rugi, Kewajiban Kerahasiaan, Pengakhiran Sepihak)",
      "originalText": "Kutipan teks asli dari kontrak atau ringkasannya jika teks tidak ada.",
      "riskRating": "Skala risiko klausul ini: 'Low', 'Medium', 'High', atau 'None'.",
      "simpleExplanation": "Penjelasan makna hukum klausul tersebut dalam bahasa awam yang sangat mudah dipahami oleh direktur atau staf operasional non-hukum.",
      "recommendation": "Rekomendasi tindakan hukum konkret untuk revisi atau amandemen klausul ini demi keamanan perusahaan."
    }
  ],
  "missingClauses": [
    {
      "clauseName": "Nama klausul krusial yang hilang (misalnya: Force Majeure, Pilihan Hukum, Ganti Rugi)",
      "reason": "Alasan detail mengapa absennya klausul ini berbahaya bagi posisi hukum FGI.",
      "recommendedDraft": "Teks lengkap draf klausul hukum siap pakai yang profesional dalam Bahasa Indonesia."
    }
  ],
  "obligationsAndDeadlines": [
    {
      "party": "Pihak penanggung jawab (misalnya: FGI, Pihak Kedua, atau Kedua Belah Pihak)",
      "obligationText": "Deskripsi kewajiban atau tindakan hukum yang harus dilakukan.",
      "deadline": "Tenggat waktu atau pemicu kewajiban (misal: 14 hari sejak pembayaran, atau sebelum go-live).",
      "consequence": "Sanksi atau konsekuensi kelalaian/kegagalan pemenuhan."
    }
  ],
  "customDraft": "Teks draf kontrak hukum lengkap, rapi, dan formal berstruktur pasal-pasal jika diminta melakukan draf/rewrite (format Markdown). Jika tindakan hanya analisis standar, isi dengan string kosong."
}

Harap pastikan output Anda mematuhi skema JSON di atas dengan sempurna. Jangan menyisipkan teks pengantar atau teks penutup di luar objek JSON tersebut.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            overallRiskLevel: { type: Type.STRING },
            overallRiskExplanation: { type: Type.STRING },
            keyClauses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  originalText: { type: Type.STRING },
                  riskRating: { type: Type.STRING },
                  simpleExplanation: { type: Type.STRING },
                  recommendation: { type: Type.STRING }
                },
                required: ["title", "originalText", "riskRating", "simpleExplanation", "recommendation"]
              }
            },
            missingClauses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  clauseName: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  recommendedDraft: { type: Type.STRING }
                },
                required: ["clauseName", "reason", "recommendedDraft"]
              }
            },
            obligationsAndDeadlines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  party: { type: Type.STRING },
                  obligationText: { type: Type.STRING },
                  deadline: { type: Type.STRING },
                  consequence: { type: Type.STRING }
                },
                required: ["party", "obligationText", "deadline", "consequence"]
              }
            },
            customDraft: { type: Type.STRING }
          },
          required: ["summary", "overallRiskLevel", "overallRiskExplanation", "keyClauses", "missingClauses", "obligationsAndDeadlines", "customDraft"]
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
      ...parsed,
      error: null
    });

  } catch (err: any) {
    console.error("AI Contract Analysis API Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Gagal memproses analisis kontrak hukum menggunakan AI"
    });
  }
}
