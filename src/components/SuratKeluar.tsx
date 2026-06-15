import React, { useState, useRef, useEffect } from "react";
import { Plus, Search, FileText, Bot, Send, Check, ShieldCheck, Signature, Sparkles, Printer, UserCheck, Eye, RefreshCw, X, Edit3 } from "lucide-react";
import { LetterOut, UserRole, UserProfile, CompanySetting } from "../types";
import { generateLetterNumber, injectTemplateVariables, generateVerificationQR } from "../utils";
import { jsPDF } from "jspdf";

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

Perkenalkan kami dari PT FORSDIG TEKNOLOGI INDONESIA, perusahaan inovator utama pada penyempurnaan sistem informasi korporat. Berselang dengan transisi bisnis digital nasional, kami bermaksud menawarkan kemitraan strategis kepada {{nama_penerima}} selaku {{jabatan}} {{alamat}}.

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
  const [subjectVal, setSubjectVal] = useState("");
  const [contentVal, setContentVal] = useState("");
  const [signatoryName, setSignatoryName] = useState("Ir. Joko Sutrisno, M.T.");
  const [selectedTpl, setSelectedTpl] = useState("");

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
        setContentVal(found.content);
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
        setContentVal(`${data.opening}\n\n${data.body}\n\n${data.closing}`);
        setSignatoryName(data.signatoryRole || "Direktur Utama");
        setIsAiPanelOpen(false);
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
        setContentVal(`${data.opening}\n\n${data.body}\n\n${data.closing}`);
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
    const letterNoAuto = generateLetterNumber(indexSeq, companySetting);
    const verificationCode = `DOC-${new Date().toISOString().replace(/[-:T]/g, "").substring(0, 8)}-${String(indexSeq + 1).padStart(3, "0")}`;

    onAddLetter({
      letterNumber: letterNoAuto,
      letterDate: new Date().toISOString().split("T")[0],
      recipient: recipientName,
      recipientInstitution: recipientInst || "PT Umum / Klien Resmi",
      subject: subjectVal || "Surat Resmi Korespondensi",
      content: contentVal,
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
    setSubjectVal("");
    setContentVal("");
    setSelectedTpl("");
    setSigDataUrl("");
    setSigType("Canvas");
    setIsAddOpen(false);
  };

  // Trigger print document
  const triggerPrint = () => {
    window.print();
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

  // Export letter to highly detailed PDF matching kop surat
  const handleExportPDF = (letter: LetterOut) => {
    if (!letter) return;
    
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
      // --- 1. Draw Corporate Letter Head Logo (Rounded Rect with Gold contrast) ---
      doc.setFillColor(30, 41, 142); // Navy Blue
      doc.roundedRect(20, 15, 14, 14, 2, 2, "F");
      
      doc.setFillColor(234, 179, 8); // Golden Accent Accent Dot
      doc.circle(23, 26, 1.5, "F");

      // Logo text white bold
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("FGI", 26, 23.5, { align: "center" });

      // --- 2. Company Name and Details (KOP SURAT) ---
      doc.setTextColor(15, 23, 42); // Navy / Dark slate
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(companySetting.companyName.toUpperCase(), 38, 19.5);

      doc.setTextColor(71, 85, 105); // Slate Dark Grey
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      
      const addrWithFormat = companySetting.companyAddress;
      const addressLines = doc.splitTextToSize(addrWithFormat, 150);
      doc.text(addressLines, 38, 24);
      
      // Telephone & email details line
      const detailsLineY = 24 + (addressLines.length * 3.8);
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 142);
      doc.text("e-Office & Digital Signature Hub", 38, detailsLineY);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(` |  Telp: ${companySetting.companyPhone}  |  Email: ${companySetting.companyEmail}`, 85, detailsLineY);

      // --- 3. Premium Double Divider borders ---
      const lineY = detailsLineY + 3.5;
      doc.setDrawColor(30, 41, 142);
      doc.setLineWidth(1.0);
      doc.line(20, lineY, 190, lineY);
      
      // Thin slate line
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.3);
      doc.line(20, lineY + 0.95, 190, lineY + 0.95);

      // Page numbering indicator at the very bottom right
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Hal ${pageNumber}`, 190, 287, { align: "right" });
      
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
    doc.text(dateOutput, 190, metaY, { align: "right" });

    // --- 5. Letter Metadata Group (Left) with Clean Tabular Columns ---
    doc.setFont("helvetica", "bold");
    doc.text("Nomor :", 20, metaY);
    doc.text("Sifat  :", 20, metaY + 5.5);
    doc.text("Hal    :", 20, metaY + 11);

    doc.setFont("courier", "bold"); // Courier for authentic serial/routing number feel
    doc.setFontSize(10.5);
    doc.setTextColor(30, 41, 142);
    doc.text(letter.letterNumber, 36, metaY);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text("Biasa / Terbuka", 36, metaY + 5.5);
    
    // Subject with wrapping
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    const subjectWrapped = doc.splitTextToSize(letter.subject, 105);
    doc.text(subjectWrapped, 36, metaY + 11);

    // --- 6. Recipient Details with Better Padding ---
    const recipientY = metaY + 13 + (subjectWrapped.length * 4.8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text("Kepada Yth,", 20, recipientY);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(letter.recipient, 20, recipientY + 5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(letter.recipientInstitution, 20, recipientY + 9.5);
    doc.text("Di tempat", 20, recipientY + 14);

    // --- 7. Content (Body) with Dynamic Spacing & Automatic Multi-Page Flow ---
    let bodyY = recipientY + 22;
    doc.setFont("times", "normal"); // Times Roman is the golden standard for formal affairs
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59); // Crisp deep charcoal body text (less harsh than pure black)

    // Substitute template vars
    const formattedContent = injectTemplateVariables(letter.content, {
      nomor_surat: letter.letterNumber,
      tanggal: letter.letterDate ? formatDateIndo(letter.letterDate) : getCurrentFormattedDate(),
      nama_penerima: letter.recipient,
      alamat: letter.recipientInstitution,
      jabatan: letter.signatory,
      perihal: letter.subject,
      nama_direktur: letter.signatory
    });

    // Split letter content by single/double newlines into clean logical paragraphs
    const paragraphs = formattedContent.split(/\n+/).map(p => p.trim()).filter(Boolean);
    const paragraphGap = 6; // Spacing between distinct paragraphs in mm
    const footerSafeZoneY = 210; // Reserve bottom section for Signature and QR block (77mm)

    doc.setTextColor(15, 23, 42);

    for (let i = 0; i < paragraphs.length; i++) {
      const pText = paragraphs[i];
      const pWrappedLines = doc.splitTextToSize(pText, contentWidth);
      const pHeight = pWrappedLines.length * 5.2; // 5.2mm per line with line height multiplier

      // If rendering this paragraph pushes us beyond the safe zone on current page...
      if (bodyY + pHeight > (currentPage === 1 ? footerSafeZoneY : 240)) {
        // Add new page
        doc.addPage();
        currentPage++;
        bodyY = drawLetterhead(currentPage) + 12;
        doc.setFont("times", "normal");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
      }

      // Render paragraph
      doc.text(pText, leftMargin, bodyY, {
        align: "justify",
        maxWidth: contentWidth,
        lineHeightFactor: 1.35
      });
      bodyY += pHeight + paragraphGap;
    }

    // --- 8. QR Code and Signatures Footer Grid ---
    // If we have pushed too far on page block, put signatures on next page to avoid crowding
    let footerY = 228;
    if (bodyY > 218) {
      doc.addPage();
      currentPage++;
      let finalHeaderY = drawLetterhead(currentPage);
      footerY = finalHeaderY + 25; // Render high up on next page if flowed over
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
    doc.roundedRect(20, footerY - 2, 78, qrBoxSize + 8, 2, 2, "FD");

    // Draw small green shield-check "DOKUMEN ASLI SAH" badge inside container
    doc.setFillColor(16, 185, 129); // Emerald Green
    doc.circle(26, footerY + 2.5, 1.8, "F");
    
    doc.setTextColor(16, 185, 129);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("DOKUMEN TERVERIFIKASI SAH", 29.5, footerY + 3.2);

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

    const startQRX = 24;
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
    const qrDescX = 24 + qrBoxSize + 4;
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
    const signX = 145;
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
      doc.text("PT FORSDIG", signX + 18, footerY + 10, { align: "center" });
      doc.text("INDONESIA", signX + 18, footerY + 12.5, { align: "center" });
      
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
        doc.setLineWidth(0.5);
        doc.line(signX, footerY + 12, signX + 22, footerY + 14);
        doc.line(signX + 4, footerY + 14, signX + 13, footerY + 9);
        doc.line(signX + 8, footerY + 8, signX + 26, footerY + 13);
        doc.circle(signX + 18, footerY + 11, 2);
      }
    } else if (letter.signatureEnabled) {
      // Draw elegant vector handwriting loops fallback
      doc.setDrawColor(30, 41, 142);
      doc.setLineWidth(0.5);
      doc.line(signX, footerY + 12, signX + 22, footerY + 14);
      doc.line(signX + 4, footerY + 14, signX + 13, footerY + 9);
      doc.line(signX + 8, footerY + 8, signX + 26, footerY + 13);
      doc.circle(signX + 18, footerY + 11, 2);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(letter.signatory, signX, footerY + 22.8);
    
    doc.setLineWidth(0.35);
    doc.setDrawColor(15, 23, 42);
    doc.line(signX, footerY + 23.4, signX + 44, footerY + 23.4);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text("Direktur Utama", signX, footerY + 27.2);

    // Save triggers download with neat ID filename
    doc.save(`${letter.verificationCode}_LettersOut.pdf`);
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
          <button 
            onClick={() => setIsAddOpen(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 font-semibold text-white px-4 py-2.5 rounded-lg text-sm transition-all shadow-sm"
            id="btn-buat-surat-keluar"
          >
            <Plus className="h-4 w-4" />
            <span>Konsep Surat Baru</span>
          </button>
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
                          onUpdateStatus(selectedLetter.id, "Terkirim", "Sent to recipient via automatic SMTP engine protocol.");
                          setSelectedLetter({...selectedLetter, status: "Terkirim"});
                          
                          // Simulated SMTP triggers in background
                          fetch("/api/email/send", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              to: companySetting.companyEmail,
                              subject: selectedLetter.subject,
                              body: selectedLetter.content,
                              attachmentName: `Letter_${selectedLetter.verificationCode}.pdf`
                            })
                          }).then(res => res.json()).then(resp => {
                            if (resp.success) {
                              alert(`Notifikasi Email SMTP Terkirim ke ${selectedLetter.recipient} (${resp.log?.smtpHost})`);
                            }
                          });
                        }}
                        className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1.5 px-4 rounded text-xs transition-all animate-bounce"
                        id="btn-dispatch-terkirim"
                      >
                        <Send className="h-3 w-3" />
                        <span>Kirim Surat PDF (SMTP)</span>
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

                    {/* EXPORT TO PDF */}
                    <button 
                      onClick={() => handleExportPDF(selectedLetter)}
                      className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3.5 rounded text-xs transition-all cursor-pointer"
                      id="btn-ekspor-pdf"
                    >
                      <FileText className="h-3 w-3" />
                      <span>Ekspor PDF</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Physical Kop Surat Frame */}
              <div 
                className="bg-white text-slate-800 p-8 border border-slate-200 rounded-xl shadow-lg font-serif print:border-0 print:p-0 print:shadow-none"
                id="printable-kop-letter"
              >
                {/* Letter Head (KOP SURAT) */}
                <div className="flex border-b-4 border-slate-900 pb-4 mb-6 items-center">
                  {/* Corporate design SVG vector logo */}
                  <div className="p-3 bg-blue-900 text-white rounded-lg mr-4 shrink-0 font-sans font-extrabold tracking-tighter text-xl">
                    FGI
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
                <div className="text-xs text-slate-850 leading-relaxed whitespace-pre-line mb-8 min-h-[160px] font-sans">
                  {getSubstitutedContent(selectedLetter.content)}
                </div>

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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-blue-600 text-white font-bold text-base flex justify-between items-center">
              <span>Konsep & Draf Surat Keluar Baru</span>
              <button onClick={() => setIsAddOpen(false)} className="text-white/80 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={submitLetterOut} className="p-6 space-y-4 text-xs md:text-sm">
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

              {/* Master Template Dropdown field */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <textarea 
                  required
                  placeholder="Narasi utama atau isi draf surat resmi..."
                  rows={6}
                  value={contentVal}
                  onChange={(e) => setContentVal(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 font-sans text-xs md:text-sm text-slate-800 dark:text-slate-100 focus:outline-blue-500"
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
    </div>
  );
}
