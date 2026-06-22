import React, { useState } from "react";
import { Plus, Search, FileText, Share2, CornerDownRight, Check, AlertTriangle, ArrowUpRight, UploadCloud, X, User, Sparkles, RefreshCw } from "lucide-react";
import { LetterIn, UserRole, Disposition, UserProfile } from "../types";
import { collection, addDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { jsPDF } from "jspdf";

interface SuratMasukProps {
  letters: LetterIn[];
  currentRole: UserRole;
  currentUser: UserProfile;
  onAddLetter: (letter: Omit<LetterIn, "id" | "createdAt" | "createdBy">) => void;
  onUpdateStatus: (letterId: string, status: LetterIn["status"]) => void;
  onAddDisposition: (letterId: string, disposition: Omit<Disposition, "id" | "senderId" | "senderName" | "createdAt" | "letterSubject">) => void;
}

export default function SuratMasuk({ 
  letters, 
  currentRole, 
  currentUser, 
  onAddLetter, 
  onUpdateStatus, 
  onAddDisposition 
}: SuratMasukProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Semua");
  const [urgencyFilter, setUrgencyFilter] = useState("Semua");
  const [selectedLetter, setSelectedLetter] = useState<LetterIn | null>(null);

  // Form states - Add Letter
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [agendaNo, setAgendaNo] = useState("");
  const [letterNo, setLetterNo] = useState("");
  const [letterDate, setLetterDate] = useState("");
  const [receivedDate, setReceivedDate] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderInst, setSenderInst] = useState("");
  const [subjectText, setSubjectText] = useState("");
  const [categoryVal, setCategoryVal] = useState("Legal");
  const [urgencyVal, setUrgencyVal] = useState<LetterIn["urgency"]>("Biasa");
  const [attachedName, setAttachedName] = useState("");

  // Disposisi states
  const [isDispOpen, setIsDispOpen] = useState(false);
  const [dispNotes, setDispNotes] = useState("");
  const [dispPriority, setDispPriority] = useState<Disposition["priority"]>("Sedang");
  const [dispTarget, setDispTarget] = useState("Manager");

  // Drag over state for attachments
  const [isDragging, setIsDragging] = useState(false);

  // AI Smart Assistant states
  const [aiStatus, setAiStatus] = useState<"IDLE" | "LOADING" | "ERROR">("IDLE");
  const [aiOutput, setAiOutput] = useState<string>("");
  const [aiActionName, setAiActionName] = useState<string>("");

  const formatDateIndo = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr || "-";
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    } catch {
      return dateStr || "-";
    }
  };

  const handleExportPDF = (letter: LetterIn) => {
    if (!letter) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // Fetch company settings from localStorage for corporate identity decoration
    const saved = localStorage.getItem("company_setting");
    let companyName = "PT. Foresyndo Global Indonesia";
    let companyAddress = "MTH Square, Lt. 1 No. 03A, Jl. Letjen M.T. Haryono Kav. 10, Jakarta Timur";
    let companyPhone = "+62 21 80010200";
    let companyEmail = "info@foresyndoglobalindonesia.my.id";
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.companyName) companyName = parsed.companyName;
        if (parsed.companyAddress) companyAddress = parsed.companyAddress;
        if (parsed.companyPhone) companyPhone = parsed.companyPhone;
        if (parsed.companyEmail) companyEmail = parsed.companyEmail;
      } catch (e) {}
    }

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
      doc.text(companyName.toUpperCase(), 38, 19.5);

      doc.setTextColor(71, 85, 105); // Slate Dark Grey
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      
      const addressLines = doc.splitTextToSize(companyAddress, 150);
      doc.text(addressLines, 38, 24);
      
      // Telephone & email details line
      const detailsLineY = 24 + (addressLines.length * 3.8);
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 142);
      doc.text("e-Office & Digital Signature Hub", 38, detailsLineY);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(` |  Telp: ${companyPhone}  |  Email: ${companyEmail}`, 85, detailsLineY);

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

    // Title: LEMBAR DISPOSISI & AGENDA SURAT MASUK
    currentY += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("LEMBAR AGENDA & DISPOSISI SURAT MASUK", 105, currentY, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Dicetak secara resmi pada: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 105, currentY + 4.5, { align: "center" });

    currentY += 12;

    // SECTION I: AGENDA REGISTRATION
    doc.setFillColor(241, 245, 249);
    doc.rect(20, currentY, 170, 7, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 142);
    doc.text("I. INFORMASI AGENDA KANTOR & REGISTRASI", 24, currentY + 5);

    currentY += 10;

    // Metadata Grid (Table-like structure)
    doc.setFontSize(8.5);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);

    // Helper row draw
    const drawMetaRow = (label1: string, val1: string, label2: string, val2: string, yPos: number) => {
      // Background for label columns
      doc.setFillColor(248, 250, 252);
      doc.rect(20, yPos, 40, 7, "F");
      doc.rect(105, yPos, 35, 7, "F");

      // Borders
      doc.rect(20, yPos, 170, 7);
      doc.line(60, yPos, 60, yPos + 7);
      doc.line(105, yPos, 105, yPos + 7);
      doc.line(140, yPos, 140, yPos + 7);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text(label1, 23, yPos + 4.8);
      doc.text(label2, 108, yPos + 4.8);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(val1, 63, yPos + 4.8);
      doc.text(val2, 143, yPos + 4.8);
    };

    drawMetaRow("No. Agenda", letter.agendaNumber || "-", "Tgl. Diterima", letter.receivedDate ? formatDateIndo(letter.receivedDate) : "-", currentY);
    currentY += 7;
    drawMetaRow("Sifat Surat", letter.urgency || "-", "Kategori", letter.category || "-", currentY);
    currentY += 7;
    drawMetaRow("No. Surat Asal", letter.letterNumber || "-", "Tgl. Surat Asal", letter.letterDate ? formatDateIndo(letter.letterDate) : "-", currentY);
    currentY += 7;
    drawMetaRow("Status Berkas", letter.status || "-", "Diinput Oleh", "Sistem e-Office", currentY);

    currentY += 12;

    // SECTION II: SENDER & SUBJECT DETAILS
    doc.setFillColor(241, 245, 249);
    doc.rect(20, currentY, 170, 7, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 142);
    doc.text("II. DETIL PENGIRIM & PERIHAL SURAT", 24, currentY + 5);

    currentY += 10;

    // Sender Details Group Box
    doc.setDrawColor(203, 213, 225);
    doc.rect(20, currentY, 170, 34);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text("Nama Pengirim / Kontak:", 24, currentY + 5);
    doc.text("Nama Instansi / Perusahaan:", 24, currentY + 14);
    doc.text("Isi Ringkasan Perihal:", 24, currentY + 23);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(letter.sender || "-", 24, currentY + 9);
    doc.text(letter.senderInstitution || "-", 24, currentY + 18);

    const subjectTextWrapped = doc.splitTextToSize(letter.subject || "-", 162);
    doc.text(subjectTextWrapped, 24, currentY + 27);

    currentY += 41;

    // SECTION III: DISPOSITION INSTRUCTIONS LOG
    doc.setFillColor(241, 245, 249);
    doc.rect(20, currentY, 170, 7, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 142);
    doc.text("III. INSTRUKSI DISPOSISI & TINDAK LANJUT", 24, currentY + 5);

    currentY += 10;

    const dispositions = letter.dispositions || [];
    if (dispositions.length === 0) {
      doc.setDrawColor(226, 232, 240);
      doc.rect(20, currentY, 170, 16);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text("Belum ada instruksi disposisi terdaftar untuk lembar agenda surat masuk ini.", 24, currentY + 9.5);
      currentY += 21;
    } else {
      dispositions.forEach((disp, idx) => {
        // Prepare new page if space is low
        if (currentY > 230) {
          doc.addPage();
          currentPage++;
          currentY = drawLetterhead(currentPage) + 5;
        }

        // Prepare instruction block
        doc.setDrawColor(203, 213, 225);
        doc.setFillColor(248, 250, 252);
        doc.rect(20, currentY, 170, 28, "F");
        doc.rect(20, currentY, 170, 28);

        // Header line of individual disposition
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 142);
        doc.text(`Disposisi #${idx + 1} - Ditujukan Kepada: ${disp.targetRole || "Staf"}`, 24, currentY + 5.5);

        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Tanggal Disposisi: ${disp.createdAt || "-"}  |  Prioritas: ${disp.priority || "Sedang"}`, 120, currentY + 5.5);

        doc.line(20, currentY + 8, 190, currentY + 8);

        // Instruction notes
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        
        const noteLines = doc.splitTextToSize(disp.notes || "-", 160);
        doc.text(noteLines, 24, currentY + 12.5);

        // Sender signature line
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text(`Dikeluarkan Oleh Pimpinan: ${disp.senderName || "Direksi / Atasan"}`, 24, currentY + 24.5);

        currentY += 32;
      });
    }

    // Bottom verification notice & signature placeholder
    if (currentY > 220) {
      doc.addPage();
      currentPage++;
      currentY = drawLetterhead(currentPage) + 5;
    }

    currentY += 10;
    doc.setDrawColor(203, 213, 225);
    doc.line(20, currentY, 190, currentY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("Lembar dokumen ini merupakan salinan digital resmi dari agenda surat masuk yang tercatat pada Aplikasi e-Office PT. Foresyndo Global Indonesia.", 20, currentY + 5);
    doc.text("Segala bentuk perubahan atau penyalinan yang tidak sah merupakan tanggung jawab penuh pihak bersangkutan.", 20, currentY + 8.5);

    // Authentic stamp & signature section on right corner
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text("Mengetahui,", 150, currentY + 16, { align: "center" });
    doc.text("Petugas Pengarsip / Sekretaris,", 150, currentY + 20, { align: "center" });

    // Dummy signature dotted line
    doc.setDrawColor(148, 163, 184);
    doc.line(130, currentY + 38, 170, currentY + 38);
    doc.text("( __________________________ )", 150, currentY + 41.5, { align: "center" });

    // Download file trigger
    doc.save(`SuratMasuk_NoAgenda_${letter.agendaNumber || "Unknown"}.pdf`);
  };

  const runAiAction = async (actionType: "RINGKASAN" | "BALASAN" | "DISPOSISI" | "PDF", letter: LetterIn) => {
    setAiStatus("LOADING");
    setAiOutput("");
    
    let titleMsg = "";
    let promptToSend = "";
    
    if (actionType === "RINGKASAN") {
      titleMsg = "Ringkasan Eksekutif";
      promptToSend = `Tolong bantu saya meringkas perihal surat masuk berikut ini secara profesional dan padat dalam Bahasa Indonesia: "${letter.subject}". Surat dikirimkan oleh ${letter.sender} dari instansi ${letter.senderInstitution} berkategori ${letter.category}. Sifat surat: ${letter.urgency}. Sediakan daftar poin penting dan berikan nada formal.`;
    } else if (actionType === "BALASAN") {
      titleMsg = "Draf Balasan Surat Resmi";
      promptToSend = `Tolong bantu saya menyusun draf balasan formal atas surat masuk dengan subjek "${letter.subject}" dari ${letter.sender} (${letter.senderInstitution}). Format draf tanggapan dalam surat balasan perusahaan "PT. Foresyndo Global Indonesia" secara sopan, lugas, dan rapi menggunakan Bahasa Indonesia baku.`;
    } else if (actionType === "DISPOSISI") {
      titleMsg = "Rekomendasi Petunjuk Disposisi";
      promptToSend = `Tolong buatkan rekomendasi instruksi atau perintah disposisi yang tepat dari Direksi/Pimpinan untuk diturunkan ke staff operasional atas surat masuk bertema: "${letter.subject}" yang dikirim oleh ${letter.sender}. Berikan 3 poin petunjuk taktis yang jelas.`;
    } else if (actionType === "PDF") {
      titleMsg = "Analisis Kepatuhan Berkas Lampiran PDF";
      promptToSend = `Tolong lakukan analisis kepatuhan (legal & business check) dari berkas lampiran simulasi bernama "${letter.attachmentName || "Lampiran_Dokumen.pdf"}" yang dilampirkan pada surat perihal: "${letter.subject}". Ulas keabsahan administratif dan sebutkan potensi risiko operasional secara singkat.`;
    }

    setAiActionName(titleMsg);

    try {
      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptToSend, mode: "text" })
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Response is not JSON format (404 Not Found error from Vercel Serverless)");
      }

      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || "Gagal menghasilkan hasil AI");
      }

      const responseText = data.text || "OK";
      setAiOutput(responseText);
      setAiStatus("IDLE");

      // Write trace doc to Firestore ai_logs
      const logPayload = {
        userId: auth.currentUser?.uid || "admin_demo",
        prompt: `Action ${actionType} on letter sequence: ${letter.letterNumber}`,
        response: responseText.substring(0, 1500),
        status: "SUCCESS",
        createdAt: new Date().toISOString()
      };

      try {
        await addDoc(collection(db, "ai_logs"), logPayload);
      } catch (dbErr) {
        // Save locally if Firestore auth error or rules block
        const currentLogs = JSON.parse(localStorage.getItem("local_ai_logs") || "[]");
        currentLogs.unshift({ id: `local_${Date.now()}`, ...logPayload });
        localStorage.setItem("local_ai_logs", JSON.stringify(currentLogs.slice(0, 50)));
      }

    } catch (err: any) {
      console.error("AI Smart Action failed: ", err);
      setAiStatus("ERROR");
      
      const errMsg = `Kesalahan: Gagal menghubungkan ke modul integrasi AI. Layanan AI sedang tidak tersedia. Silakan coba beberapa saat lagi. (${err.message || "Timeout"})`;
      setAiOutput(errMsg);

      // Write error log
      const logPayload = {
        userId: auth.currentUser?.uid || "admin_demo",
        prompt: `Action ${actionType} on letter sequence: ${letter.letterNumber}`,
        response: err.message || "Endpoint error response",
        status: "FAILED",
        createdAt: new Date().toISOString()
      };

      try {
        await addDoc(collection(db, "ai_logs"), logPayload);
      } catch (dbErr) {
        const currentLogs = JSON.parse(localStorage.getItem("local_ai_logs") || "[]");
        currentLogs.unshift({ id: `local_${Date.now()}`, ...logPayload });
        localStorage.setItem("local_ai_logs", JSON.stringify(currentLogs.slice(0, 50)));
      }
    }
  };

  // Filters
  const filteredLetters = letters.filter(l => {
    const matchesSearch = 
      l.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.letterNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.senderInstitution.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "Semua" || l.category === categoryFilter;
    const matchesUrgency = urgencyFilter === "Semua" || l.urgency === urgencyFilter;

    return matchesSearch && matchesCategory && matchesUrgency;
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setAttachedName(file.name);
    }
  };

  const handleManualFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedName(e.target.files[0].name);
    }
  };

  const submitAddLetter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!letterNo || !senderName || !subjectText) return;

    onAddLetter({
      agendaNumber: agendaNo || `${String(letters.length + 1).padStart(3, "0")}/A-SM/VI/2026`,
      letterNumber: letterNo,
      letterDate: letterDate || new Date().toISOString().split("T")[0],
      receivedDate: receivedDate || new Date().toISOString().split("T")[0],
      sender: senderName,
      senderInstitution: senderInst || "Instansi Umum",
      subject: subjectText,
      category: categoryVal,
      urgency: urgencyVal,
      attachmentName: attachedName || undefined,
      attachmentUrl: attachedName ? `letters/${attachedName}` : undefined,
      status: "Baru"
    });

    // Reset Form
    setLetterNo("");
    setSenderName("");
    setSenderInst("");
    setSubjectText("");
    setAttachedName("");
    setIsAddOpen(false);
  };

  const submitDisposition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLetter || !dispNotes) return;

    onAddDisposition(selectedLetter.id, {
      letterId: selectedLetter.id,
      notes: dispNotes,
      priority: dispPriority,
      targetRole: dispTarget,
      status: "Terkirim"
    });

    // Automatically advance letter status to Didisposisi
    onUpdateStatus(selectedLetter.id, "Didisposisi");

    setDispNotes("");
    setIsDispOpen(false);
    
    // Close detail mapping
    setSelectedLetter(null);
  };

  const isViewer = currentRole === "Viewer";
  const canModify = currentRole === "Super Admin" || currentRole === "Staff";
  const canDispo = currentRole === "Super Admin" || currentRole === "Direktur" || currentRole === "Manager";

  return (
    <div className="space-y-6" id="surat-masuk-viewport">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 duration-150 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Arsip Surat Masuk Perusahaan</h2>
        
        {canModify && (
          <button 
            onClick={() => setIsAddOpen(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 font-semibold text-white px-4 py-2.5 rounded-lg text-sm transition-all shadow-sm"
            id="btn-tambah-surat-masuk"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Surat Masuk</span>
          </button>
        )}
      </div>

      {/* Filter and Search Box */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        {/* Search input */}
        <div className="md:col-span-2 relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input 
            type="text"
            placeholder="Cari surat masuk berdasarkan nomor, pengirim, atau instansi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs md:text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            id="search-surat-masuk"
          />
        </div>

        {/* Filter Category */}
        <div>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full py-2 px-3 border border-slate-200 dark:border-slate-800 rounded-lg text-xs md:text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none"
            id="filter-category"
          >
            <option value="Semua">Semua Kategori</option>
            <option value="Legal">Legal</option>
            <option value="Keuangan">Keuangan</option>
            <option value="HRD">HRD</option>
            <option value="Operasional">Operasional</option>
          </select>
        </div>

        {/* Filter Urgency */}
        <div>
          <select 
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="w-full py-2 px-3 border border-slate-200 dark:border-slate-800 rounded-lg text-xs md:text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none"
            id="filter-urgency"
          >
            <option value="Semua">Semua Sifat Surat</option>
            <option value="Biasa">Biasa</option>
            <option value="Penting">Penting</option>
            <option value="Rahasia">Rahasia</option>
            <option value="Sangat Rahasia">Sangat Rahasia</option>
          </select>
        </div>
      </div>

      {/* Main Grid: List & Detailed panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table/List Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm lg:col-span-2 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-150 dark:border-slate-800 font-bold text-slate-800 dark:text-white text-sm">
            Daftar Surat Masuk ({filteredLetters.length})
          </div>

          <div className="overflow-x-auto min-h-[300px]" id="surat-masuk-table-stage">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                  <th className="p-4 font-semibold">No. Agenda / Surat</th>
                  <th className="p-4 font-semibold">Pengirim</th>
                  <th className="p-4 font-semibold">Perihal</th>
                  <th className="p-4 font-semibold">Lampiran</th>
                  <th className="p-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLetters.map((letter) => (
                  <tr 
                    key={letter.id}
                    onClick={() => setSelectedLetter(letter)}
                    className={`border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 cursor-pointer transition-colors ${
                      selectedLetter?.id === letter.id ? "bg-blue-50/40 dark:bg-blue-950/20 border-l-4 border-l-blue-600" : ""
                    }`}
                    id={`letter-row-${letter.id}`}
                  >
                    <td className="p-4 whitespace-nowrap">
                      <p className="font-semibold text-blue-600 dark:text-blue-400 font-mono text-[11px]">{letter.agendaNumber}</p>
                      <p className="text-slate-400 dark:text-slate-500 font-mono text-[10px] mt-0.5">{letter.letterNumber}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{letter.sender}</p>
                      <p className="text-slate-400 dark:text-slate-500 text-[11px]">{letter.senderInstitution}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-slate-700 dark:text-slate-300 line-clamp-1">{letter.subject}</p>
                      <div className="flex space-x-2 mt-1">
                        <span className="text-[10px] font-mono text-slate-400">{letter.category}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                          letter.urgency === "Sangat Rahasia" || letter.urgency === "Penting"
                            ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                        }`}>{letter.urgency}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {letter.attachmentName ? (
                        <span className="flex items-center text-blue-600 dark:text-blue-400 font-semibold space-x-1" title={letter.attachmentName}>
                          <FileText className="h-3 w-3 inline shrink-0" />
                          <span className="max-w-[70px] truncate text-[11px]">{letter.attachmentName}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        letter.status === "Baru"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                          : letter.status === "Diproses"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                          : letter.status === "Didisposisi"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      }`}>
                        {letter.status}
                      </span>
                    </td>
                  </tr>
                ))}
                
                {filteredLetters.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center p-12 text-slate-400 bg-slate-50/50 dark:bg-transparent">
                      <AlertTriangle className="h-8 w-8 mx-auto text-amber-400 mb-2" />
                      Tidak ditemukan arsip surat masuk yang sesuai kriteria pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail / Disposisi Action Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-4 h-fit flex flex-col space-y-4" id="detail-disposisi-panel">
          {selectedLetter ? (
            <div className="space-y-4" id="selected-letter-detail">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm">Pratinjau Agenda Detail</h3>
                  <button 
                    onClick={() => handleExportPDF(selectedLetter)}
                    className="flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/45 dark:hover:bg-blue-950/90 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 font-bold py-1 px-2.5 rounded text-[10px] transition-all cursor-pointer shadow-xs"
                    id="btn-unduh-pdf-masuk"
                    title="Unduh Agenda & Lembar Disposisi PDF"
                  >
                    <FileText className="h-3 w-3" />
                    <span>Format PDF</span>
                  </button>
                </div>
                <button onClick={() => setSelectedLetter(null)} className="text-slate-400 hover:text-slate-600 text-xs font-semibold">Tutup</button>
              </div>

              {/* Core Metadata */}
              <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">Nomor Agenda</span>
                  <span className="font-bold text-slate-800 dark:text-white text-sm font-mono">{selectedLetter.agendaNumber}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">Tanggal Surat</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedLetter.letterDate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">Diterima</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedLetter.receivedDate}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">Pengirim & Instansi</span>
                  <p className="font-bold text-slate-800 dark:text-white">{selectedLetter.sender}</p>
                  <p className="font-medium text-slate-500 dark:text-slate-500 text-[11px] mt-0.5">{selectedLetter.senderInstitution}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">Perihal</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-150 dark:border-slate-800">{selectedLetter.subject}</p>
                </div>

                {/* AI Kantor Pintar Section */}
                <div className="bg-indigo-50/40 dark:bg-slate-950/40 p-3 rounded-lg border border-indigo-100/50 dark:border-indigo-900/30 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-indigo-600 dark:text-indigo-400 font-bold flex items-center space-x-1">
                      <Sparkles className="h-3 w-3 animate-pulse" />
                      <span>AI Kantor Pintar (Gemini)</span>
                    </span>
                    {aiStatus === "LOADING" && (
                      <RefreshCw className="h-3.5 w-3.5 text-indigo-500 animate-spin" />
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      type="button"
                      disabled={aiStatus === "LOADING"}
                      onClick={() => runAiAction("RINGKASAN", selectedLetter)}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-1 px-2.5 rounded-md text-[10px] transition-all cursor-pointer flex items-center space-x-0.5"
                    >
                      Ringkas
                    </button>
                    
                    <button
                      type="button"
                      disabled={aiStatus === "LOADING"}
                      onClick={() => runAiAction("BALASAN", selectedLetter)}
                      className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold py-1 px-2.5 rounded-md text-[10px] transition-all cursor-pointer"
                    >
                      Draf Balasan
                    </button>
                    
                    <button
                      type="button"
                      disabled={aiStatus === "LOADING"}
                      onClick={() => runAiAction("DISPOSISI", selectedLetter)}
                      className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-1 px-2.5 rounded-md text-[10px] transition-all cursor-pointer"
                    >
                      Oto-Disposisi
                    </button>

                    {selectedLetter.attachmentName && (
                      <button
                        type="button"
                        disabled={aiStatus === "LOADING"}
                        onClick={() => runAiAction("PDF", selectedLetter)}
                        className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold py-1 px-2.5 rounded-md text-[10px] transition-all cursor-pointer"
                      >
                        Analisis PDF
                      </button>
                    )}
                  </div>

                  {aiOutput && (
                    <div className="mt-2 p-2.5 bg-white dark:bg-slate-900 border border-indigo-100/40 dark:border-indigo-900/40 rounded-md animate-in fade-in duration-250">
                      <span className="text-[9px] uppercase font-mono font-bold text-indigo-600 dark:text-indigo-400 block border-b border-slate-100 dark:border-slate-800 pb-1 mb-1">
                        {aiActionName}
                      </span>
                      <p className="text-[11px] leading-relaxed select-all text-slate-700 dark:text-slate-300 font-sans whitespace-pre-wrap">
                        {aiOutput}
                      </p>
                      
                      {aiActionName === "Rekomendasi Petunjuk Disposisi" && aiStatus === "IDLE" && (
                        <button
                          type="button"
                          onClick={() => {
                            setDispNotes(aiOutput);
                            setIsDispOpen(true);
                          }}
                          className="mt-2 text-[9px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center space-x-1 hover:underline cursor-pointer"
                        >
                          <span>✓ Terapkan Catatan Ini ke Lembaran Disposisi</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {selectedLetter.attachmentName && (
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">Elektronik Lampiran Document</span>
                    <a 
                      href={`#`} 
                      onClick={(e) => { e.preventDefault(); alert(`Download File: ${selectedLetter.attachmentName} terverifikasi aman melalui protokol FORSDIG Secure Link.`); }}
                      className="flex items-center space-x-2 p-2 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-lg text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                    >
                      <FileText className="h-4 w-4 shrink-0" />
                      <span className="truncate">{selectedLetter.attachmentName}</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Disposition Log list if exists on this letter */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3" id="disposition-histories-sc">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-2">Riwayat Instruksi Disposisi</span>
                {selectedLetter.dispositions && selectedLetter.dispositions.length > 0 ? (
                  <div className="space-y-3">
                    {selectedLetter.dispositions.map((disp, idx) => (
                      <div key={idx} className="bg-purple-50/50 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-950 p-2.5 rounded-lg text-xs">
                        <div className="flex justify-between items-center text-[10px] text-purple-600 dark:text-purple-400 font-bold mb-1 col-span-2">
                          <span className="flex items-center"><CornerDownRight className="h-3 w-3 mr-0.5" /> Untuk: {disp.targetRole}</span>
                          <span className="font-mono bg-purple-100 px-1 rounded text-[9px]">{disp.priority}</span>
                        </div>
                        <p className="italic text-slate-700 dark:text-slate-300">"{disp.notes}"</p>
                        <span className="block text-[9px] text-slate-400 dark:text-slate-500 text-right mt-1.5">Oleh: {disp.senderName}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] italic text-slate-400 text-center py-2 bg-slate-50 dark:bg-slate-950 rounded">Belum ada disposisi pimpinan untuk agenda ini.</p>
                )}
              </div>

              {/* Immediate action triggers */}
              {!isViewer && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex flex-wrap gap-2">
                  {canDispo && (
                    <button 
                      onClick={() => setIsDispOpen(true)}
                      className="flex-1 flex justify-center items-center space-x-1.5 bg-purple-600 hover:bg-purple-700 text-white py-1.5 px-3 rounded text-xs font-semibold"
                      id="btn-beri-disposisi"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span>Beri Disposisi</span>
                    </button>
                  )}

                  {selectedLetter.status !== "Selesai" && canModify && (
                    <button 
                      onClick={() => onUpdateStatus(selectedLetter.id, "Selesai")}
                      className="flex-1 flex justify-center items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-3 rounded text-xs font-semibold"
                      id="btn-selesaikan-surat"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Tandai Selesai</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400" id="letter-detail-placeholder">
              <FileText className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
              <p className="font-semibold text-xs">Pilih salah satu surat dari daftar untuk melihat detail agenda atau memberikan disposisi pimpinan.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Tambah Surat Masuk */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-blue-600 text-white font-bold text-base flex justify-between items-center">
              <span>Formulir Masuk – Agenda Surat Baru</span>
              <button onClick={() => setIsAddOpen(false)} className="text-white/80 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={submitAddLetter} className="p-6 space-y-4 text-xs md:text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Nomor Agenda Internal (Opsional)</label>
                  <input 
                    type="text" 
                    placeholder="Kosongkan untuk auto-generasi"
                    value={agendaNo}
                    onChange={(e) => setAgendaNo(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 focus:outline-blue-500 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Nomor Surat Fisik</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Contoh: 10/KEMENKES/VI/2026"
                    value={letterNo}
                    onChange={(e) => setLetterNo(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 focus:outline-blue-500 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Tanggal Surat Tertera</label>
                  <input 
                    type="date" 
                    required
                    value={letterDate}
                    onChange={(e) => setLetterDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Tanggal Diterima Masuk</label>
                  <input 
                    type="date" 
                    required
                    value={receivedDate}
                    onChange={(e) => setReceivedDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Nama Pengirim (Konseptor)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Nama lengkap pengirim..."
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Instansi Asal Pengirim</label>
                  <input 
                    type="text" 
                    placeholder="Nama institusi atau instansi..."
                    value={senderInst}
                    onChange={(e) => setSenderInst(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Kategori Dokumen</label>
                  <select 
                    value={categoryVal}
                    onChange={(e) => setCategoryVal(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  >
                    <option value="Legal">Legal (Draf Perjanjian/Aturan)</option>
                    <option value="Keuangan">Keuangan (Invoicing/Pajak)</option>
                    <option value="HRD">HRD (Karyawan/Himbauan)</option>
                    <option value="Operasional">Operasional (Pengadaan/Penawaran)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Sifat Urgensi Surat</label>
                  <select 
                    value={urgencyVal}
                    onChange={(e) => setUrgencyVal(e.target.value as LetterIn["urgency"])}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  >
                    <option value="Biasa">Biasa (Dokumentasi Standard)</option>
                    <option value="Penting">Penting (Butuh Respons Cepat)</option>
                    <option value="Rahasia">Rahasia (Akses Terbatas)</option>
                    <option value="Sangat Rahasia">Sangat Rahasia (Khusus Direksi)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Perihal Dokumentasi</label>
                <textarea 
                  required
                  placeholder="Isi perihal surat masuk secara lengkap..."
                  rows={2}
                  value={subjectText}
                  onChange={(e) => setSubjectText(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Upload Drag & Drop Section */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Simulasi File Attachment Lampiran</label>
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-5 text-center transition-all ${
                    isDragging ? "border-blue-500 bg-blue-50/20" : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30"
                  }`}
                >
                  <UploadCloud className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-500 font-semibold">Tarik & Letakkan file PDF/DOCX/XLSX/PNG di sini</p>
                  <p className="text-slate-450 dark:text-slate-500 text-[11px] mt-1">atau klik link di bawah untuk memilih file secara manual</p>
                  
                  <label className="inline-block mt-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded cursor-pointer font-bold text-xs">
                    Pilih Berkas Lampiran
                    <input type="file" onChange={handleManualFile} className="hidden" accept=".pdf,.docx,.xlsx,.jpg,.png" />
                  </label>

                  {attachedName && (
                    <div className="mt-3 flex items-center justify-center space-x-2 text-xs bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-100">
                      <FileText className="h-4 w-4" />
                      <span className="truncate max-w-[200px]">{attachedName}</span>
                      <button type="button" onClick={() => setAttachedName("")} className="text-rose-500 hover:text-rose-700 font-bold ml-1">Hapus</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-450 rounded hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Batalkan
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold"
                >
                  Simpan Agenda Surat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Kirim Disposisi */}
      {isDispOpen && selectedLetter && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-purple-600 text-white font-bold text-base flex justify-between items-center">
              <span>Lembaran Disposisi Digital Elektronik</span>
              <button onClick={() => setIsDispOpen(false)} className="text-white/80 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={submitDisposition} className="p-5 space-y-4 text-xs md:text-sm">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 rounded-lg">
                <span className="text-[10px] uppercase font-mono tracking-wider text-purple-600 block mb-0.5">Disposisi Untuk Surat Agenda</span>
                <span className="font-bold text-slate-800 dark:text-white line-clamp-1">{selectedLetter.subject}</span>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Target Delegasi / Jabatan Tujuan</label>
                <select 
                  value={dispTarget}
                  onChange={(e) => setDispTarget(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                >
                  <option value="Direktur Utama">Direktur Utama</option>
                  <option value="Manager Divisi">Manager Divisi</option>
                  <option value="Supervisor Operational">Supervisor Operational</option>
                  <option value="Staff Administrasi">Staff Administrasi (Sekretaris)</option>
                  <option value="Semua Staff HRD/Umum">Semua Divisi HRD/Umum</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Derajat Prioritas / Urgensi Disposisi</label>
                <select 
                  value={dispPriority}
                  onChange={(e) => setDispPriority(e.target.value as Disposition["priority"])}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                >
                  <option value="Rendah">Rendah (Dapat Ditunda)</option>
                  <option value="Sedang">Sedang (Standard)</option>
                  <option value="Tinggi">Tinggi (Segera Selesaikan)</option>
                  <option value="Mendesak">Mendesak (Prioritas Utama Direksi)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Instruksi Catatan Disposisi</label>
                <textarea 
                  required
                  placeholder="Tuliskan catatan tindak lanjut, instruksi teknis, atau memo khusus pimpinan..."
                  rows={4}
                  value={dispNotes}
                  onChange={(e) => setDispNotes(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setIsDispOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-450 rounded hover:bg-slate-100 font-semibold"
                >
                  Kembali
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold"
                >
                  Kirim & Disposisikan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
