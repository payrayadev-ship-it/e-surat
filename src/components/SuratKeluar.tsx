import React, { useState, useRef, useEffect } from "react";
import { Plus, Search, FileText, Bot, Send, Check, ShieldCheck, Signature, Sparkles, Printer, UserCheck, Eye, RefreshCw, X, Edit3, QrCode, Award, ShieldAlert, CheckCircle2, Download, LayoutTemplate } from "lucide-react";
import { LetterOut, UserRole, UserProfile, CompanySetting } from "../types";
import { generateLetterNumber, injectTemplateVariables, generateVerificationQR } from "../utils";
import { jsPDF } from "jspdf";
import RichTextEditor from "./RichTextEditor";
import FgiLogo from "./FgiLogo";
import { DEFAULT_LOGO_BASE64 } from "../assets/logoBase64";

interface SuratKeluarProps {
  letters: LetterOut[];
  currentRole: UserRole;
  currentUser: UserProfile;
  companySetting: CompanySetting;
  onAddLetter: (letter: Omit<LetterOut, "id" | "createdAt">) => void;
  onUpdateStatus: (letterId: string, status: LetterOut["status"], note?: string) => void;
}

const TEMPLATES = [
  {
    id: "tpl_undangan",
    name: "Surat Undangan Rapat Kooperasi",
    subject: "Undangan Rapat Forum Bisnis Bulanan",
    content: `Dengan hormat,

Sehubungan dengan rencana pelaksanaan agenda evaluasi kuartal perusahaan, bersama surat ini kami bermaksud untuk mengundang Bapak/Ibu {{nama_penerima}} selaku {{jabatan}} {{alamat}} untuk menghadiri sidang rapat koordinasi.

Adapun rincian pelaksanaan rapat draf akan diselenggarakan pada:
Hari/Tanggal: Senin, 22 Juni 2026
Waktu: 10:00 - 12:30 WIB
Tempat: Ruang Meeting Utama 18, Maspion Plaza, Jakarta Utara

Agenda utama kita adalah membahas efisiensi operasional dan optimalisasi manajemen data administrasi kantor modern secara terpadu.

Mengingat pentingnya kontribusi diskusi ini, kami sangat mengharapkan kehadiran Bapak/Ibu tepat pada waktunya.

Demikian surat undangan ini kami sampaikan, atas perhatian dan kehadirannya kami ucapkan terima kasih.`
  },
  {
    id: "tpl_penawaran",
    name: "Surat Penawaran Jasa Teknologi",
    subject: "Penawaran Layanan Transformasi Digital e-Office",
    content: `Dengan hormat,

Perkenalkan kami dari PT. Foresyndo Global Indonesia, perusahaan inovator utama pada penyempurnaan sistem informasi korporat. Berselang dengan transisi bisnis digital nasional, kami bermaksud menawarkan kemitraan strategis kepada {{nama_penerima}} selaku {{jabatan}} {{alamat}}.

Kami menawarkan sistem administrasi e-Office FORSDIG yang handal untuk mengelola surat masuk, disposisi elektronik cepat, memo internal, dan tanda tangan digital terenkripsi QR Code dalam satu ekosistem cloud.

Berikut parameter paket layanan utama kami:
1. Implementasi Firestore Cloud Database - SLA 99.9%
2. Custom AI Writing assistant powered by Google Gemini
3. Multi-role access control (RBAC audit trail)

Bersama surat ini kami sertakan katalog biaya instalasi awal gratis untuk korporat perintis. Kami siap menjadwalkan pertemuan lanjutan di kantor Bapak/Ibu guna merinci rincian proposal lebih lanjut.

Demikian penawaran ini kami sampaikan. Besar harapan kami untuk dapat menjalin sinergi yang produktif di era digital.`
  },
  {
    id: "tpl_tugas",
    name: "Surat Perintah Kerja / Tugas",
    subject: "Surat Perintah Tugas Implementasi Sistem IT",
    content: `Dengan hormat,

Berdasarkan hasil kesepakatan Direksi tentang rencana deployment perangkat lunak, dengan ini Direktur Utama memberikan tugas khusus kepada:

Nama Penerima: {{nama_penerima}}
Jabatan: {{jabatan}}
Lokasi Tugas: {{alamat}}

Untuk dapat melaksanakan pengawasan, tuning, instalasi database server lokal, serta melatih jajaran direksi dalam mengoperasikan aplikasi FORSDIG OFFICE secara optimal.

Surat tugas ini berlaku sejak tanggal ditetapkan s.d selesainya seluruh rangkaian sosialisasi user.

Diharapkan seluruh rekan kerja yang ditugaskan dapat mengemban tanggung jawab ini dengan penuh etika, profesionalisme, dan integritas.`
  },
  {
    id: "tpl_permohonan",
    name: "Surat Permohonan Audiensi Kemitraan",
    subject: "Permohonan Penjadwalan Audiensi & Kemitraan Strategis",
    content: `Dengan hormat,

Seiring dengan perkembangan teknologi informasi dan manajemen tata kelola administrasi modern, kami mendoakan semoga Bapak/Ibu {{nama_penerima}} senantiasa dalam keadaan sehat dan sukses memimpin {{alamat}}.

Dalam rangka mendukung percepatan transformasi digital instansi pemerintahan serta efisiensi manajemen persuratan, bersama surat ini kami mengajukan permohonan penjadwalan audiensi singkat bersama Bapak/Ibu selaku {{jabatan}}.

Tujuan utama dari permohonan audiensi ini adalah:
1. Menyerahkan draf proposal pemanfaatan e-Sign QR Code.
2. Memaparkan sistem kendali disposisi berbasis cloud.
3. Mendapatkan saran dan arahan pengembangan kebijakan sistem informasi terintegrasi.

Sebagai bahan pertimbangan awal, kami lampirkan pula profil profil ringkas sistem e-Office FORSDIG pada berkas terpisah. 

Besar harapan kami Bapak/Ibu berkenan memberikan kesempatan pertemuan langsung pada waktu yang disepakati. Atas perhatian dan izin yang diberikan, kami ucapkan terima kasih.`
  },
  {
    id: "tpl_pemberitahuan",
    name: "Surat Pemberitahuan Cuti Bersama",
    subject: "Pemberitahuan Pelaksanaan Cuti Bersama & Libur Nasional Hari Raya",
    content: `Dengan hormat,

Merujuk pada Keputusan Bersama Menteri Tenaga Kerja tentang Hari Libur Nasional dan Cuti Bersama tahun 2026, bersama surat ini manajemen bermaksud menginformasikan jadwal libur operasional perusahaan kepada seluruh jajaran direksi, staf, serta Bapak/Ibu {{nama_penerima}} selaku {{jabatan}} {{alamat}}.

Berikut rincian pengaturan pelaksanaan libur bersama:
• Libur Operasional: 29 Juni s.d. 1 Juli 2026
• Kembali Bekerja: Kamis, 2 Juli 2026

Selama masa libur berlangsung, seluruh sistem persuratan digital e-Office FORSDIG tetap aktif memproses registrasi surat masuk secara otomatis. Bagi korespondensi yang bersifat darurat atau mendesak, silakan menghubungi narahubung support divisi umum.

Kami mengimbau kepada seluruh staf untuk memastikan kelengkapan tugas serta mengunci peralatan elektronik ruang kerja sebelum libur dimulai.

Selamat menikmati libur bersama keluarga, semoga kita kembali beraktivitas dengan produktivitas tinggi. Terima kasih.`
  },
  {
    id: "tpl_sk_pengangkatan",
    name: "Surat Keputusan (SK) Pengangkatan Karyawan",
    subject: "Surat Keputusan Direksi tentang Pengangkatan Karyawan Tetap",
    content: `DENGAN RAHMAT TUHAN YANG MAHA ESA,
DIREKSI PT FORESYNDO GLOBAL INDONESIA

Menimbang:
Bahwa berdasarkan penilaian kinerja, loyalitas, dan dedikasi profesional saudara {{nama_penerima}} yang menjabat sebagai {{jabatan}}, maka dipandang memenuhi syarat untuk ditetapkan sebagai Karyawan Tetap perusahaan.

Mengingat:
Anggaran Dasar PT Foresyndo Global Indonesia dan Peraturan Ketenagakerjaan yang berlaku di lingkungan internal perusahaan.

MEMUTUSKAN:

Pertama:
Mengangkat Saudara {{nama_penerima}} sebagai Karyawan Tetap terhitung sejak tanggal penetapan keputusan ini.

Kedua:
Menetapkan tugas pokok dan tanggung jawab baru pada jabatan tersebut di kantor {{alamat}} dengan hak serta kompensasi finansial bulanan sesuai dengan ketentuan golongan kepangkatan yang berlaku.

Ketiga:
Keputusan ini bersifat mutlak dan apabila di kemudian hari terdapat kekeliruan dalam surat penetapan ini, maka akan dilakukan perbaikan sebagaimana mestinya.

Ditetapkan di: Jakarta
Pada tanggal: 27 Juni 2026

Direktur Utama,
PT Foresyndo Global Indonesia`
  },
  {
    id: "tpl_peringatan",
    name: "Surat Peringatan Pertama (SP-1)",
    subject: "Surat Peringatan Pertama (SP-1) Terkait Indispliner Kinerja",
    content: `Dengan hormat,

Surat ini ditujukan secara resmi kepada saudara {{nama_penerima}} yang menjabat sebagai {{jabatan}} di unit kerja {{alamat}}.

Berdasarkan laporan presensi digital serta evaluasi kinerja berkala yang dilakukan oleh Divisi Sumber Daya Manusia (HRD) pada kuartal berjalan, manajemen menemukan adanya pelanggaran atas tata tertib kehadiran kerja berupa ketidaktepatan waktu masuk kantor yang melebihi batas toleransi perusahaan tanpa keterangan tertulis.

Sebagai bentuk evaluasi dan pembinaan kerja profesional, perusahaan menerbitkan Surat Peringatan Pertama (SP-1) ini dengan ketentuan sebagai berikut:
1. Saudara wajib memperbaiki jam kehadiran kerja dan menyelesaikan tugas sesuai dengan Key Performance Indicators (KPI).
2. SP-1 ini berlaku untuk jangka waktu 6 (enam) bulan terhitung sejak tanggal diterbitkannya surat ini.
3. Apabila dalam masa tersebut saudara kembali melakukan pelanggaran indisipliner, perusahaan akan menindaklanjuti dengan tindakan administratif yang lebih tegas (SP-2).

Kami berharap saudara dapat menerima teguran ini dengan bijak sebagai sarana refleksi untuk memulihkan etika kerja yang baik demi kemajuan karier saudara dan perusahaan.`
  }
];

export default function SuratKeluar({ 
  letters, 
  currentRole, 
  currentUser, 
  companySetting, 
  onAddLetter, 
  onUpdateStatus 
}: SuratKeluarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<LetterOut | null>(null);

  // Form States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientInst, setRecipientInst] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subjectVal, setSubjectVal] = useState("");
  const [contentVal, setContentVal] = useState("");
  const [signatoryName, setSignatoryName] = useState("Ir. Joko Sutrisno, M.T.");
  const [selectedTpl, setSelectedTpl] = useState("");
  const [letterCategory, setLetterCategory] = useState("Undangan");

  // AI Prompt Stage
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLang, setAiLang] = useState<"id" | "en">("id");
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Persistent main page AI states
  const [pageAiPrompt, setPageAiPrompt] = useState("");
  const [pageAiLang, setPageAiLang] = useState<"id" | "en">("id");
  const [isPageAiGenerating, setIsPageAiGenerating] = useState(false);

  // HTML5 Canvas Drawing Signature States
  const [isDrawingSig, setIsDrawingSig] = useState(false);
  const [sigDataUrl, setSigDataUrl] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [sigType, setSigType] = useState<"Canvas" | "QR">("Canvas");
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isEmailPreviewModalOpen, setIsEmailPreviewModalOpen] = useState(false);
  const [isPrintPreviewModalOpen, setIsPrintPreviewModalOpen] = useState(false);
  const [pdfDataUri, setPdfDataUri] = useState<string>("");
  const [previewTab, setPreviewTab] = useState<"visual" | "pdf">("visual");

  useEffect(() => {
    if (isPrintPreviewModalOpen && selectedLetter) {
      try {
        const doc = generateLetterPDFDoc(selectedLetter);
        if (doc) {
          const uri = doc.output("datauristring");
          setPdfDataUri(uri);
        }
      } catch (err) {
        console.error("Failed to generate PDF for print preview:", err);
      }
    }
  }, [isPrintPreviewModalOpen, selectedLetter, companySetting]);

  // Filter keys
  const filteredLetters = letters.filter(l => 
    l.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.letterNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.recipient.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Automated variable values for preview replacement
  const getCurrentFormattedDate = () => {
    return new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  const getSubstitutedContent = (rawText: string) => {
    return injectTemplateVariables(rawText, {
      nomor_surat: selectedLetter?.letterNumber || "FORSDIG/2026/06/[AUTO]",
      tanggal: getCurrentFormattedDate(),
      nama_penerima: recipientName || "[Nama Penerima]",
      alamat: recipientInst || "[Instansi Penerima]",
      jabatan: signatoryName || "[Jabatan Penandatangan]",
      perihal: subjectVal || "[Perihal Surat]",
      nama_direktur: signatoryName
    });
  };

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#1E3A8A"; // Blue signature ink
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const pos = getEventCoords(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawingSig(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingSig) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getEventCoords(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawingSig(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveCanvasSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSigDataUrl(canvas.toDataURL("image/png"));
  };

  const getEventCoords = (e: any, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  // When selectedTemplate changes, prefill form content
  useEffect(() => {
    if (selectedTpl) {
      const found = TEMPLATES.find(t => t.id === selectedTpl);
      if (found) {
        setSubjectVal(found.subject);
        
        // Convert plain text template into rich HTML paragraphs
        const htmlContent = found.content
          .split("\n\n")
          .map(para => `<p style="margin-bottom: 12px; line-height: 1.6;">${para.replace(/\n/g, "<br/>")}</p>`)
          .join("");
        setContentVal(htmlContent);

        if (selectedTpl === "tpl_undangan") {
          setLetterCategory("Undangan");
        } else if (selectedTpl === "tpl_penawaran") {
          setLetterCategory("Penawaran");
        } else if (selectedTpl === "tpl_tugas") {
          setLetterCategory("Tugas");
        } else if (selectedTpl === "tpl_permohonan") {
          setLetterCategory("Lainnya");
        } else if (selectedTpl === "tpl_pemberitahuan" || selectedTpl === "tpl_peringatan") {
          setLetterCategory("Pemberitahuan");
        } else if (selectedTpl === "tpl_sk_pengangkatan") {
          setLetterCategory("Keputusan");
        }
      }
    }
  }, [selectedTpl]);

  // AI Generation fetch via Node/Express proxy
  const generateLetterWithAI = async () => {
    if (!aiPrompt) return;
    setIsAiGenerating(true);
    try {
      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, language: aiLang })
      });
      const data = await res.json();
      
      if (data.subject) {
        setSubjectVal(data.subject);
        
        // Convert plain text AI response into rich HTML paragraphs
        const rawContent = `${data.opening}\n\n${data.body}\n\n${data.closing}`;
        const htmlContent = rawContent
          .split("\n\n")
          .map(para => `<p style="margin-bottom: 12px; line-height: 1.6;">${para.replace(/\n/g, "<br/>")}</p>`)
          .join("");
        setContentVal(htmlContent);

        setSignatoryName(data.signatoryRole || "Direktur Utama");
        setIsAiPanelOpen(false);
        setIsAddOpen(true);
        setAiPrompt("");
      } else {
        alert("Gagal memproses respon dari Gemini.");
      }
    } catch (err: any) {
      console.error("AI client error fetch:", err);
      alert("Error: Gagal menghubungi modul integrasi AI.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  // AI Generation on Main Page (autofills and launches draft form)
  const generateLetterWithPageAI = async () => {
    if (!pageAiPrompt) return;
    setIsPageAiGenerating(true);
    try {
      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: pageAiPrompt, language: pageAiLang })
      });
      const data = await res.json();
      
      if (data.subject) {
        setSubjectVal(data.subject);
        
        // Convert plain text AI response into rich HTML paragraphs
        const rawContent = `${data.opening}\n\n${data.body}\n\n${data.closing}`;
        const htmlContent = rawContent
          .split("\n\n")
          .map(para => `<p style="margin-bottom: 12px; line-height: 1.6;">${para.replace(/\n/g, "<br/>")}</p>`)
          .join("");
        setContentVal(htmlContent);

        setSignatoryName(data.signatoryRole || "Direktur Utama");
        
        // Open the Draft Creator form modal immediately with the generated AI draft loaded
        setIsAddOpen(true);
        setPageAiPrompt("");
      } else {
        alert("Gagal memproses draf dari Gemini.");
      }
    } catch (err: any) {
      console.error("AI client error fetch:", err);
      alert("Error: Gagal menghubungi modul integrasi AI.");
    } finally {
      setIsPageAiGenerating(false);
    }
  };

  // Submit letter Out
  const submitLetterOut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName || !contentVal) return;

    // Automatic sequence generation code
    const indexSeq = letters.length;
    const letterNoAuto = generateLetterNumber(indexSeq, companySetting, letterCategory);
    const verificationCode = `DOC-${new Date().toISOString().replace(/[-:T]/g, "").substring(0, 8)}-${String(indexSeq + 1).padStart(3, "0")}`;

    onAddLetter({
      letterNumber: letterNoAuto,
      letterDate: new Date().toISOString().split("T")[0],
      recipient: recipientName,
      recipientInstitution: recipientInst || "PT Umum / Klien Resmi",
      recipientEmail: recipientEmail || undefined,
      subject: subjectVal || "Surat Resmi Korespondensi",
      content: contentVal,
      category: letterCategory,
      status: "Draft",
      signatureEnabled: sigType === "QR" || sigDataUrl !== "",
      signatureUrl: sigType === "QR" ? undefined : (sigDataUrl !== "" ? sigDataUrl : undefined),
      signatureType: sigType,
      verificationCode: verificationCode,
      signatory: signatoryName || "Ir. Joko Sutrisno, M.T.",
      draftBy: currentUser.name
    });

    // Reset Form fields
    setRecipientName("");
    setRecipientInst("");
    setRecipientEmail("");
    setSubjectVal("");
    setContentVal("");
    setSelectedTpl("");
    setLetterCategory("Undangan");
    setSigDataUrl("");
    setSigType("Canvas");
    setIsAddOpen(false);
  };

  // Trigger print document
  const triggerPrint = () => {
    window.print();
  };

  // Download QR Code as premium SVG file
  const handleDownloadQR = (letter: LetterOut) => {
    const qrSvgString = generateVerificationQR(
      `FORSDIG-DOC|id:${letter.id}|vcode:${letter.verificationCode}|status:${letter.status}|signatory:${letter.signatory}`, 
      300, 
      300
    );
    const blob = new Blob([qrSvgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `QR_Verification_${letter.verificationCode}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Format date indonesian helper for PDF formatting
  const formatDateIndo = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  // Helper to generate the premium jsPDF document matching kop surat
  const generateLetterPDFDoc = (letter: LetterOut): jsPDF | null => {
    if (!letter) return null;
    
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pageHeight = 297;
    const pageWidth = 210;
    const leftMargin = 20;
    const rightMargin = 190;
    const contentWidth = 170;

    // Helper to draw clean header on a page
    const drawLetterhead = (pageNumber: number) => {
      // --- 1. Draw Corporate Letter Head Logo (always present, defaults to the beautiful vector logo) ---
      const logoToUse = companySetting.companyLogo;
      if (logoToUse && logoToUse.startsWith("data:image/")) {
        try {
          const format = logoToUse.includes("png") ? "PNG" : "JPEG";
          doc.addImage(logoToUse, format, 20, 14, 35, 12, undefined, "FAST");
        } catch (logoErr) {
          console.error("Failed to add company logo to PDF in SuratKeluar:", logoErr);
          // Clean vector fallback: Navy blue circle outline with Navy blue FGI text
          doc.setDrawColor(30, 41, 142);
          doc.setLineWidth(1.0);
          doc.circle(27, 21, 6.5, "S");
          doc.setTextColor(30, 41, 142);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10.5);
          doc.text("FGI", 27, 24.5, { align: "center" });
        }
      } else {
        // Clean vector fallback: Navy blue circle outline with Navy blue FGI text
        doc.setDrawColor(30, 41, 142);
        doc.setLineWidth(1.0);
        doc.circle(27, 21, 6.5, "S");
        doc.setTextColor(30, 41, 142);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.text("FGI", 27, 24.5, { align: "center" });
      }

      // --- 2. Company Name and Details (KOP SURAT) ---
      const textStartX = 60;
      doc.setTextColor(15, 23, 42); // Navy / Dark slate
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(companySetting.companyName.toUpperCase(), textStartX, 19.5);

      doc.setTextColor(71, 85, 105); // Slate Dark Grey
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      
      const addrWithFormat = companySetting.companyAddress;
      const addressLines = doc.splitTextToSize(addrWithFormat, 130);
      doc.text(addressLines, textStartX, 23.5);
      
      // Telephone & email details line
      const detailsLineY = 23.5 + (addressLines.length * 3.8);
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 142);
      doc.text("e-Office & Digital Signature Hub", textStartX, detailsLineY);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      const hubTextWidth = doc.getTextWidth("e-Office & Digital Signature Hub");
      doc.text(` | Telp: ${companySetting.companyPhone} | Email: ${companySetting.companyEmail}`, textStartX + hubTextWidth, detailsLineY);

      // --- 3. Premium Double Divider borders ---
      const lineY = detailsLineY + 3.5;
      doc.setDrawColor(30, 41, 142);
      doc.setLineWidth(0.8);
      doc.line(leftMargin, lineY, rightMargin, lineY);
      
      // Thin slate line
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.25);
      doc.line(leftMargin, lineY + 0.9, rightMargin, lineY + 0.9);

      // Page numbering indicator at the very bottom right
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Hal ${pageNumber}`, rightMargin, 285, { align: "right" });
      
      // Return bottom position of the header
      return lineY + 5;
    };

    // Draw the first page header
    let currentY = drawLetterhead(1);
    let currentPage = 1;

    // --- 4. Date on the Right ---
    const metaY = currentY + 5;
    doc.setTextColor(15, 23, 42); // Dark Charcoal
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const dateOutput = `Jakarta, ${letter.letterDate ? formatDateIndo(letter.letterDate) : getCurrentFormattedDate()}`;
    doc.text(dateOutput, rightMargin, metaY, { align: "right" });

    // --- 5. Letter Metadata Group (Left) with Clean Tabular Columns ---
    const labelX = leftMargin;
    const colonX = leftMargin + 15;
    const valueX = leftMargin + 18;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text("Nomor", labelX, metaY);
    doc.text("Sifat", labelX, metaY + 5.5);
    doc.text("Hal", labelX, metaY + 11);

    doc.text(":", colonX, metaY);
    doc.text(":", colonX, metaY + 5.5);
    doc.text(":", colonX, metaY + 11);

    // Nomor value
    doc.setFont("courier", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 142);
    doc.text(letter.letterNumber, valueX, metaY);
    
    // Sifat value
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    doc.text("Biasa / Terbuka", valueX, metaY + 5.5);
    
    // Hal value with dynamic wrapping
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    const subjectWrapped = doc.splitTextToSize(letter.subject, rightMargin - valueX);
    doc.text(subjectWrapped, valueX, metaY + 11);

    // --- 6. Recipient Details with Dynamic Padding ---
    const recipientY = metaY + 14 + (subjectWrapped.length * 5.0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text("Kepada Yth,", leftMargin, recipientY);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(letter.recipient, leftMargin, recipientY + 5.5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    
    const instText = letter.recipientInstitution || "";
    let diTempatY = recipientY + 10.5;
    if (instText.trim()) {
      const instWrapped = doc.splitTextToSize(instText, contentWidth);
      doc.text(instWrapped, leftMargin, recipientY + 10.5);
      diTempatY = recipientY + 10.5 + (instWrapped.length * 4.5);
    }
    doc.text("Di tempat", leftMargin, diTempatY);

    // --- 7. Content (Body) with Dynamic Spacing & Automatic Multi-Page Flow ---
    let bodyY = diTempatY + 12;
    doc.setFont("times", "normal"); // Times Roman is the golden standard for formal affairs
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // Crisp deep charcoal body text (less harsh than pure black)

    // Helper to strip HTML tags from rich editor string
    const stripHtml = (htmlStr: string): string => {
      if (!htmlStr) return "";
      const withBreaks = htmlStr
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<\/div>/gi, "\n")
        .replace(/<\/li>/gi, "\n")
        .replace(/<li>/gi, "• ");
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = withBreaks;
      let text = tempDiv.textContent || tempDiv.innerText || "";
      // Replace non-breaking spaces and other common entities that cause jsPDF rendering issues
      text = text.replace(/\u00a0/g, " ").replace(/&nbsp;/g, " ");
      return text;
    };

    // Substitute template vars
    const substituted = injectTemplateVariables(letter.content, {
      nomor_surat: letter.letterNumber,
      tanggal: letter.letterDate ? formatDateIndo(letter.letterDate) : getCurrentFormattedDate(),
      nama_penerima: letter.recipient,
      alamat: letter.recipientInstitution,
      jabatan: letter.signatory,
      perihal: letter.subject,
      nama_direktur: letter.signatory
    });

    const formattedContent = stripHtml(substituted);

    // Split letter content by single/double newlines into clean logical paragraphs
    const paragraphs = formattedContent.split(/\n+/).map(p => p.trim()).filter(Boolean);
    const paragraphGap = 6; // Spacing between distinct paragraphs in mm
    const footerSafeZoneY = 210; // Reserve bottom section for Signature and QR block (77mm)

    for (let i = 0; i < paragraphs.length; i++) {
      const pText = paragraphs[i];
      const pWrappedLines = doc.splitTextToSize(pText, contentWidth) as string[];
      const pHeight = pWrappedLines.length * 5.25;

      const limitY = currentPage === 1 ? footerSafeZoneY : 255;

      if (bodyY + pHeight <= limitY) {
        // Fits perfectly on the current page
        doc.text(pWrappedLines, leftMargin, bodyY, {
          align: "justify",
          maxWidth: contentWidth,
          lineHeightFactor: 1.35
        });
        bodyY += pHeight + paragraphGap;
      } else {
        // Does not fit! Let's calculate how many lines we can fit on this page
        const availableHeight = limitY - bodyY;
        const linesThatFitCount = Math.floor(availableHeight / 5.25);

        if (linesThatFitCount >= 2) {
          // If we can fit at least 2 lines, let's split the paragraph to avoid large blank spaces (orphans/widows protection)
          const firstPart = pWrappedLines.slice(0, linesThatFitCount);
          const secondPart = pWrappedLines.slice(linesThatFitCount);

          doc.text(firstPart, leftMargin, bodyY, {
            align: "justify",
            maxWidth: contentWidth,
            lineHeightFactor: 1.35
          });

          doc.addPage();
          currentPage++;
          bodyY = drawLetterhead(currentPage) + 12;
          doc.setFont("times", "normal");
          doc.setFontSize(11);
          doc.setTextColor(15, 23, 42);

          doc.text(secondPart, leftMargin, bodyY, {
            align: "justify",
            maxWidth: contentWidth,
            lineHeightFactor: 1.35
          });
          bodyY += (secondPart.length * 5.25) + paragraphGap;
        } else {
          // If we can't even fit 2 lines, push the whole paragraph to the next page
          doc.addPage();
          currentPage++;
          bodyY = drawLetterhead(currentPage) + 12;
          doc.setFont("times", "normal");
          doc.setFontSize(11);
          doc.setTextColor(15, 23, 42);

          doc.text(pWrappedLines, leftMargin, bodyY, {
            align: "justify",
            maxWidth: contentWidth,
            lineHeightFactor: 1.35
          });
          bodyY += pHeight + paragraphGap;
        }
      }
    }

    // --- 8. QR Code and Signatures Footer Grid ---
    let footerY = 228;
    if (bodyY > 238) {
      doc.addPage();
      currentPage++;
      let finalHeaderY = drawLetterhead(currentPage);
      footerY = finalHeaderY + 20; // Render with a nice gap on the next page
    } else {
      footerY = Math.max(228, bodyY + 12);
    }

    // A. Clean Vector QR Code Drawing Box
    let hash = 0;
    const qrCodeVal = letter.verificationCode;
    for (let i = 0; i < qrCodeVal.length; i++) {
      hash = qrCodeVal.charCodeAt(i) + ((hash << 5) - hash);
    }
    const size = 15;
    const qrBoxSize = 25; // 25mm square QR code
    const cellWidth = qrBoxSize / size;
    
    // Draw modern background card for the document authenticity code
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(leftMargin, footerY - 2, 78, qrBoxSize + 8, 2, 2, "FD");

    // Draw small green shield-check "DOKUMEN ASLI SAH" badge inside container
    doc.setFillColor(16, 185, 129); // Emerald Green
    doc.circle(leftMargin + 6, footerY + 2.5, 1.8, "F");
    
    doc.setTextColor(16, 185, 129);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("DOKUMEN TERVERIFIKASI SAH", leftMargin + 9.5, footerY + 3.2);

    // Matrix QR Code Rendering loops
    doc.setFillColor(15, 23, 42); // Pure deep charcoal QR code pixels
    const isPosAnchor = (r: number, c: number) => {
      if (r < 4 && c < 4) return true;
      if (r < 4 && c >= size - 4) return true;
      if (r >= size - 4 && c < 4) return true;
      return false;
    };
    const isPosAnchorBorder = (r: number, c: number) => {
      if ((r === 1 || r === 2) && (c === 1 || c === 2)) return false;
      if ((r === 1 || r === 2) && (c === size - 2 || c === size - 3)) return false;
      if ((r === size - 2 || r === size - 3) && (c === 1 || c === 2)) return false;
      return isPosAnchor(r, c);
    };

    const startQRX = leftMargin + 4;
    const startQRY = footerY + 6.5;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        let active = false;
        if (isPosAnchor(r, c)) {
          active = isPosAnchorBorder(r, c);
        } else {
          const cellHash = Math.abs(Math.sin(hash + r * 19 + c * 33));
          active = cellHash > 0.44;
        }

        if (active) {
          doc.rect(startQRX + c * cellWidth, startQRY + r * cellWidth, cellWidth - 0.22, cellWidth - 0.22, "F");
        }
      }
    }

    // QR Code Metadata descriptions
    const qrDescX = leftMargin + 4 + qrBoxSize + 4;
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("Sistem e-Sign FORSDIG", qrDescX, footerY + 11);
    
    doc.setFont("courier", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 142); // Navy Blue
    doc.text(letter.verificationCode, qrDescX, footerY + 15.5);
    
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text("Pindai QR dengan kamera", qrDescX, footerY + 20);
    doc.text("untuk melihat berkas asli", qrDescX, footerY + 23.5);
    doc.text("dan audit log pelacakan instansi.", qrDescX, footerY + 27);

    // B. Corporate Right Sign-stamp Signatory block
    const signX = 140;
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text("Hormat kami,", signX, footerY, { align: "left" });
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 142);
    doc.text(companySetting.companyName.toUpperCase(), signX, footerY + 4.8, { align: "left" });

    // Render signature if signature is enabled & available
    const activeSignature = letter.signatureUrl || sigDataUrl;

    // --- Draw beautiful digital watermark stamp overlay behind signature ---
    try {
      // Draw Circular Watermark Stamp border in light executive blue
      doc.setDrawColor(29, 78, 216, 0.15); // light ink blue with 15% opacity
      doc.setLineWidth(0.4);
      doc.circle(signX + 18, footerY + 12, 10);
      doc.circle(signX + 18, footerY + 12, 11);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      doc.setTextColor(29, 78, 216);
      doc.text("PT. FORESYNDO", signX + 18, footerY + 10, { align: "center" });
      doc.text("GLOBAL INDO", signX + 18, footerY + 12.5, { align: "center" });
      
      doc.setFontSize(4.5);
      doc.setFillColor(29, 78, 216);
      doc.roundedRect(signX + 9, footerY + 14, 18, 4, 0.5, 0.5, "F");
      doc.setTextColor(255, 255, 255);
      doc.text("APPROVED e-SIGN", signX + 18, footerY + 17, { align: "center" });
    } catch (stampErr) {
      console.warn("Failed drawing digital stamp vector:", stampErr);
    }

    if (letter.signatureEnabled && letter.signatureType === "QR") {
      // Draw signature as a sophisticated official QR Code digital signature (TTE Barcode)
      const sigCode = `TTE-${letter.verificationCode.substring(4)}`;
      
      // Draw a neat bounding box with scan indicator
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(29, 78, 216);
      doc.setLineWidth(0.25);
      doc.roundedRect(signX, footerY + 5, 44, 16, 1, 1, "FD");

      // Draw mini QR Code pixels inside the signature bounding box (left side of box)
      let sigHash = 0;
      for (let i = 0; i < sigCode.length; i++) {
        sigHash = sigCode.charCodeAt(i) + ((sigHash << 5) - sigHash);
      }
      const qrMatrixSize = 11;
      const miniCellWidth = 10 / qrMatrixSize;
      
      doc.setFillColor(29, 78, 216); // Nice official blue color for signature QR code
      for (let r = 0; r < qrMatrixSize; r++) {
        for (let c = 0; c < qrMatrixSize; c++) {
          const isAnchor = (r < 3 && c < 3) || (r < 3 && c >= qrMatrixSize - 3) || (r >= qrMatrixSize - 3 && c < 3);
          let pixelActive = false;
          if (isAnchor) {
            pixelActive = (r === 0 || r === 2 || c === 0 || c === 2) || (r === qrMatrixSize - 1 || r === qrMatrixSize - 3 || c === qrMatrixSize - 1 || c === qrMatrixSize - 3);
          } else {
            pixelActive = Math.abs(Math.sin(sigHash + r * 13 + c * 27)) > 0.45;
          }
          if (pixelActive) {
            doc.rect(signX + 2 + c * miniCellWidth, footerY + 8 + r * miniCellWidth, miniCellWidth - 0.1, miniCellWidth - 0.1, "F");
          }
        }
      }

      // Add descriptive labels next to the QR code inside the box
      doc.setTextColor(29, 78, 216);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text("TTE VERIFIED", signX + 14, footerY + 9.5);
      
      doc.setTextColor(71, 85, 105);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5);
      doc.text("Ditandatangani secara", signX + 14, footerY + 12.5);
      doc.text("elektronik via FGI Hub", signX + 14, footerY + 14.5);
      
      doc.setFont("courier", "bold");
      doc.setFontSize(4.5);
      doc.setTextColor(30, 41, 142);
      doc.text(sigCode, signX + 14, footerY + 17.5);
    } else if (letter.signatureEnabled && activeSignature) {
      try {
        doc.addImage(activeSignature, "PNG", signX - 2, footerY + 6, 32, 14);
      } catch {
        // Draw elegant vector handwriting loops fallback
        doc.setDrawColor(30, 41, 142);
        doc.setLineWidth(0.65);
        doc.line(signX + 2, footerY + 14, signX + 10, footerY + 8);
        doc.line(signX + 10, footerY + 8, signX + 14, footerY + 16);
        doc.line(signX + 14, footerY + 16, signX + 22, footerY + 10);
        doc.line(signX + 22, footerY + 10, signX + 32, footerY + 15);
        doc.line(signX - 2, footerY + 13, signX + 36, footerY + 12);
        doc.circle(signX + 6, footerY + 11, 1.8);
      }
    } else if (letter.signatureEnabled) {
      // Draw elegant vector handwriting loops fallback
      doc.setDrawColor(30, 41, 142);
      doc.setLineWidth(0.65);
      doc.line(signX + 2, footerY + 14, signX + 10, footerY + 8);
      doc.line(signX + 10, footerY + 8, signX + 14, footerY + 16);
      doc.line(signX + 14, footerY + 16, signX + 22, footerY + 10);
      doc.line(signX + 22, footerY + 10, signX + 32, footerY + 15);
      doc.line(signX - 2, footerY + 13, signX + 36, footerY + 12);
      doc.circle(signX + 6, footerY + 11, 1.8);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    const signatoryName = letter.signatory || "";
    const nameWidth = doc.getTextWidth(signatoryName);
    doc.text(signatoryName, signX, footerY + 22.8);
    
    doc.setLineWidth(0.35);
    doc.setDrawColor(15, 23, 42);
    doc.line(signX, footerY + 23.4, signX + Math.max(40, nameWidth), footerY + 23.4);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text("Direktur Utama", signX, footerY + 27.2);

    return doc;
  };

  // Export letter to highly detailed PDF matching kop surat
  const handleExportPDF = (letter: LetterOut) => {
    const doc = generateLetterPDFDoc(letter);
    if (doc) {
      doc.save(`${letter.verificationCode}_LettersOut.pdf`);
    }
  };

  const isViewer = currentRole === "Viewer";
  const canDraft = currentRole === "Super Admin" || currentRole === "Staff";
  const canMngrApproval = currentRole === "Super Admin" || currentRole === "Manager" || currentRole === "Direktur";
  const canDirSignature = currentRole === "Super Admin" || currentRole === "Direktur";

  return (
    <div className="space-y-6" id="surat-keluar-viewport">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900duration-150 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Alur Pembubuhan & Surat Keluar</h2>
          <p className="text-xs text-slate-500 mt-1">Review bertingkat Draft → Approval Manager → Approval Direktur & Tanda Tangan</p>
        </div>
        
        {canDraft && (
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => setIsAiPanelOpen(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-700 hover:to-indigo-750 font-semibold text-white px-4 py-2.5 rounded-lg text-sm transition-all shadow-sm cursor-pointer"
              id="btn-ai-letter-assistant"
            >
              <Bot className="h-4 w-4 animate-pulse" />
              <span>Draf dengan Gemini AI</span>
            </button>
            <button 
              onClick={() => setIsAddOpen(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 font-semibold text-white px-4 py-2.5 rounded-lg text-sm transition-all shadow-sm cursor-pointer"
              id="btn-buat-surat-keluar"
            >
              <Plus className="h-4 w-4" />
              <span>Konsep Surat Baru</span>
            </button>
          </div>
        )}
      </div>

      {/* Grid: Letters Out list & Kop Surat live preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Outgoing List & AI Draft Panel Stack */}
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          {/* Gemini AI Instant Drafter Panel */}
          {canDraft && (
            <div className="bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 text-white rounded-xl p-5 border border-blue-800/60 shadow-lg space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
                  <Bot className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-xs tracking-wide uppercase text-blue-300 flex items-center gap-1.5">
                    Gemini AI Draft Generator
                    <Sparkles className="h-3 w-3 text-yellow-400 shrink-0" />
                  </h3>
                  <p className="text-[10px] text-slate-300">Tulis instruksi ringkas untuk menyusun surat instan.</p>
                </div>
              </div>

              <div className="space-y-3">
                <textarea 
                  placeholder="Contoh: Buat draf surat undangan rapat forum bulanan koperasi..."
                  rows={3}
                  value={pageAiPrompt}
                  onChange={(e) => setPageAiPrompt(e.target.value)}
                  className="w-full text-xs bg-slate-950/45 border border-blue-800/70 rounded-lg p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />

                <div className="flex justify-between items-center bg-slate-950/30 p-2 rounded-lg border border-blue-900/30">
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setPageAiLang("id")}
                      className={`text-[10px] px-2 py-1 rounded font-bold transition-all ${pageAiLang === "id" ? "bg-blue-600 text-white" : "bg-transparent text-slate-450 hover:text-white"}`}
                    >
                      Bhs Indonesia
                    </button>
                    <button 
                      type="button"
                      onClick={() => setPageAiLang("en")}
                      className={`text-[10px] px-2 py-1 rounded font-bold transition-all ${pageAiLang === "en" ? "bg-blue-600 text-white" : "bg-transparent text-slate-450 hover:text-white"}`}
                    >
                      English
                    </button>
                  </div>

                  <button 
                    type="button"
                    onClick={generateLetterWithPageAI}
                    disabled={isPageAiGenerating || !pageAiPrompt.trim()}
                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:opacity-50 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isPageAiGenerating ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        <span>Menyusun...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3 text-yellow-300" />
                        <span>Draft dengan AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Outgoing List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-fit">
          <div className="p-4 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-transparent">
            <span className="font-bold text-slate-800 dark:text-white text-sm">Drafting & Progress ({filteredLetters.length})</span>
            <span className="text-[10px] font-semibold text-blue-600 bg-blue-100/50 dark:bg-blue-950 px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider">e-Office flow</span>
          </div>

          {/* Quick search */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="h-3.5 w-3.5" />
              </span>
              <input 
                type="text"
                placeholder="Cari surat keluar, nomor atau penerima..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-850 max-h-[480px] overflow-y-auto">
            {filteredLetters.map((l) => (
              <div 
                key={l.id}
                onClick={() => setSelectedLetter(l)}
                className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/20 cursor-pointer transition-colors ${
                  selectedLetter?.id === l.id ? "bg-blue-50/40 dark:bg-blue-950/20 border-l-4 border-l-blue-600" : ""
                }`}
                id={`letter-out-${l.id}`}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 font-mono" title="No. Registrasi Instansi">{l.letterNumber}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    l.status === "Terkirim" 
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : l.status === "Approved Direktur"
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                      : l.status === "Approved Manager"
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                      : "bg-slate-150 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}>{l.status}</span>
                </div>

                <p className="font-semibold text-slate-800 dark:text-slate-100 text-xs mb-1 line-clamp-1">{l.subject}</p>
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-1">
                  <span>Untuk: {l.recipient}</span>
                  <span>{l.letterDate}</span>
                </div>
              </div>
            ))}

            {filteredLetters.length === 0 && (
              <div className="text-center p-8 text-slate-400 italic text-xs">Belum ada konsep surat keluar terkonfigurasi.</div>
            )}
          </div>
        </div>

        </div>

        {/* Live kop-surat preview and workflows */}
        <div className="lg:col-span-2 space-y-6" id="kop-letter-viewport">
          {selectedLetter ? (
            <div className="space-y-4">
              {/* Approval controls menu widget */}
              {!isViewer && (
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">Status Progres Surat</span>
                    <h4 className="font-bold text-slate-800 dark:text-white flex items-center text-sm">
                      <ShieldCheck className="h-4 w-4 text-emerald-500 mr-2 shrink-0 animate-pulse" />
                      Tahap Workflow: <span className="text-blue-600 dark:text-blue-400 ml-1.5">{selectedLetter.status}</span>
                    </h4>
                  </div>

                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    {/* MANAGER approval trigger */}
                    {selectedLetter.status === "Draft" && canMngrApproval && (
                      <button 
                        onClick={() => {
                          onUpdateStatus(selectedLetter.id, "Approved Manager", "Approved by Manager - format verified.");
                          // Update locally to sync view instantly
                          setSelectedLetter({...selectedLetter, status: "Approved Manager"});
                        }}
                        className="flex-1 md:flex-none flex items-center justify-center space-x-1 sm:space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1.5 px-3 rounded text-xs transition-all"
                        id="btn-approval-manager"
                      >
                        <UserCheck className="h-3 w-3" />
                        <span>Approval Manager</span>
                      </button>
                    )}

                    {/* DIREKTUR approval trigger */}
                    {selectedLetter.status === "Approved Manager" && canDirSignature && (
                      <button 
                        onClick={() => {
                          onUpdateStatus(selectedLetter.id, "Approved Direktur", "Signed and finalized by Director Joko.");
                          setSelectedLetter({...selectedLetter, status: "Approved Direktur", signatureEnabled: true});
                          alert(`[Approval TTE Berhasil] Surat keluar telah disetujui secara resmi oleh Direktur!\n\nSistem secara otomatis menghasilkan/mengaktifkan QR Code unik (${selectedLetter.verificationCode}) untuk memvalidasi keaslian dokumen secara digital pada lembar cetak maupun file PDF.`);
                        }}
                        className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-1.5 px-3 rounded text-xs transition-all"
                        id="btn-approval-direktur"
                      >
                        <Signature className="h-3 w-3" />
                        <span>Sign & Approve Direktur</span>
                      </button>
                    )}

                    {/* DISPATCH/SEND TO RECIPIENT */}
                    {(selectedLetter.status === "Approved Direktur" || (selectedLetter.status === "Approved Manager" && currentRole === "Super Admin")) && (
                      <button 
                        onClick={() => {
                          onUpdateStatus(selectedLetter.id, "Terkirim", "Sent to recipient via Resend official correspondence channel.");
                          setSelectedLetter({...selectedLetter, status: "Terkirim"});
                                            // Generate PDF base64 data for attachment
                          let pdfBase64 = "";
                          try {
                            const doc = generateLetterPDFDoc(selectedLetter);
                            if (doc) {
                              pdfBase64 = doc.output("datauristring").split(",")[1];
                            }
                          } catch (pdfErr) {
                            console.error("Failed to generate PDF for attachment:", pdfErr);
                          }

                          const sanitizedSubject = selectedLetter.subject
                            ? selectedLetter.subject.trim().replace(/[/\\?%*:|"<>\s]+/g, "_")
                            : "Surat_Keluar";
                          const finalAttachmentName = `${sanitizedSubject}.pdf`;

                          // Transmit email via Resend API
                          fetch("/api/email/send", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              to: selectedLetter.recipientEmail || companySetting.companyEmail,
                              subject: `[FGI OFFICE] - ${selectedLetter.subject}`,
                              body: selectedLetter.content,
                              attachmentName: finalAttachmentName,
                              pdfData: pdfBase64 || undefined,
                              letterData: {
                                letterNumber: selectedLetter.letterNumber,
                                letterDate: selectedLetter.letterDate,
                                recipient: selectedLetter.recipient,
                                recipientInstitution: selectedLetter.recipientInstitution,
                                signatory: selectedLetter.signatory,
                                verificationCode: selectedLetter.verificationCode,
                                status: "Terkirim"
                              }
                            })
                          }).then(res => res.json()).then(resp => {
                            if (resp.success) {
                              const targetEmail = selectedLetter.recipientEmail || companySetting.companyEmail;
                              const isSimulation = resp.deliveryMethod && resp.deliveryMethod.includes("SIMULATION");
                              
                              if (isSimulation) {
                                alert(`[Mode Simulasi] Email surat keluar "${selectedLetter.subject}" disimulasikan siap kirim ke ${targetEmail}.\n\n(Tip: Isi 'RESEND_API_KEY' di secrets untuk pengiriman nyata!)`);
                              } else {
                                alert(`[Resend Sukses] Surat resmi "${selectedLetter.subject}" berhasil dikirimkan ke alamat ${targetEmail} menggunakan provider Resend!`);
                              }
                            } else {
                              alert(`Gagal mengirim email: ${resp.error || 'Server error'}`);
                            }
                          }).catch(err => {
                            console.error(err);
                            alert("Terjadi kegagalan koneksi saat menghubungi server pengiriman.");
                          });
                        }}
                        className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1.5 px-4 rounded text-xs transition-all animate-bounce"
                        id="btn-dispatch-terkirim"
                      >
                        <Send className="h-3 w-3" />
                        <span>Kirim Surat Resmi (Resend)</span>
                      </button>
                    )}

                    {/* PRINT DOCUMENT */}
                    <button 
                      onClick={triggerPrint}
                      className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-150 text-slate-700 dark:text-slate-300 font-bold py-1.5 px-3 rounded text-xs transition-all"
                      id="btn-cetak-surat"
                    >
                      <Printer className="h-3 w-3" />
                      <span>Cetak KOP</span>
                    </button>

                    {/* REVIEW EMAIL TEMPLATE */}
                    <button 
                      onClick={() => setIsEmailPreviewModalOpen(true)}
                      className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 border border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 font-bold py-1.5 px-3 rounded text-xs transition-all cursor-pointer"
                      id="btn-review-email"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Review Email</span>
                    </button>

                    {/* EXPORT TO PDF */}
                    <button 
                      onClick={() => handleExportPDF(selectedLetter)}
                      className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3.5 rounded text-xs transition-all cursor-pointer"
                      id="btn-unduh-pdf"
                    >
                      <FileText className="h-3 w-3" />
                      <span>Unduh PDF</span>
                    </button>

                    {/* PRINT PREVIEW VIEW */}
                    <button 
                      onClick={() => {
                        setPreviewTab("visual");
                        setIsPrintPreviewModalOpen(true);
                      }}
                      className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3.5 rounded text-xs transition-all cursor-pointer shadow-sm shadow-indigo-200 dark:shadow-none"
                      id="btn-pratinjau-cetak"
                      title="Pratinjau tata letak dokumen dan branding perusahaan"
                    >
                      <LayoutTemplate className="h-3.5 w-3.5" />
                      <span>Pratinjau Cetak</span>
                    </button>
                  </div>
                </div>
              )}

              {/* QR Code Security Verification & TTE Status Panel */}
              <div 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4"
                id="qr-verification-panel"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-450 rounded-lg shrink-0 border border-blue-100 dark:border-blue-900/40">
                      <QrCode className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-xs sm:text-sm">QR Code Verifikasi & TTE Keaslian</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Kode QR aman terenkripsi memuat ID & status penandatanganan resmi.</p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                    selectedLetter.status === "Approved Direktur" || selectedLetter.status === "Terkirim"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40"
                      : "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40"
                  }`}>
                    {selectedLetter.status === "Approved Direktur" || selectedLetter.status === "Terkirim"
                      ? "✓ Sertifikat Aktif"
                      : "⚠ Draf / Belum Disahkan"
                    }
                  </span>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-center bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-lg border border-slate-150 dark:border-slate-800/80">
                  {/* QR Image Visualizer Card */}
                  <div className="shrink-0 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl relative group shadow-sm">
                    <div 
                      className="w-24 h-24 flex items-center justify-center cursor-pointer transition-transform duration-100 active:scale-[0.98]"
                      onClick={() => setIsVerifyModalOpen(true)}
                      title="Klik untuk detail sertifikat kriptografi"
                      dangerouslySetInnerHTML={{ 
                        __html: generateVerificationQR(
                          `FORSDIG-DOC|id:${selectedLetter.id}|vcode:${selectedLetter.verificationCode}|status:${selectedLetter.status}|signatory:${selectedLetter.signatory}`, 
                          96, 
                          96
                        ) 
                      }} 
                    />
                    <div className="absolute inset-0 bg-black/60 text-[10px] font-bold text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 rounded-xl transition-all duration-150 cursor-pointer text-center p-1">
                      <Search className="h-4 w-4 mb-1 text-blue-400" />
                      <span>UJI INTEGRITAS</span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3 text-left w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-[11px] leading-relaxed">
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 font-medium">Document ID:</span>
                        <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedLetter.id}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 font-medium">Kode Integritas TTE:</span>
                        <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedLetter.verificationCode}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 font-medium">Sifat Autentikasi:</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {selectedLetter.signatureEnabled ? "Elektronik (QR TTE)" : "Tanda Tangan Manual Pad"}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 font-medium">Sertifikat Otorisasi:</span>
                        <p className={`font-bold ${
                          selectedLetter.status === "Approved Direktur" || selectedLetter.status === "Terkirim"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-600 dark:text-amber-500"
                        }`}>{selectedLetter.status}</p>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-slate-150 dark:border-slate-800 flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => handleDownloadQR(selectedLetter)}
                        className="inline-flex items-center space-x-1.5 text-slate-700 dark:text-slate-300 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 font-bold text-[11px] px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-750 transition-all cursor-pointer shadow-sm active:scale-95"
                        id="btn-download-qr-code"
                        title="Unduh file asset QR Code verifikasi (SVG)"
                      >
                        <Download className="h-3.5 w-3.5 shrink-0" />
                        <span>Unduh QR</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsVerifyModalOpen(true)}
                        className="inline-flex items-center space-x-1.5 text-blue-600 dark:text-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/45 dark:hover:bg-blue-950/70 font-bold text-[11px] px-3.5 py-1.5 rounded-lg border border-blue-200/50 dark:border-blue-900/30 transition-all cursor-pointer shadow-sm active:scale-95"
                        id="btn-verify-integrity"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                        <span>Buka Utilitas Verifikasi QR</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Physical Kop Surat Frame */}
              <div 
                className="bg-white text-slate-800 p-8 border border-slate-200 rounded-xl shadow-lg font-serif print:border-0 print:p-0 print:shadow-none"
                id="printable-kop-letter"
              >
                {/* Letter Head (KOP SURAT) */}
                <div className="flex border-b-4 border-slate-900 pb-4 mb-6 items-center">
                  {/* Corporate design logo */}
                  <div className="mr-4 shrink-0 bg-white p-1 rounded border border-slate-100">
                    {companySetting.companyLogo ? (
                      <img src={companySetting.companyLogo} alt="Logo" className="h-12 max-w-[130px] object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <FgiLogo size={42} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h1 className="font-sans font-extrabold text-xl tracking-tight text-slate-900 uppercase">{companySetting.companyName}</h1>
                    <p className="text-[11px] font-sans text-slate-500 font-medium leading-normal mt-0.5">{companySetting.companyAddress}</p>
                    <p className="text-[11px] font-sans text-slate-400 font-medium">Telp: {companySetting.companyPhone} | Email: {companySetting.companyEmail}</p>
                  </div>
                </div>

                {/* Subtitle / Agenda dates */}
                <div className="flex justify-between items-start text-xs font-sans font-medium mb-6">
                  <div>
                    <p>Nomor : <span className="font-semibold font-mono tracking-tight">{selectedLetter.letterNumber}</span></p>
                    <p>Sifat  : Biasa / Terbuka</p>
                    <p>Hal    : <span className="font-semibold">{selectedLetter.subject}</span></p>
                  </div>
                  <div>
                    <p>Jakarta, {getCurrentFormattedDate()}</p>
                  </div>
                </div>

                {/* Recipient Address */}
                <div className="text-xs font-sans leading-relaxed mb-6">
                  <p>Kepada Yth,</p>
                  <p className="font-bold text-slate-900">{selectedLetter.recipient}</p>
                  <p className="font-medium text-slate-600">{selectedLetter.recipientInstitution}</p>
                  <p>Di tempat</p>
                </div>

                {/* Core contents structured paragraph rendering */}
                <div 
                  className="text-xs text-slate-850 leading-relaxed mb-8 min-h-[160px] font-sans rich-text-preview"
                  dangerouslySetInnerHTML={{ __html: getSubstitutedContent(selectedLetter.content) }}
                />

                {/* Sign-off e-signature blocks and integrity check stamps */}
                <div className="flex justify-between items-end border-t border-slate-100 pt-6">
                  {/* QR code Integrity block */}
                  <div className="flex items-center space-x-3 text-[10px] font-sans text-slate-400">
                    <div 
                      className="cursor-pointer shrink-0" 
                      onClick={() => alert(`Informasi Verifikasi Dokumen Masuk:\nNomor: ${selectedLetter.letterNumber}\nTanggal: ${selectedLetter.letterDate}\nPenandatangan: ${selectedLetter.signatory}\nStatus: ${selectedLetter.status}\nIntegrity Code: ${selectedLetter.verificationCode}`)}
                      dangerouslySetInnerHTML={{ __html: generateVerificationQR(selectedLetter.verificationCode, 72, 72) }} 
                    />
                    <div>
                      <p className="font-bold text-slate-800">QR Verifikasi Dokumen</p>
                      <p className="font-mono mt-0.5">{selectedLetter.verificationCode}</p>
                      <span className="text-[9px] text-slate-350 dark:text-slate-500 block">Scan QR untuk validasi metadata e-Office</span>
                    </div>
                  </div>

                  {/* Signatory name and PNG sign-stamp */}
                  <div className="text-right text-xs font-sans pr-4">
                    <p>Hormat kami,</p>
                    <p className="font-bold text-slate-900 mt-1">{companySetting.companyName}</p>
                    
                    {/* Digital Signature */}
                    <div className="h-16 flex justify-end items-center my-1 relative">
                      {selectedLetter.signatureEnabled && (
                        <div className="absolute right-0 opacity-85 hover:opacity-100 transition-opacity">
                          {selectedLetter.signatureType === "QR" ? (
                            <div className="flex items-center space-x-2 border border-blue-200 bg-blue-50/50 dark:border-blue-900/40 dark:bg-blue-950/20 p-1.5 px-2 rounded-lg shadow-sm text-left mr-2">
                              {/* Clean Mini QR-like SVG decoration */}
                              <div className="w-9 h-9 bg-white border border-blue-300 dark:border-blue-800 p-0.5 rounded flex flex-col justify-between shrink-0">
                                <svg className="w-full h-full text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="1" y="1" width="6" height="6" strokeWidth="2.5" />
                                  <rect x="17" y="1" width="6" height="6" strokeWidth="2.5" />
                                  <rect x="1" y="17" width="6" height="6" strokeWidth="2.5" />
                                  <path d="M12 4h2M4 12V14M12 12V20M20 12v4M16 16h4" strokeWidth="1.5" />
                                </svg>
                              </div>
                              <div className="text-[9px] leading-tight text-blue-800 dark:text-blue-300">
                                <p className="font-bold tracking-tight">TTE VERIFIED</p>
                                <p className="text-[8px] text-slate-500 font-mono">TTE-{selectedLetter.verificationCode.substring(4)}</p>
                                <span className="text-[8px] text-emerald-600 bg-emerald-50 px-1 rounded font-semibold border border-emerald-100 block mt-0.5">e-Sign Forsdig</span>
                              </div>
                            </div>
                          ) : (selectedLetter.signatureUrl || sigDataUrl) ? (
                            <img src={selectedLetter.signatureUrl || sigDataUrl} alt="E-Sign" className="h-14 object-contain mr-4" />
                          ) : (
                            // Fallback standard executive signature SVG paths
                            <svg className="w-24 h-12 text-blue-900 duration-150" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M10 25C25 15 45 5 60 20C75 35 30 40 20 20C10 0 70 8 90 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                            </svg>
                          )}
                        </div>
                      )}
                    </div>

                    <p className="font-bold text-slate-900 underline mt-1">{selectedLetter.signatory}</p>
                    <p className="text-[10px] text-slate-500">Direktur Utama</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-slate-400">
              <Eye className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-700 mb-2 animate-bounce" />
              <p className="font-bold">Pratinjau KOP Surat Perusahaan</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Silakan pilih surat keluar di bilah kiri untuk menginspeksi alur persetujuan atau melihat tampilan KOP resmi cetakan.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Draft Konsep Surat Baru */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-4 bg-blue-600 text-white font-bold text-base flex justify-between items-center shrink-0">
              <span>Konsep & Draf Surat Keluar Baru</span>
              <button onClick={() => setIsAddOpen(false)} className="text-white/80 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={submitLetterOut} className="p-6 space-y-4 text-xs md:text-sm overflow-y-auto flex-1">
              <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-blue-800 text-white rounded-xl p-4 border border-blue-800/80 space-y-3 shadow-md">
                <div className="flex items-center space-x-2">
                  <Bot className="h-5 w-5 text-blue-400 animate-pulse shrink-0" />
                  <div>
                    <span className="font-bold text-xs sm:text-sm">Gemini AI Letter Assistant</span>
                    <p className="text-[11px] text-blue-200">Ketik ide/tugas surat Anda, Gemini akan menyusun Perihal & Narasi secara otomatis.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 relative">
                    <input 
                      type="text"
                      placeholder="Ketik instruksi: 'Surat penawaran jasa e-office baru PT XYZ'..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          generateLetterWithAI();
                        }
                      }}
                      className="w-full text-xs bg-slate-950/50 border border-blue-800 rounded-lg py-2.5 pl-3 pr-16 text-white placeholder-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-450"
                    />
                    <div className="absolute right-1 top-1.5 flex items-center">
                      <select
                        value={aiLang}
                        onChange={(e) => setAiLang(e.target.value as "id" | "en")}
                        className="bg-transparent text-[10px] text-blue-200 border-none hover:text-white cursor-pointer focus:ring-0 mr-1 py-0 px-1"
                      >
                        <option value="id" className="text-slate-900">ID</option>
                        <option value="en" className="text-slate-900">EN</option>
                      </select>
                    </div>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={generateLetterWithAI}
                    disabled={isAiGenerating || !aiPrompt.trim()}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center justify-center space-x-1.5 shrink-0 transition-all cursor-pointer shadow-sm"
                  >
                    {isAiGenerating ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Menyusun...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                        <span>Tulis dengan AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Master Template & Category Dropdown fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Kategori / Jenis Surat</label>
                  <select 
                    value={letterCategory}
                    onChange={(e) => setLetterCategory(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-medium"
                    id="letter-category-select"
                  >
                    <option value="Undangan">Surat Undangan (UND)</option>
                    <option value="Penawaran">Surat Penawaran (PNW)</option>
                    <option value="Tugas">Surat Perintah Tugas (TGS)</option>
                    <option value="Keputusan">Surat Keputusan (SK)</option>
                    <option value="Pemberitahuan">Surat Pemberitahuan (PBT)</option>
                    <option value="Pengumuman">Surat Pengumuman (PGM)</option>
                    <option value="Lainnya">Korespondensi Umum (KOR)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Mulai Dengan Master Template</label>
                  <select 
                    value={selectedTpl}
                    onChange={(e) => setSelectedTpl(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  >
                    <option value="">-- Tanpa Template (Tulis Kustom) --</option>
                    {TEMPLATES.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic live letter number preview */}
              <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-150 dark:border-slate-850 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block">Format Nomor Surat Otomatis Live:</span>
                  <span className="font-mono text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-1 block">
                    {generateLetterNumber(letters.length, companySetting, letterCategory)}
                  </span>
                </div>
                <div className="shrink-0 flex items-center space-x-1.5 self-start sm:self-center">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase py-0.5 px-2 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded border border-blue-100 dark:border-blue-900/40">
                    Kategori: {letterCategory}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Nama Penerima Dokumen</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Nama Lengkap Penerima..."
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Nama Instansi / Perusahaan Tujuan</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Contoh: PT ABC Makmur"
                    value={recipientInst}
                    onChange={(e) => setRecipientInst(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Email Penerima (Untuk Kirim Resend)</label>
                  <input 
                    type="email" 
                    placeholder="Contoh: penerima@instansi.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Jabatan Penandatangan (Konseptor Resmi)</label>
                  <input 
                    type="text" 
                    placeholder="Misal: Ir. Joko Sutrisno, M.T."
                    value={signatoryName}
                    onChange={(e) => setSignatoryName(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Perihal Resmi Surat</label>
                <input 
                  type="text" 
                  placeholder="Isi judul/perihal..."
                  value={subjectVal}
                  onChange={(e) => setSubjectVal(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-805 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Isi & Narasi Teks Surat</label>
                <RichTextEditor
                  value={contentVal}
                  onChange={(val) => setContentVal(val)}
                  placeholder="Narasi utama atau isi draf surat resmi..."
                />
              </div>

              {/* Digital E-Signature Selection */}
              <div className="border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="block text-slate-700 dark:text-slate-300 font-bold text-sm">Metode Tanda Tangan Dokumen</span>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setSigType("Canvas")}
                      className={`text-xs px-3 py-1.5 rounded-md font-bold transition-all ${
                        sigType === "Canvas"
                          ? "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                    >
                      Draw Handwriting
                    </button>
                    <button
                      type="button"
                      onClick={() => setSigType("QR")}
                      className={`text-xs px-3 py-1.5 rounded-md font-bold transition-all ${
                        sigType === "QR"
                          ? "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-755 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                    >
                      E-Signature Barcode QR
                    </button>
                  </div>
                </div>

                {sigType === "Canvas" ? (
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="border border-slate-300 dark:border-slate-750 bg-slate-50 dark:bg-slate-950 rounded overflow-hidden">
                      <canvas 
                        ref={canvasRef}
                        width={280}
                        height={120}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="cursor-crosshair bg-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-450 dark:text-slate-500">Gambar tanda tangan Anda pada kanvas putih di samping menggunakan mouse atau jemari sentuh.</p>
                      <div className="flex space-x-2">
                        <button 
                          type="button" 
                          onClick={clearCanvas}
                          className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs px-3 py-1 rounded hover:bg-slate-300"
                        >
                          Bersihkan
                        </button>
                        <button 
                          type="button" 
                          onClick={saveCanvasSignature}
                          className="bg-blue-600 text-white font-bold text-xs px-3 py-1 rounded hover:bg-blue-700"
                        >
                          Kunci Tanda Tangan
                        </button>
                      </div>

                      {sigDataUrl && (
                        <span className="inline-block text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 p-1 px-2.5 rounded font-bold border border-emerald-100">
                          ✓ Tanda tangan tersimpan dan akan disematkan di draf KOP!
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {/* Interactive Visual QR Barcode Badge */}
                      <div className="p-2 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900 rounded-lg flex flex-col items-center justify-center shrink-0 shadow-sm">
                        <svg className="w-10 h-10 text-blue-600 animate-pulse animate-duration-1000" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="2" width="6" height="6" />
                          <rect x="16" y="2" width="6" height="6" />
                          <rect x="2" y="16" width="6" height="6" />
                          <path d="M10 4h4M4 10v4M10 10h4v4M16 10v4M12 16v4" />
                        </svg>
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-xs text-blue-700 dark:text-blue-400 flex items-center">
                          <span>Verified Certificate QR Code</span>
                          <span className="ml-1.5 px-1.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[8px] rounded font-bold">ACTIVE TTE</span>
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Sistem akan memancarkan QR code pengenal digital bersandi kriptografi instansi untuk penandatanganan dokumen secara sah tanpa goresan manual.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Button controllers */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 rounded hover:bg-slate-100"
                >
                  Batalkan
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold"
                >
                  Simpan Konsep (Draft)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AI Letter Assistant */}
      {isAiPanelOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-53 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-base flex justify-between items-center">
              <span className="flex items-center space-x-2">
                <Bot className="h-5 w-5 animate-bounce" />
                <span>Gemini AI Corporate Generator</span>
              </span>
              <button onClick={() => setIsAiPanelOpen(false)} className="text-white/85 hover:text-white"><X className="h-4 w-4" /></button>
            </div>

            <div className="p-5 space-y-4 text-xs md:text-sm">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Instruksi Pokok Surat</label>
                <textarea 
                  placeholder="Ketik misalnya: 'Buat surat penawaran jasa software ERP digitalisasi office kepada PT ABC Mandiri'"
                  rows={4}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-805 dark:text-slate-100 text-xs md:text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Pilihan Bahasa Output</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                    <input 
                      type="radio" 
                      name="lang" 
                      checked={aiLang === "id"} 
                      onChange={() => setAiLang("id")} 
                      className="accent-blue-600"
                    />
                    <span>Bahasa Indonesia (Formal)</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                    <input 
                      type="radio" 
                      name="lang" 
                      checked={aiLang === "en"} 
                      onChange={() => setAiLang("en")} 
                      className="accent-blue-600"
                    />
                    <span>Bahasa Inggris (Professional)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={() => setIsAiPanelOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded hover:bg-slate-105"
                  disabled={isAiGenerating}
                >
                  Tutup
                </button>
                <button 
                  onClick={generateLetterWithAI}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold px-4 py-2 rounded flex items-center space-x-1.5 disabled:opacity-50"
                  disabled={isAiGenerating}
                >
                  {isAiGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Berpikir...</span>
                    </>
                  ) : (
                    <>
                      <Bot className="h-4 w-4" />
                      <span>Konsep Surat AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: QR Code Security Verification Utility */}
      {isVerifyModalOpen && selectedLetter && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white font-bold text-sm flex justify-between items-center border-b border-slate-850">
              <span className="flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                <span>e-Office / Audit Integritas & Validitas TTE</span>
              </span>
              <button 
                onClick={() => setIsVerifyModalOpen(false)} 
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs md:text-sm max-h-[80vh] overflow-y-auto">
              {/* Dynamic Scanning Visualization */}
              <div className="relative border border-dashed border-blue-200 dark:border-blue-900/60 bg-blue-50/20 dark:bg-blue-950/10 rounded-xl p-4 flex flex-col items-center justify-center overflow-hidden">
                {/* Horizontal scanner beam animation bar */}
                <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none">
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent blur-sm animate-bounce duration-3000 opacity-70" />
                </div>

                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg shrink-0 shadow-md">
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: generateVerificationQR(
                          `FORSDIG-DOC|id:${selectedLetter.id}|vcode:${selectedLetter.verificationCode}|status:${selectedLetter.status}|signatory:${selectedLetter.signatory}`, 
                          80, 
                          80
                        ) 
                      }} 
                    />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <h5 className="font-bold text-slate-905 dark:text-slate-200 text-sm">Sertifikat Digital Valid</h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Instansi: <span className="font-semibold text-slate-700 dark:text-slate-300">PT. Foresyndo Global Indonesia</span>
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Status Keluar: <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded font-mono font-bold text-[9px] uppercase">{selectedLetter.status}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownloadQR(selectedLetter)}
                      className="flex items-center space-x-1 border border-slate-200 dark:border-slate-800 hover:bg-slate-105 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold py-1 px-2 rounded text-[10px] transition-all cursor-pointer shadow-xs"
                      title="Unduh QR Code"
                    >
                      <Download className="h-3 w-3" />
                      <span>Unduh Berkas QR (SVG)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Document Identity/Metadata Sheet */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm text-xs">
                <div className="p-3 bg-slate-50/80 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300">
                  Resensi Metadata Surat
                </div>
                <div className="divide-y divide-slate-150 dark:divide-slate-850">
                  <div className="p-3 grid grid-cols-3 gap-2">
                    <span className="text-slate-400 font-medium">Nomor Surat (Agenda)</span>
                    <span className="col-span-2 font-semibold font-mono text-slate-800 dark:text-slate-200">{selectedLetter.letterNumber}</span>
                  </div>
                  <div className="p-3 grid grid-cols-3 gap-2">
                    <span className="text-slate-400 font-medium">Perihal Dokumen</span>
                    <span className="col-span-2 font-semibold text-slate-800 dark:text-slate-200">{selectedLetter.subject}</span>
                  </div>
                  <div className="p-3 grid grid-cols-3 gap-2">
                    <span className="text-slate-400 font-medium font-sans">Penerima & Instansi</span>
                    <span className="col-span-2 text-slate-800 dark:text-slate-200">
                      <p className="font-bold">{selectedLetter.recipient}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{selectedLetter.recipientInstitution}</p>
                    </span>
                  </div>
                  <div className="p-3 grid grid-cols-3 gap-2">
                    <span className="text-slate-400 font-medium">Penandatangan Utama</span>
                    <span className="col-span-2 text-slate-800 dark:text-slate-200">
                      <p className="font-bold">{selectedLetter.signatory}</p>
                      <p className="text-[11px] text-slate-505 dark:text-slate-450">Direktur Utama (e-Sign TTE)</p>
                    </span>
                  </div>
                  <div className="p-3 grid grid-cols-3 gap-2">
                    <span className="text-slate-400 font-medium">Hash Kode Pengenal</span>
                    <span className="col-span-2 font-mono font-bold text-blue-700 dark:text-blue-400">{selectedLetter.verificationCode}</span>
                  </div>
                </div>
              </div>

              {/* Cryptographic Step-by-Step Validation Status */}
              <div className="space-y-2.5">
                <span className="block font-bold text-slate-750 dark:text-slate-300 text-xs uppercase tracking-wider">Hasil Audit Security Gateway:</span>
                
                <div className="space-y-2">
                  {/* Step 1: Format Integrity */}
                  <div className="flex items-start space-x-2.5 p-2 bg-slate-50 dark:bg-slate-950/10 border border-slate-150 dark:border-slate-850 rounded-lg">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-80s dark:text-slate-200 text-xs">Uji Integritas File & Skema Metadata</p>
                      <p className="text-[11px] text-slate-500">Kesesuaian format standar kearsipan PT. Foresyndo Global Indonesia dinyatakan 100% Valid.</p>
                    </div>
                  </div>

                  {/* Step 2: Signature Authencity based on state */}
                  <div className="flex items-start space-x-2.5 p-2 bg-slate-50 dark:bg-slate-950/10 border border-slate-150 dark:border-slate-850 rounded-lg">
                    {selectedLetter.status === "Approved Direktur" || selectedLetter.status === "Terkirim" ? (
                      <>
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-bold text-slate-805 dark:text-slate-200 text-xs">Otorisasi Tanda Tangan Elektronik (TTE)</p>
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-450 font-medium">✓ TANDA TANGAN SAH: Berkas disahkan secara legal oleh Direktur {selectedLetter.signatory} menggunakan kunci privat terverifikasi.</p>
                        </div>
                      </>
                    ) : selectedLetter.status === "Approved Manager" ? (
                      <>
                        <div className="w-4.5 h-4.5 rounded-full border-2 border-amber-400 flex items-center justify-center text-amber-500 mt-0.5 shrink-0 text-[10px] font-bold">!</div>
                        <div>
                          <p className="font-bold text-slate-805 dark:text-slate-200 text-xs">Otorisasi Tanda Tangan Elektronik (TTE)</p>
                          <p className="text-[11px] text-amber-600 dark:text-amber-500 font-medium">⚠ MENUNGGU TTE DIREKTUR: Draf disetujui Manager tetapi belum ditandatangani secara digital oleh Direktur Utama.</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-4.5 h-4.5 rounded-full border-2 border-slate-300 flex items-center justify-center text-slate-400 mt-0.5 shrink-0 text-[9px] font-bold">x</div>
                        <div>
                          <p className="font-bold text-slate-805 dark:text-slate-200 text-xs">Otorisasi Tanda Tangan Elektronik (TTE)</p>
                          <p className="text-[11px] text-slate-500">✗ DRAF NON-TTE: Berkas ini masih berstatus draf internal, sertifikasi TTE belum diterbitkan.</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Step 3: Security Timestamp Seal */}
                  <div className="flex items-start space-x-2.5 p-2 bg-slate-50 dark:bg-slate-950/10 border border-slate-150 dark:border-slate-850 rounded-lg">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-808 dark:text-slate-200 text-xs">Timestamp Kearsipan & Audit Trails</p>
                      <p className="text-[11px] text-slate-500">Didaftarkan ke server cloud pada {selectedLetter.createdAt ? new Date(selectedLetter.createdAt).toLocaleString("id-ID") : "Waktu Draft"} WIB.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Big legal status bottom section */}
              {selectedLetter.status === "Approved Direktur" || selectedLetter.status === "Terkirim" ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/45 p-3 rounded-lg text-emerald-800 dark:text-emerald-300 flex items-center space-x-3 shadow-inner">
                  <Award className="h-8 w-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <h6 className="font-extrabold text-[11px] sm:text-xs">DOKUMEN DINYATAKAN SAH (LEGAL)</h6>
                    <p className="text-[10px] leading-relaxed text-emerald-700/90 dark:text-emerald-400/80 mt-0.5">Seluruh elemen metadata surat keluar ini telah dicocokkan dengan basis data audit instansi FGI. Dokumen ini memenuhi ketentuan hukum kearsipan digital nasional.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-105 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-lg text-slate-650 dark:text-slate-400 flex items-center space-x-3">
                  <ShieldAlert className="h-8 w-8 text-amber-500 shrink-0" />
                  <div>
                    <h6 className="font-bold text-[11px] sm:text-xs text-slate-800 dark:text-slate-300">DOKUMEN INTERNAL / DRAF BELUM LEGAL</h6>
                    <p className="text-[10px] leading-relaxed mt-0.5">Surat ini masih dalam tahap peninjauan. Anda tidak diperkenankan untuk merilis surat yang belum bersertifikasi aktif kepada mitra eksternal.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsVerifyModalOpen(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-5 rounded-lg shadow-md transition-all cursor-pointer"
              >
                Tutup Review
              </button>
            </div>
          </div>
        </div>
      )}
         {/* MODAL: Email Template Review (Resend Simulator) */}
      {isEmailPreviewModalOpen && selectedLetter && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white font-bold text-sm flex justify-between items-center border-b border-slate-850">
              <span className="flex items-center space-x-2">
                <Send className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>Pratinjau Email Resmi (Resend Template Review)</span>
              </span>
              <button 
                onClick={() => setIsEmailPreviewModalOpen(false)} 
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Email client shell wrapper */}
            <div className="p-4 md:p-6 space-y-4 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-950">
              
              {/* Mail client toolbar & headers */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-2.5">
                {/* Simulated browser controls */}
                <div className="flex items-center space-x-1.5 pb-2 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  <span className="text-[10px] text-slate-400 font-mono pl-2 font-medium">resend-gateway-secure-ssl.v1</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center col-span-1">
                    <span className="w-16 font-bold text-slate-400 text-left">Dari:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      FGI Office <span className="font-mono text-slate-400 text-[10px]">&lt;onboarding@resend.dev&gt;</span>
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-16 font-bold text-slate-400 text-left">Kepada:</span>
                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded font-semibold font-mono text-[11px] border border-blue-100 dark:border-blue-900/30">
                      {selectedLetter.recipientEmail || companySetting.companyEmail}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-16 font-bold text-slate-400 text-left">Subjek:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      [FGI OFFICE] - {selectedLetter.subject}
                    </span>
                  </div>
                </div>
              </div>

              {/* LIVE RENDERED EMAIL BODY CONTAINER */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-md bg-white text-slate-800 text-left">
                
                {/* Resend Header Brand */}
                <div className="bg-blue-900 text-white p-6 border-b-4 border-blue-500">
                  <h3 className="text-lg font-extrabold tracking-wide uppercase">PT. Foresyndo Global Indonesia</h3>
                  <p className="text-[10px] text-blue-200 tracking-wider font-semibold uppercase mt-0.5">SISTEM KORESPONDENSI & ARSIP DIGITAL TERPADU</p>
                </div>

                {/* Resend Main Body Content */}
                <div className="p-6 md:p-8 space-y-6">
                  
                  {/* Subject Title Inline */}
                  <h4 className="text-sm font-bold text-slate-900 border-l-4 border-blue-900 pl-3">
                    {selectedLetter.subject}
                  </h4>

                  {/* Body Content */}
                  <div 
                    className="text-xs md:text-sm text-slate-700 leading-relaxed antialiased rich-text-preview"
                    dangerouslySetInnerHTML={{ __html: getSubstitutedContent(selectedLetter.content) }}
                  />

                  {/* Attachment indicator block */}
                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-lg flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5">
                      <FileText className="h-4.5 w-4.5 text-blue-600" />
                      <div>
                        <span className="font-bold text-slate-800">Letter_{selectedLetter.verificationCode}.pdf</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Automated Electronic Letter PDF Attachment</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold py-0.5 px-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded shrink-0 uppercase tracking-wide">
                      Auto Attached
                    </span>
                  </div>

                  {/* Credentials Sheet Metadata (Just like server.ts layout) */}
                  <div className="bg-slate-50/80 border border-slate-150 rounded-lg p-4 space-y-3">
                    <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block">Sertifikasi & Kredensial TTE</span>
                    <div className="divide-y divide-slate-150 text-xs">
                      <div className="py-2 flex justify-between">
                        <span className="text-slate-505">Nomor Surat</span>
                        <span className="font-mono font-bold text-slate-850">{selectedLetter.letterNumber || '-'}</span>
                      </div>
                      <div className="py-2 flex justify-between">
                        <span className="text-slate-505">Tanggal Surat</span>
                        <span className="font-medium text-slate-850">{selectedLetter.letterDate || '-'}</span>
                      </div>
                      <div className="py-2 flex justify-between">
                        <span className="text-slate-505">Penerima</span>
                        <span className="font-medium text-slate-850">{selectedLetter.recipient} ({selectedLetter.recipientInstitution || '-'})</span>
                      </div>
                      <div className="py-2 flex justify-between">
                        <span className="text-slate-505">Penandatangan</span>
                        <span className="font-medium text-slate-850">{selectedLetter.signatory || '-'}</span>
                      </div>
                      <div className="py-2 flex justify-between">
                        <span className="text-slate-505">Kode Verifikasi TTE</span>
                        <span className="font-mono font-bold text-slate-850 bg-slate-150 px-1.5 py-0.5 rounded text-[10px]">{selectedLetter.verificationCode}</span>
                      </div>
                      <div className="py-2 flex justify-between">
                        <span className="text-slate-400">Status Dokumen</span>
                        <span className="inline-flex items-center space-x-1 py-0.5 px-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] font-bold uppercase">
                          <span>✓ TERKIRIM & RESERVED TTE</span>
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Resend Footer Area */}
                <div className="bg-slate-50 p-6 border-t border-slate-200 text-center text-[10px] text-slate-505 leading-normal">
                  <p>
                    Pemberitahuan resmi ini dikirimkan secara otomatis oleh modul FGI Office Analytics Hub.<br />
                    Gedung FGI Hub, Lt. 12, Jakarta Selatan, DKI Jakarta.<br />
                    <em>Harap tidak membalas email ini secara langsung karena transmisi ini berjalan di bawah protokol otomatis.</em>
                  </p>
                </div>

              </div>

              {/* Informative Tip Box */}
              <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100/70 dark:border-blue-900/40 rounded-xl flex items-start space-x-2.5 text-[11px] leading-relaxed text-blue-700 dark:text-blue-300">
                <CheckCircle2 className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
                <p>
                  <strong>Tip Format Email:</strong> Pratinjau di atas mereprentasikan layout HTML resmi dari provider email cloud <strong>Resend</strong>. Jika data API key terhubung secara riil di panel rahasia (secrets), email ini akan mendarat persis seperti aslinya di kotak masuk korespondensi mitra Anda.
                </p>
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-850 flex justify-between items-center">
              <span className="text-[10px] font-semibold text-slate-400">FGI Mail Preview Engine v2</span>
              <button
                onClick={() => setIsEmailPreviewModalOpen(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-5 rounded-lg shadow-md transition-all cursor-pointer"
              >
                Kembali ke Dokumen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Print Preview & Corporate Branding Verification */}
      {isPrintPreviewModalOpen && selectedLetter && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col h-[95vh] sm:h-[90vh]">
            
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white font-bold text-sm flex justify-between items-center border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
                  <LayoutTemplate className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight">Pratinjau Cetak & Verifikasi Branding</h3>
                  <p className="text-[10px] text-slate-400 font-normal mt-0.5">Verifikasi visual tata letak dokumen (A4) dan validitas e-Sign Hub sebelum didistribusikan</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPrintPreviewModalOpen(false)} 
                className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1.5 hover:bg-slate-800 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sub-toolbar with tab toggle and direct action buttons */}
            <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-850 px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
              {/* Tab Selector */}
              <div className="flex bg-slate-200 dark:bg-slate-850 p-1 rounded-xl w-full sm:w-auto">
                <button
                  onClick={() => setPreviewTab("visual")}
                  className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    previewTab === "visual"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:hover:text-slate-200"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Draft Visual A4</span>
                </button>
                <button
                  onClick={() => setPreviewTab("pdf")}
                  className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    previewTab === "pdf"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:hover:text-slate-200"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>PDF Stream Asli</span>
                </button>
              </div>

              {/* Instant Actions */}
              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => {
                    const doc = generateLetterPDFDoc(selectedLetter);
                    if (doc) {
                      doc.save(`Draft_${selectedLetter.verificationCode}.pdf`);
                    }
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold py-1.5 px-3.5 rounded-lg text-xs transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-slate-300" />
                  <span>Unduh PDF</span>
                </button>

                <button
                  onClick={() => {
                    try {
                      const doc = generateLetterPDFDoc(selectedLetter);
                      if (doc) {
                        const blobUrl = doc.output("bloburl");
                        const printWindow = window.open(blobUrl, "_blank");
                        if (printWindow) {
                          printWindow.print();
                        } else {
                          // fallback standard print window
                          window.print();
                        }
                      }
                    } catch (e) {
                      console.error("Print failed:", e);
                      window.print();
                    }
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3.5 rounded-lg text-xs transition-all cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Cetak Dokumen</span>
                </button>
              </div>
            </div>

            {/* Split Panel Layout */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-slate-100 dark:bg-slate-900">
              
              {/* Left Side: Preview Frame */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 flex justify-center items-start border-r border-slate-200 dark:border-slate-850">
                {previewTab === "visual" ? (
                  /* High Fidelity Visual A4 Simulator */
                  <div className="w-full max-w-[210mm] bg-white text-slate-850 p-8 sm:p-12 md:p-14 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl font-serif text-left relative min-h-[297mm] transition-all">
                    {/* Watermark background on preview */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
                      <div className="border-[8px] border-blue-900 rounded-full p-24">
                        <span className="text-4xl font-sans font-black tracking-widest text-blue-900">FGI HUB</span>
                      </div>
                    </div>

                    {/* Letter Head (KOP SURAT) */}
                    <div className="flex border-b-4 border-slate-900 pb-4 mb-6 items-center">
                      <div className="mr-5 shrink-0 bg-white p-1 rounded border border-slate-100">
                        {companySetting.companyLogo ? (
                          <img src={companySetting.companyLogo} alt="Logo" className="h-14 max-w-[140px] object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          <FgiLogo size={48} />
                        )}
                      </div>
                      <div className="flex-1">
                        <h1 className="font-sans font-extrabold text-2xl tracking-tight text-slate-900 uppercase leading-none">{companySetting.companyName}</h1>
                        <p className="text-xs font-sans text-slate-500 font-medium leading-normal mt-1">{companySetting.companyAddress}</p>
                        <p className="text-[11px] font-sans text-slate-400 font-medium mt-0.5">Telp: {companySetting.companyPhone} | Email: {companySetting.companyEmail}</p>
                      </div>
                    </div>

                    {/* Subtitle / Agenda dates */}
                    <div className="flex justify-between items-start text-xs sm:text-sm font-sans font-medium mb-6 gap-4">
                      <div className="grid grid-cols-[auto_16px_1fr] text-slate-650 shrink text-left">
                        <span className="text-slate-400 font-bold">Nomor</span>
                        <span className="text-slate-400 font-bold text-center">:</span>
                        <span className="font-mono font-bold tracking-tight text-indigo-700">{selectedLetter.letterNumber}</span>

                        <span className="text-slate-400 font-bold mt-1">Sifat</span>
                        <span className="text-slate-400 font-bold text-center mt-1">:</span>
                        <span className="text-slate-700 font-normal mt-1">Biasa / Terbuka</span>

                        <span className="text-slate-400 font-bold mt-1">Hal</span>
                        <span className="text-slate-400 font-bold text-center mt-1">:</span>
                        <span className="text-slate-900 font-bold mt-1 text-wrap break-words">{selectedLetter.subject}</span>
                      </div>
                      <div className="shrink-0 text-right text-slate-800 font-medium">
                        <p>Jakarta, {selectedLetter.letterDate ? formatDateIndo(selectedLetter.letterDate) : getCurrentFormattedDate()}</p>
                      </div>
                    </div>

                    {/* Recipient Address */}
                    <div className="text-xs sm:text-sm font-sans leading-relaxed mb-6 space-y-0.5">
                      <p className="text-slate-400">Kepada Yth,</p>
                      <p className="font-bold text-slate-900 text-sm">{selectedLetter.recipient}</p>
                      <p className="font-medium text-slate-600">{selectedLetter.recipientInstitution}</p>
                      <p className="text-slate-400">Di tempat</p>
                    </div>

                    {/* Core contents structured paragraph rendering */}
                    <div 
                      className="text-xs sm:text-sm text-slate-800 leading-relaxed mb-8 min-h-[220px] font-sans rich-text-preview text-justify space-y-4"
                      dangerouslySetInnerHTML={{ __html: getSubstitutedContent(selectedLetter.content) }}
                    />

                    {/* Sign-off e-signature blocks and integrity check stamps */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-t border-slate-100 pt-6">
                      {/* QR code Integrity block */}
                      <div className="flex items-center space-x-3 text-[10px] font-sans text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-100 shrink-0">
                        <div 
                          className="cursor-pointer shrink-0 p-1 bg-white border border-slate-200 rounded" 
                          onClick={() => alert(`Informasi Verifikasi Dokumen:\nNomor: ${selectedLetter.letterNumber}\nTanggal: ${selectedLetter.letterDate}\nPenandatangan: ${selectedLetter.signatory}\nStatus: ${selectedLetter.status}\nIntegrity Code: ${selectedLetter.verificationCode}`)}
                          dangerouslySetInnerHTML={{ __html: generateVerificationQR(selectedLetter.verificationCode, 64, 64) }} 
                        />
                        <div>
                          <p className="font-bold text-slate-800">QR Verifikasi Dokumen</p>
                          <p className="font-mono mt-0.5 text-indigo-700 font-bold">{selectedLetter.verificationCode}</p>
                          <span className="text-[9px] text-slate-400 block mt-0.5">DOKUMEN TERVERIFIKASI SAH<br/>Pindai untuk audit log instansi</span>
                        </div>
                      </div>

                      {/* Signatory name and PNG sign-stamp */}
                      <div className="text-left sm:text-right text-xs sm:text-sm font-sans pr-4">
                        <p className="text-slate-500">Hormat kami,</p>
                        <p className="font-bold text-slate-900 mt-1 uppercase">{companySetting.companyName}</p>
                        
                        {/* Digital Signature */}
                        <div className="h-16 flex justify-start sm:justify-end items-center my-2 relative min-w-[150px]">
                          {selectedLetter.signatureEnabled && (
                            <div className="absolute left-0 sm:right-0 opacity-85 hover:opacity-100 transition-opacity flex items-center justify-center">
                              {selectedLetter.signatureType === "QR" ? (
                                <div className="flex items-center space-x-2 border border-blue-200 bg-blue-50/50 p-1.5 rounded-lg shadow-sm text-left">
                                  {/* Clean Mini QR-like SVG decoration */}
                                  <div className="w-8 h-8 bg-white border border-blue-300 p-0.5 rounded flex flex-col justify-between shrink-0">
                                    <svg className="w-full h-full text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <rect x="1" y="1" width="6" height="6" strokeWidth="2.5" />
                                      <rect x="17" y="1" width="6" height="6" strokeWidth="2.5" />
                                      <rect x="1" y="17" width="6" height="6" strokeWidth="2.5" />
                                      <path d="M12 4h2M4 12V14M12 12V20M20 12v4M16 16h4" strokeWidth="1.5" />
                                    </svg>
                                  </div>
                                  <div className="text-[9px] leading-tight text-blue-800">
                                    <p className="font-bold tracking-tight">TTE VERIFIED</p>
                                    <p className="text-[8px] text-slate-500 font-mono">TTE-{selectedLetter.verificationCode.substring(4)}</p>
                                    <span className="text-[7.5px] text-emerald-600 bg-emerald-50 px-1 rounded font-semibold border border-emerald-100 block mt-0.5">e-Sign Forsdig</span>
                                  </div>
                                </div>
                              ) : (selectedLetter.signatureUrl || sigDataUrl) ? (
                                <img src={selectedLetter.signatureUrl || sigDataUrl} alt="E-Sign" className="h-14 object-contain" />
                              ) : (
                                // Fallback standard executive signature SVG paths
                                <svg className="w-24 h-12 text-blue-900 duration-150" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M10 25C25 15 45 5 60 20C75 35 30 40 20 20C10 0 70 8 90 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                                </svg>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="pt-2">
                          <p className="font-bold text-slate-900 border-b border-slate-300 pb-0.5 inline-block min-w-[120px]">{selectedLetter.signatory}</p>
                          <p className="text-[11px] text-slate-500 mt-1">Direktur Utama</p>
                        </div>
                      </div>
                    </div>

                    {/* Footer Page Number mockup */}
                    <div className="absolute bottom-4 right-8 text-[10px] font-sans text-slate-400 font-semibold">
                      Hal 1 dari 1
                    </div>
                  </div>
                ) : (
                  /* Real PDF stream object iframe rendering */
                  <div className="w-full h-full min-h-[500px] bg-slate-700 rounded-xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col">
                    {pdfDataUri ? (
                      <iframe
                        src={`${pdfDataUri}#toolbar=1`}
                        title="PDF Document Stream"
                        className="w-full h-full min-h-[550px] flex-1 border-none"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-white p-6 space-y-4">
                        <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin" />
                        <p className="font-bold text-sm">Menghasilkan file PDF asli...</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Side: Verification Sidebar */}
              <div className="w-full md:w-80 bg-white dark:bg-slate-900 p-5 md:p-6 overflow-y-auto flex flex-col space-y-5 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 shrink-0 text-left">
                <div>
                  <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-2">Pemeriksaan Branding</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Sistem memverifikasi visual logo, nama instansi, dan legalitas kop surat sesuai aturan identitas PT Foresyndo Global Indonesia.
                  </p>
                </div>

                <div className="space-y-3.5">
                  <div className="flex items-start space-x-3 p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-150 dark:border-slate-800">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">Logo Perusahaan</h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">Logo formal berwarna biru navy tersemat di kop surat.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-150 dark:border-slate-800">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">Kop Surat Terpadu</h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">Sesuai standar alamat instansi dan kontak resmi.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-150 dark:border-slate-800">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">Kode Unik Keaslian QR</h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">TTE QR Code dan serial ({selectedLetter.verificationCode}) sinkron.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-150 dark:border-slate-800 space-y-3">
                  <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Kredensial Dokumen</h4>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between py-1 border-b border-dashed border-slate-150 dark:border-slate-800">
                      <span className="text-slate-400">Nomor:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{selectedLetter.letterNumber}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-dashed border-slate-150 dark:border-slate-800">
                      <span className="text-slate-400">Status:</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedLetter.status}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-dashed border-slate-150 dark:border-slate-800">
                      <span className="text-slate-400">TTE Sign:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedLetter.signatureEnabled ? "AKTIF" : "NONAKTIF"}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl text-[11px] text-indigo-700 dark:text-indigo-300 leading-relaxed mt-auto">
                  💡 <strong>Tip Distribusi:</strong> Gunakan tab <strong>PDF Stream Asli</strong> untuk menginspeksi tata letak halaman jika isi surat sangat panjang dan meluber ke halaman berikutnya.
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
              <span className="text-[10px] font-mono text-slate-400">Forsdig Layout Viewer Engine v3.2</span>
              <button
                onClick={() => setIsPrintPreviewModalOpen(false)}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold py-2 px-6 rounded-xl transition-all cursor-pointer shadow-md"
              >
                Tutup Pratinjau
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
