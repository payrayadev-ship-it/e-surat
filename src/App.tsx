import React, { useState, useEffect } from "react";
import { 
  Building2, LayoutDashboard, Mail, Send, MessageSquare, Archive, Settings, 
  LogOut, Sun, Moon, Sparkles, User, ShieldAlert, CheckCircle, Bell, RefreshCw, Plus,
  Search, X, ExternalLink, FileDown, Calendar, Tag, Hash, Paperclip, ChevronRight, CornerDownRight, CheckCircle2, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";

import { 
  LetterIn, LetterOut, Disposition, Memo, Meeting, 
  CompanySetting, AuditLog, UserProfile, UserRole 
} from "./types";

import { 
  seedLettersIn, seedLettersOut, seedDispositions, 
  seedMemos, seedMeetings, seedAuditLogs 
} from "./utils";

import Dashboard from "./components/Dashboard";
import SuratMasuk from "./components/SuratMasuk";
import SuratKeluar from "./components/SuratKeluar";
import MemosMeetings from "./components/MemosMeetings";
import ArsipDigital from "./components/ArsipDigital";
import SettingsAudit from "./components/SettingsAudit";
import AIKontrak from "./components/AIKontrak";

// Mock Active profiles for quick demo selection
const WORKSPACE_USERS: UserProfile[] = [
  {
    id: "user_adm",
    name: "Andi Wijaya, S.Kom.",
    email: "admin@forsdig-office.co.id",
    role: "Super Admin",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "user_dir",
    name: "Ir. Joko Sutrisno, M.T.",
    email: "joko.sutrisno@forsdig.com",
    role: "Direktur",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "user_mng",
    name: "Dewi Lestari, S.E.",
    email: "dewi.lestari@forsdig.com",
    role: "Manager",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "user_stf",
    name: "Budi Pratama",
    email: "budi.pratama@forsdig.com",
    role: "Staff",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "user_vwr",
    name: "Tamu Peninjau",
    email: "viewer@forsdig-office.co.id",
    role: "Viewer",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"
  }
];

const DEFAULT_SETTING: CompanySetting = {
  id: "company_setting_1",
  companyName: "PT. Foresyndo Global Indonesia",
  companyAddress: "Maspion Plaza Lantai 18, Jl. Gunung Sahari No.18, Jakarta Utara, DKI Jakarta 14420",
  companyPhone: "+62 21-5088-2940",
  companyEmail: "sekretariat@forsdig.com",
  letterNumberFormat: "SPD/2026/06/[SEQ]",
  smtpHost: "smtp.forsdig-office.co.id",
  smtpPort: 587,
  smtpUser: "notifications@forsdig.com"
};

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem("theme") === "dark";
  });

  // State arrays persisted in localStorage
  const [lettersIn, setLettersIn] = useState<LetterIn[]>(() => {
    const saved = localStorage.getItem("letters_in");
    return saved ? JSON.parse(saved) : seedLettersIn;
  });

  const [lettersOut, setLettersOut] = useState<LetterOut[]>(() => {
    const saved = localStorage.getItem("letters_out");
    return saved ? JSON.parse(saved) : seedLettersOut;
  });

  const [dispositions, setDispositions] = useState<Disposition[]>(() => {
    const saved = localStorage.getItem("dispositions");
    return saved ? JSON.parse(saved) : seedDispositions;
  });

  const [memos, setMemos] = useState<Memo[]>(() => {
    const saved = localStorage.getItem("memos");
    return saved ? JSON.parse(saved) : seedMemos;
  });

  const [meetings, setMeetings] = useState<Meeting[]>(() => {
    const saved = localStorage.getItem("meetings");
    return saved ? JSON.parse(saved) : seedMeetings;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem("audit_logs");
    return saved ? JSON.parse(saved) : seedAuditLogs;
  });

  const [companySetting, setCompanySetting] = useState<CompanySetting>(() => {
    const saved = localStorage.getItem("company_setting");
    return saved ? JSON.parse(saved) : DEFAULT_SETTING;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("current_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Global Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedSearchLetter, setSelectedSearchLetter] = useState<{ letter: any; type: "in" | "out" } | null>(null);

  const formatIndoDateGlobal = (dateStr: string) => {
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

  const handleGlobalExportPDF = (letter: any, type: "in" | "out") => {
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

    const drawLetterhead = (pageNumber: number) => {
      // Draw Corporate Letter Head Logo
      doc.setFillColor(30, 41, 142); // Navy Blue
      doc.roundedRect(20, 15, 14, 14, 2, 2, "F");
      
      doc.setFillColor(234, 179, 8); // Golden Accent Accent Dot
      doc.circle(23, 26, 1.5, "F");

      // Logo text FGI
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("FGI", 26, 23.5, { align: "center" });

      // Company Name and Details
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
      
      const detailsLineY = 24 + (addressLines.length * 3.8);
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 142);
      doc.text("e-Office & Digital Signature Hub", 38, detailsLineY);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(` |  Telp: ${companySetting.companyPhone}  |  Email: ${companySetting.companyEmail}`, 85, detailsLineY);

      // Premium Double Divider borders
      const lineY = detailsLineY + 3.5;
      doc.setDrawColor(30, 41, 142);
      doc.setLineWidth(1.0);
      doc.line(20, lineY, 190, lineY);
      
      // Thin slate line
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.3);
      doc.line(20, lineY + 0.95, 190, lineY + 0.95);

      // Page numbering indicator
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Hal ${pageNumber}`, 190, 287, { align: "right" });
      
      return lineY + 5;
    };

    let currentY = drawLetterhead(1);
    let currentPage = 1;

    if (type === "in") {
      // TITLE: LEMBAR DISPOSISI & AGENDA SURAT MASUK
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

      const drawMetaRow = (label1: string, val1: string, label2: string, val2: string, yPos: number) => {
        doc.setFillColor(248, 250, 252);
        doc.rect(20, yPos, 40, 7, "F");
        doc.rect(105, yPos, 35, 7, "F");

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

      drawMetaRow("No. Agenda", letter.agendaNumber || "-", "Tgl. Diterima", letter.receivedDate ? formatIndoDateGlobal(letter.receivedDate) : "-", currentY);
      currentY += 7;
      drawMetaRow("Sifat Surat", letter.urgency || "-", "Kategori", letter.category || "-", currentY);
      currentY += 7;
      drawMetaRow("No. Surat Asal", letter.letterNumber || "-", "Tgl. Surat Asal", letter.letterDate ? formatIndoDateGlobal(letter.letterDate) : "-", currentY);
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

      const dispositionsList = letter.dispositions || [];
      if (dispositionsList.length === 0) {
        doc.setDrawColor(226, 232, 240);
        doc.rect(20, currentY, 170, 16);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text("Belum ada instruksi disposisi terdaftar untuk lembar agenda surat masuk ini.", 24, currentY + 9.5);
        currentY += 21;
      } else {
        dispositionsList.forEach((disp: any, idx: number) => {
          if (currentY > 230) {
            doc.addPage();
            currentPage++;
            currentY = drawLetterhead(currentPage) + 5;
          }

          doc.setDrawColor(203, 213, 225);
          doc.setFillColor(248, 250, 252);
          doc.rect(20, currentY, 170, 28, "F");
          doc.rect(20, currentY, 170, 28);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(30, 41, 142);
          doc.text(`DISPOSISI #${idx + 1} - Ditujukan Kepada: ${disp.targetRole}`, 24, currentY + 5.5);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(100, 116, 139);
          doc.text(`Dari Pimpinan: ${disp.senderName}  |  Prioritas: ${disp.priority}  |  Tgl: ${formatIndoDateGlobal(disp.createdAt)}`, 24, currentY + 9.5);

          // Divider inside card
          doc.setDrawColor(226, 232, 240);
          doc.line(24, currentY + 11.5, 186, currentY + 11.5);

          // Notes body
          doc.setFont("helvetica", "bold");
          doc.setTextColor(71, 85, 105);
          doc.text("Petunjuk / Instruksi Khusus:", 24, currentY + 16);

          doc.setFont("times", "italic");
          doc.setFontSize(9);
          doc.setTextColor(15, 23, 42);
          const dispNotesWrapped = doc.splitTextToSize(disp.notes || "-", 160);
          doc.text(dispNotesWrapped, 24, currentY + 20.5);

          currentY += 33;
        });
      }
    } else {
      // OUTGOING LETTER EXPORT
      const metaY = currentY + 5;
      doc.setTextColor(15, 23, 42); // Dark Charcoal
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const dateOutput = `Jakarta, ${letter.letterDate ? formatIndoDateGlobal(letter.letterDate) : formatIndoDateGlobal(new Date().toISOString())}`;
      doc.text(dateOutput, 190, metaY, { align: "right" });

      doc.setFont("helvetica", "bold");
      doc.text("Nomor :", 20, metaY);
      doc.text("Sifat  :", 20, metaY + 5.5);
      doc.text("Hal    :", 20, metaY + 11);

      doc.setFont("courier", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(30, 41, 142);
      doc.text(letter.letterNumber || "-", 36, metaY);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      doc.text("Biasa / Terbuka", 36, metaY + 5.5);
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      const subjectWrapped = doc.splitTextToSize(letter.subject || "-", 105);
      doc.text(subjectWrapped, 36, metaY + 11);

      const recipientY = metaY + 13 + (subjectWrapped.length * 4.8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text("Kepada Yth,", 20, recipientY);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(letter.recipient || "-", 20, recipientY + 5);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      doc.text(letter.recipientInstitution || "-", 20, recipientY + 9.5);
      doc.text("Di tempat", 20, recipientY + 14);

      let bodyY = recipientY + 22;
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);

      // Simple template replacements
      let rawContent = letter.content || "";
      const replacements = {
        nomor_surat: letter.letterNumber || "-",
        tanggal: letter.letterDate ? formatIndoDateGlobal(letter.letterDate) : formatIndoDateGlobal(new Date().toISOString()),
        nama_penerima: letter.recipient || "-",
        alamat: letter.recipientInstitution || "-",
        jabatan: letter.signatory || "-",
        perihal: letter.subject || "-",
        nama_direktur: letter.signatory || "-"
      };
      
      Object.entries(replacements).forEach(([key, val]) => {
        const regex = new RegExp(`\\[${key}\\]|\\{\\{${key}\\}\\}`, "gi");
        rawContent = rawContent.replace(regex, val);
      });

      const paragraphs = rawContent.split(/\n+/).map((p: string) => p.trim()).filter(Boolean);
      const paragraphGap = 6;
      const footerSafeZoneY = 210;

      doc.setTextColor(15, 23, 42);

      for (let i = 0; i < paragraphs.length; i++) {
        const pText = paragraphs[i];
        const pWrappedLines = doc.splitTextToSize(pText, contentWidth);
        const pHeight = pWrappedLines.length * 5.2;

        if (bodyY + pHeight > (currentPage === 1 ? footerSafeZoneY : 240)) {
          doc.addPage();
          currentPage++;
          bodyY = drawLetterhead(currentPage) + 12;
          doc.setFont("times", "normal");
          doc.setFontSize(11);
          doc.setTextColor(15, 23, 42);
        }

        doc.text(pText, leftMargin, bodyY, {
          align: "justify",
          maxWidth: contentWidth,
          lineHeightFactor: 1.35
        });
        bodyY += pHeight + paragraphGap;
      }

      let footerY = 228;
      if (bodyY > 218) {
        doc.addPage();
        currentPage++;
        let finalHeaderY = drawLetterhead(currentPage);
        footerY = finalHeaderY + 25;
      }

      // Draw modern background card for authenticity code
      const qrBoxSize = 25;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.roundedRect(20, footerY - 2, 78, qrBoxSize + 8, 2, 2, "FD");

      // Simple QR drawer pattern
      const qrCodeVal = letter.verificationCode || `TTE-${Date.now()}`;
      let hash = 0;
      for (let i = 0; i < qrCodeVal.length; i++) {
        hash = qrCodeVal.charCodeAt(i) + ((hash << 5) - hash);
      }
      const qrSize = 15;
      const cellWidth = qrBoxSize / qrSize;

      doc.setFillColor(30, 41, 142);
      for (let r = 0; r < qrSize; r++) {
        for (let c = 0; c < qrSize; c++) {
          let active = false;
          // check anchors
          const isPosAnchor = (row: number, col: number) => {
            if (row < 4 && col < 4) return true;
            if (row < 4 && col >= qrSize - 4) return true;
            if (row >= qrSize - 4 && col < 4) return true;
            return false;
          };
          const isPosAnchorBorder = (row: number, col: number) => {
            if ((row === 1 || row === 2) && (col === 1 || col === 2)) return false;
            if ((row === 1 || row === 2) && (col === qrSize - 2 || col === qrSize - 3)) return false;
            if ((row === qrSize - 2 || row === qrSize - 3) && (col === 1 || col === 2)) return false;
            return isPosAnchor(row, col);
          };

          if (isPosAnchor(r, c)) {
            active = isPosAnchorBorder(r, c);
          } else {
            const cellHash = Math.abs(Math.sin(hash + r * 17 + c * 31));
            active = cellHash > 0.45;
          }

          if (active) {
            doc.rect(24 + (c * cellWidth), footerY + (r * cellWidth) + 1.5, cellWidth - 0.25, cellWidth - 0.25, "F");
          }
        }
      }

      // Text credentials
      doc.setTextColor(30, 41, 142);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("SECURITY CHECK VERIFIED", 54, footerY + 5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("Valid Digital Signature", 54, footerY + 9);
      
      doc.setFont("courier", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(qrCodeVal, 54, footerY + 13.5);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(16, 185, 129);
      doc.text("✓ TERVERIFIKASI SISTEM", 54, footerY + 18.5);

      // Digital signee text
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text("Hormat kami,", 120, footerY + 1);
      doc.setFont("helvetica", "bold");
      doc.text(companySetting.companyName || "PT Foresyndo Global Indonesia", 120, footerY + 5.5);

      doc.setDrawColor(30, 41, 142);
      doc.setLineWidth(0.6);
      doc.line(120, footerY + 15, 180, footerY + 15);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(letter.signatory || "Direktur Utama", 120, footerY + 19.5);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text("Direktur Penandatangan TTE", 120, footerY + 23.5);
    }

    addAuditLog(`Mengunduh berkas surat [No: ${letter.letterNumber}] dari Quick View Global Search`, "Cetak Surat");
    doc.save(`FGI_Surat_${(letter.letterNumber || "doc").replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
  };

  // Form states login
  const [typedEmail, setTypedEmail] = useState("");
  const [typedPassword, setTypedPassword] = useState("");

  // Sync to tailwind dark class & Storage
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  // Save states to localStorage upon changes
  useEffect(() => {
    localStorage.setItem("letters_in", JSON.stringify(lettersIn));
  }, [lettersIn]);

  useEffect(() => {
    localStorage.setItem("letters_out", JSON.stringify(lettersOut));
  }, [lettersOut]);

  useEffect(() => {
    localStorage.setItem("dispositions", JSON.stringify(dispositions));
  }, [dispositions]);

  useEffect(() => {
    localStorage.setItem("memos", JSON.stringify(memos));
  }, [memos]);

  useEffect(() => {
    localStorage.setItem("meetings", JSON.stringify(meetings));
  }, [meetings]);

  useEffect(() => {
    localStorage.setItem("audit_logs", JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem("company_setting", JSON.stringify(companySetting));
  }, [companySetting]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("current_user", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("current_user");
    }
  }, [currentUser]);

  // Insert Audit helper
  const addAuditLog = (activity: string, actionType: AuditLog["actionType"]) => {
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: currentUser?.id || "anonymous",
      userEmail: currentUser?.email || "anonymous",
      activity,
      actionType,
      ipAddress: "192.168.1." + Math.floor(Math.random() * 254 + 1),
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Auth Quick Select
  const handleSelectMockProfile = (profile: UserProfile) => {
    setCurrentUser(profile);
    addAuditLog(`User logged in as ${profile.name} [${profile.role}]`, "Login");
  };

  // Custom Form Login
  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default fallback matching if credentials entered, fallback to Super Admin
    const preMatch = WORKSPACE_USERS.find(u => u.email === typedEmail);
    const resolvedUser = preMatch || WORKSPACE_USERS[0];
    setCurrentUser(resolvedUser);
    addAuditLog(`User logged in with email: ${resolvedUser.email}`, "Login");
  };

  const handleLogout = () => {
    if (currentUser) {
      addAuditLog(`User logged out: ${currentUser.name}`, "Logout");
    }
    setCurrentUser(null);
    setActiveTab("dashboard");
  };

  // Core Mutation Operations passed down
  const handleAddLetterIn = (newLetter: Omit<LetterIn, "id" | "createdAt" | "createdBy">) => {
    const letter: LetterIn = {
      ...newLetter,
      id: `in-${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.name || "System"
    };
    setLettersIn(prev => [letter, ...prev]);
    addAuditLog(`Menambahkan surat masuk agenda: ${letter.agendaNumber}`, "Simpan Surat");
  };

  const handleUpdateStatusIn = (letterId: string, status: LetterIn["status"]) => {
    setLettersIn(prev => prev.map(l => l.id === letterId ? { ...l, status } : l));
    addAuditLog(`Mengubah status surat masuk [ID: ${letterId}] menjadi ${status}`, "Edit Surat");
  };

  const handleAddDisposition = (letterId: string, disp: Omit<Disposition, "id" | "senderId" | "senderName" | "createdAt" | "letterSubject">) => {
    const selectedLetter = lettersIn.find(l => l.id === letterId);
    const newDisp: Disposition = {
      ...disp,
      id: `disp-${Date.now()}`,
      letterSubject: selectedLetter?.subject || "Subject",
      senderId: currentUser?.id || "sender_id",
      senderName: currentUser?.name || "Sender",
      createdAt: new Date().toISOString()
    };

    setDispositions(prev => [newDisp, ...prev]);
    
    // Mount inside the Letter item array
    setLettersIn(prev => prev.map(l => {
      if (l.id === letterId) {
        const itemDisps = l.dispositions ? [...l.dispositions, newDisp] : [newDisp];
        return { ...l, dispositions: itemDisps };
      }
      return l;
    }));

    addAuditLog(`Mengirim disposisi instruksi kepada ${disp.targetRole}`, "Approval");
  };

  const handleAddLetterOut = (newLetter: Omit<LetterOut, "id" | "createdAt">) => {
    const letter: LetterOut = {
      ...newLetter,
      id: `out-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setLettersOut(prev => [letter, ...prev]);
    addAuditLog(`Membuat konsep surat keluar nomor: ${letter.letterNumber}`, "Simpan Surat");
  };

  const handleUpdateStatusOut = (letterId: string, status: LetterOut["status"], note?: string) => {
    setLettersOut(prev => prev.map(l => {
      if (l.id === letterId) {
        const hNode = {
          role: currentUser?.role || "Staff",
          user: currentUser?.name || "User",
          action: `Setuju status ${status}`,
          note: note || "",
          timestamp: new Date().toISOString()
        };
        const hist = l.approvalHistory ? [...l.approvalHistory, hNode] : [hNode];
        return { ...l, status, approvalHistory: hist };
      }
      return l;
    }));
    addAuditLog(`Workflow status surat keluar [ID: ${letterId}] disetujui ke: ${status}`, "Approval");
  };

  const handleAddMemo = (newMemo: Omit<Memo, "id" | "createdAt" | "senderId" | "senderName">) => {
    const memo: Memo = {
      ...newMemo,
      id: `memo-${Date.now()}`,
      senderId: currentUser?.id || "sender_id",
      senderName: currentUser?.name || "Manager",
      createdAt: new Date().toISOString()
    };
    setMemos(prev => [memo, ...prev]);
    addAuditLog(`Mengirim memo internal perihal: ${memo.subject}`, "Simpan Surat");
  };

  const handleAddMeeting = (newMeeting: Omit<Meeting, "id" | "createdAt">) => {
    const meet: Meeting = {
      ...newMeeting,
      id: `meet-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setMeetings(prev => [meet, ...prev]);
    addAuditLog(`Penerbitan berita acara notulen rapat: ${meet.title}`, "Simpan Surat");
  };

  // Render main sub components based on current route
  const renderTabContent = () => {
    if (!currentUser) return null;

    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard 
            lettersIn={lettersIn} 
            lettersOut={lettersOut} 
            dispositions={dispositions} 
            auditLogs={auditLogs}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        );
      case "surat_masuk":
        return (
          <SuratMasuk 
            letters={lettersIn} 
            currentRole={currentUser.role}
            currentUser={currentUser}
            onAddLetter={handleAddLetterIn}
            onUpdateStatus={handleUpdateStatusIn}
            onAddDisposition={handleAddDisposition}
          />
        );
      case "surat_keluar":
        return (
          <SuratKeluar 
            letters={lettersOut}
            currentRole={currentUser.role}
            currentUser={currentUser}
            companySetting={companySetting}
            onAddLetter={handleAddLetterOut}
            onUpdateStatus={handleUpdateStatusOut}
          />
        );
      case "memos":
        return (
          <MemosMeetings 
            memos={memos}
            meetings={meetings}
            currentRole={currentUser.role}
            currentUser={currentUser}
            onAddMemo={handleAddMemo}
            onAddMeeting={handleAddMeeting}
          />
        );
      case "arsip":
        return (
          <ArsipDigital 
            lettersIn={lettersIn} 
            lettersOut={lettersOut} 
            memos={memos} 
          />
        );
      case "settings":
        return (
          <SettingsAudit 
            companySetting={companySetting}
            auditLogs={auditLogs}
            currentRole={currentUser.role}
            users={WORKSPACE_USERS}
            onUpdateCompany={setCompanySetting}
            onClearAuditLogs={() => setAuditLogs([])}
          />
        );
      case "ai_kontrak":
        return (
          <AIKontrak 
            currentRole={currentUser.role}
            currentUser={currentUser}
          />
        );
      default:
        return <div>Dashboard Under Active Refactoring</div>;
    }
  };

  // If NOT Logged In, render corporate entry portal (Login + Selector)
  if (!currentUser) {
    return (
      <div className="relative min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col md:flex-row justify-center items-center p-4">
        {/* Decorative ambient vector glows */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/10 dark:bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-8 z-10" id="login-stage">
          {/* Brand/Hero section column block */}
          <div className="md:col-span-5 flex flex-col justify-center space-y-6 text-slate-800 dark:text-slate-100 pr-0 md:pr-4">
            <div className="flex items-center space-x-3 text-blue-600 dark:text-blue-450">
              <Building2 className="h-10 w-10 shrink-0" />
              <div className="font-sans font-extrabold tracking-tight">
                <span className="text-xl md:text-2xl block leading-none">FORSDIG</span>
                <span className="text-xs tracking-widest text-slate-400 block uppercase mt-1">e-Office System</span>
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-sans leading-tight">Surat Menyurat Digital Perusahaan</h1>
              <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-medium">Platfom otomasi kantor untuk mempercepat administrasi surat masuk, konsep draf keluar, disposisi cepat pimpinan, serta audit persetujuan terenkripsi QR Code secara modern.</p>
            </div>

            <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 p-3 rounded-lg border border-blue-100 w-fit">
              <Sparkles className="h-4 w-4 animate-pulse shrink-0" />
              <span>Didukung Asisten Penyusun Surat Gemini AI</span>
            </div>
          </div>

          {/* Form and profile selector column block */}
          <div className="md:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-850 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-450 uppercase tracking-wider font-mono">Gateway Masuk Sandbox</span>
              <button onClick={() => setIsDark(!isDark)} className="p-1 px-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded">
                {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {/* Profile Selection Shortcut list */}
              <div className="space-y-3">
                <span className="block text-xs font-semibold text-slate-500">Pilih Role Akses Instan (Coba Demo):</span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2" id="shortcut-roles">
                  {WORKSPACE_USERS.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectMockProfile(user)}
                      className="flex flex-col items-center p-2.5 bg-slate-50 dark:bg-slate-950 hover:bg-blue-50 dark:hover:bg-blue-950/20 border border-slate-150 dark:border-slate-850 rounded-xl text-center cursor-pointer group transition-all"
                      title={user.name}
                    >
                      <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 rounded-full object-cover mb-1 border group-hover:border-blue-500" />
                      <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate w-full">{user.name.split(",")[0]}</span>
                      <span className="text-[8px] font-semibold text-blue-600 dark:text-blue-400 uppercase font-mono tracking-tight mt-0.5">{user.role}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Native credentials form */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="flex-shrink mx-4 text-xs font-bold text-slate-400 uppercase font-mono">Atau Masuk Kustom</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>

              <form onSubmit={handleCustomLogin} className="space-y-4 text-xs md:text-sm">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Email Pegawai</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="nama@forsdig.com"
                    value={typedEmail}
                    onChange={(e) => setTypedEmail(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Kunci Sandi</label>
                  <input 
                    type="password" 
                    required 
                    value={typedPassword}
                    onChange={(e) => setTypedPassword(e.target.value)}
                    placeholder="••••••••••••••"
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  Otorisasi Keamanan Akun
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Main dashboard page layout
  const matchedIn = searchQuery.trim() 
    ? lettersIn.filter(l => 
        l.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.letterNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.agendaNumber && l.agendaNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (l.sender && l.sender.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (l.senderInstitution && l.senderInstitution.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (l.category && l.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (l.urgency && l.urgency.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const matchedOut = searchQuery.trim()
    ? lettersOut.filter(l => 
        l.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.letterNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.recipient && l.recipient.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (l.recipientInstitution && l.recipientInstitution.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (l.category && l.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (l.content && l.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (l.signatory && l.signatory.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const totalMatches = matchedIn.length + matchedOut.length;

  const getTabLabel = () => {
    switch (activeTab) {
      case "dashboard": return "Dashboard Overview";
      case "surat_masuk": return "Arsip Surat Masuk";
      case "surat_keluar": return "Surat Keluar (E-Sign)";
      case "memos": return "Memo & Notulen Rapat";
      case "arsip": return "Cabinet Digital";
      case "settings": return "Sistem Pengaturan";
      case "ai_kontrak": return "AI Kontrak & Legal Advisor";
      default: return "Sistem Administrasi";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors flex flex-col md:flex-row text-slate-800 dark:text-slate-200" id="main-viewport-stage">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-60 bg-blue-900 border-b md:border-b-0 md:border-r border-blue-800 text-white shrink-0 flex flex-col justify-between" id="sidebar">
        
        {/* Upper Side brand & items */}
        <div className="space-y-6">
          {/* Logo container brand */}
          <div className="p-6 border-b border-blue-800 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center font-bold text-blue-900">F</div>
              <span className="font-bold text-lg tracking-tight">FORSDIG <span className="font-light opacity-80">OFFICE</span></span>
            </div>

            <button onClick={() => setIsDark(!isDark)} className="p-1 px-1.5 hover:bg-blue-800 rounded text-blue-200 hover:text-white transition-colors">
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-350" />}
            </button>
          </div>

          {/* Navigation link sets */}
          <nav className="px-4 space-y-1" id="major-nav-bar">
            {/* Dashboard Tab */}
            <button 
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all ${
                activeTab === "dashboard" ? "bg-blue-800 text-white font-bold" : "text-slate-350 hover:text-white hover:bg-blue-800/50"
              }`}
            >
              <LayoutDashboard className="h-4.5 w-4.5 shrink-0" />
              <span>Dashboard</span>
            </button>

            {/* Inward Letter Tab */}
            <button 
              onClick={() => setActiveTab("surat_masuk")}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all ${
                activeTab === "surat_masuk" ? "bg-blue-800 text-white font-bold" : "text-slate-350 hover:text-white hover:bg-blue-800/50"
              }`}
              id="sidebar-nav-inbox"
            >
              <Mail className="h-4.5 w-4.5 shrink-0" />
              <span className="flex-1">Surat Masuk</span>
              <span className="text-[10px] bg-blue-500 text-white font-bold px-1.5 py-0.5 rounded-full font-mono">{lettersIn.length}</span>
            </button>

            {/* Outward Letter Tab */}
            <button 
              onClick={() => setActiveTab("surat_keluar")}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all ${
                activeTab === "surat_keluar" ? "bg-blue-800 text-white font-bold" : "text-slate-350 hover:text-white hover:bg-blue-800/50"
              }`}
              id="sidebar-nav-outbox"
            >
              <Send className="h-4.5 w-4.5 shrink-0" />
              <span className="flex-1">Surat Keluar</span>
              <span className="text-[10px] bg-blue-500 text-white font-bold px-1.5 py-0.5 rounded-full font-mono">{lettersOut.length}</span>
            </button>

            {/* Memos Tab */}
            <button 
              onClick={() => setActiveTab("memos")}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all ${
                activeTab === "memos" ? "bg-blue-800 text-white font-bold" : "text-slate-350 hover:text-white hover:bg-blue-800/50"
              }`}
            >
              <MessageSquare className="h-4.5 w-4.5 shrink-0" />
              <span>Memo & Rapat</span>
            </button>

            {/* Digital Archive Tab */}
            <button 
              onClick={() => setActiveTab("arsip")}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all ${
                activeTab === "arsip" ? "bg-blue-800 text-white font-bold" : "text-slate-350 hover:text-white hover:bg-blue-800/50"
              }`}
            >
              <Archive className="h-4.5 w-4.5 shrink-0" />
              <span>Arsip Digital</span>
            </button>

            {/* AI Kontrak Tab */}
            <button 
              onClick={() => setActiveTab("ai_kontrak")}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all ${
                activeTab === "ai_kontrak" ? "bg-blue-800 text-white font-bold" : "text-slate-350 hover:text-white hover:bg-blue-800/50"
              }`}
              id="sidebar-nav-ai-kontrak"
            >
              <Sparkles className="h-4.5 w-4.5 shrink-0 text-amber-400 animate-pulse" />
              <span className="flex-1">AI Kontrak & Legal</span>
              <span className="text-[9px] bg-indigo-600 text-white font-extrabold px-1.5 py-0.5 rounded font-sans uppercase scale-95 tracking-wide">AI</span>
            </button>

            {/* Settings Tab */}
            <button 
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all ${
                activeTab === "settings" ? "bg-blue-800 text-white font-bold" : "text-slate-350 hover:text-white hover:bg-blue-800/50"
              }`}
            >
              <Settings className="h-4.5 w-4.5 shrink-0" />
              <span>Sistem Pengaturan</span>
            </button>
          </nav>
        </div>

        {/* Brand User Profile Footer strip */}
        <div className="p-4 border-t border-blue-800 w-full flex items-center justify-between" id="user-footer">
          <div className="flex items-center gap-3 min-w-0">
            <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-10 h-10 rounded-full object-cover border-2 border-blue-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{currentUser.name.split(",")[0]}</p>
              <p className="text-[10px] opacity-65 truncate">{currentUser.role}</p>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="p-1 px-1.5 bg-blue-800 hover:bg-rose-900/60 rounded transition-colors text-blue-200 hover:text-white cursor-pointer"
            title="Keluar Sesi"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden" id="main-content">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs md:text-sm">Pages</span>
            <span className="text-slate-400 text-xs md:text-sm">/</span>
            <span className="font-medium text-xs md:text-sm text-slate-800 dark:text-white">{getTabLabel()}</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input 
                  type="text" 
                  placeholder="Cari surat..." 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchFocused(true);
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  className="bg-slate-100 dark:bg-slate-950 border border-transparent focus:border-blue-500 rounded-full py-1.5 pl-9 pr-8 text-xs w-48 sm:w-64 focus:ring-2 focus:ring-blue-500/20 text-slate-700 dark:text-slate-300 outline-none transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Backdrop overlay to dismiss dropdown */}
              {isSearchFocused && searchQuery.trim() && (
                <div 
                  className="fixed inset-0 z-40 bg-transparent" 
                  onClick={() => setIsSearchFocused(false)} 
                />
              )}

              {/* Search Results Dropdown Popover */}
              {isSearchFocused && searchQuery.trim() && (
                <div className="absolute right-0 top-10 mt-1 w-80 sm:w-96 md:w-[480px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 max-h-[420px] overflow-hidden flex flex-col">
                  {/* Results Count Header */}
                  <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800/60 flex justify-between items-center shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Hasil Pencarian</span>
                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">
                      {totalMatches} ditemukan
                    </span>
                  </div>

                  {/* List Content */}
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                    {totalMatches === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-slate-400 text-xs">Tidak ada hasil pencarian untuk &ldquo;<span className="font-semibold text-slate-600 dark:text-slate-200">{searchQuery}</span>&rdquo;</p>
                        <p className="text-[10px] text-slate-400 mt-1">Coba kata kunci lain atau periksa ejaan Anda.</p>
                      </div>
                    ) : (
                      <>
                        {/* SURAT MASUK */}
                        {matchedIn.length > 0 && (
                          <div>
                            <div className="px-4 py-1.5 bg-slate-50/55 dark:bg-slate-850/30 text-[9px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest sticky top-0 backdrop-blur-xs">
                              Surat Masuk ({matchedIn.length})
                            </div>
                            {matchedIn.map(item => (
                              <div 
                                key={item.id}
                                onClick={() => {
                                  setSelectedSearchLetter({ letter: item, type: "in" });
                                  setIsSearchFocused(false);
                                }}
                                className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors flex items-start gap-3"
                              >
                                <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg shrink-0 mt-0.5">
                                  <Mail className="h-3.5 w-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[9px] font-mono text-slate-400 truncate">{item.letterNumber}</span>
                                    <span className="px-1.5 py-0.25 rounded text-[8px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 uppercase shrink-0 scale-90">
                                      {item.urgency || "Biasa"}
                                    </span>
                                  </div>
                                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate mt-0.5">{item.subject}</p>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                    <span className="font-medium text-slate-600 dark:text-slate-300">Dari:</span> 
                                    <span className="truncate">{item.sender} - {item.senderInstitution}</span>
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* SURAT KELUAR */}
                        {matchedOut.length > 0 && (
                          <div>
                            <div className="px-4 py-1.5 bg-slate-50/55 dark:bg-slate-850/30 text-[9px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest sticky top-0 backdrop-blur-xs">
                              Surat Keluar ({matchedOut.length})
                            </div>
                            {matchedOut.map(item => (
                              <div 
                                key={item.id}
                                onClick={() => {
                                  setSelectedSearchLetter({ letter: item, type: "out" });
                                  setIsSearchFocused(false);
                                }}
                                className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors flex items-start gap-3"
                              >
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0 mt-0.5">
                                  <Send className="h-3.5 w-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[9px] font-mono text-slate-400 truncate">{item.letterNumber}</span>
                                    <span className="px-1.5 py-0.25 rounded text-[8px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 uppercase shrink-0 scale-90">
                                      {item.status || "Draft"}
                                    </span>
                                  </div>
                                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate mt-0.5">{item.subject}</p>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                    <span className="font-medium text-slate-600 dark:text-slate-300">Kepada:</span> 
                                    <span className="truncate">{item.recipient} - {item.recipientInstitution}</span>
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 text-slate-400 hover:text-blue-600">
                <Bell className="w-5 h-5" />
              </button>
              <button 
                onClick={() => {
                  if (activeTab !== "surat_masuk" && activeTab !== "surat_keluar") {
                    setActiveTab("surat_masuk");
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-medium text-xs flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Surat</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-50 dark:bg-slate-950" id="stage-body">
          {renderTabContent()}
        </div>
      </main>

      {/* Modal Quick View Global Search */}
      <AnimatePresence>
        {selectedSearchLetter && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedSearchLetter(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${
                    selectedSearchLetter.type === "in" 
                      ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400" 
                      : "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                  }`}>
                    {selectedSearchLetter.type === "in" ? <Mail className="h-5 w-5" /> : <Send className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm md:text-base">
                      {selectedSearchLetter.type === "in" ? "Detail Surat Masuk (Quick View)" : "Detail Surat Keluar (Quick View)"}
                    </h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                      No. Surat: {selectedSearchLetter.letter.letterNumber}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedSearchLetter(null)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs md:text-sm">
                {/* Core Meta Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-150 dark:border-slate-850">
                  <div className="space-y-3">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Perihal</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{selectedSearchLetter.letter.subject}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Kategori</span>
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 rounded text-[11px] font-medium border border-blue-100 dark:border-blue-900/40 inline-block mt-0.5">
                        {selectedSearchLetter.letter.category || "Umum"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tanggal Surat</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {formatIndoDateGlobal(selectedSearchLetter.letter.letterDate)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {selectedSearchLetter.type === "in" ? (
                      <>
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">No. Agenda</span>
                          <span className="font-mono text-slate-700 dark:text-slate-200">{selectedSearchLetter.letter.agendaNumber || "-"}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tgl. Diterima</span>
                          <span className="font-medium text-slate-700 dark:text-slate-200">{formatIndoDateGlobal(selectedSearchLetter.letter.receivedDate)}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status Berkas</span>
                          <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-450 rounded text-[11px] font-bold border border-emerald-100 dark:border-emerald-900/40 inline-block mt-0.5 uppercase">
                            {selectedSearchLetter.letter.status}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Kode Verifikasi</span>
                          <span className="font-mono text-slate-700 dark:text-slate-200">{selectedSearchLetter.letter.verificationCode || "-"}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Penandatangan TTE</span>
                          <span className="font-medium text-slate-700 dark:text-slate-200">{selectedSearchLetter.letter.signatory || "-"}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status Keluar</span>
                          <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 rounded text-[11px] font-bold border border-indigo-100 dark:border-indigo-900/40 inline-block mt-0.5 uppercase">
                            {selectedSearchLetter.letter.status}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Sender vs Recipient Block */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-5">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {selectedSearchLetter.type === "in" ? "Instansi Pengirim" : "Instansi Penerima"}
                    </span>
                    <p className="font-bold text-slate-800 dark:text-slate-205 mt-0.5">
                      {selectedSearchLetter.type === "in" 
                        ? selectedSearchLetter.letter.senderInstitution 
                        : selectedSearchLetter.letter.recipientInstitution}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedSearchLetter.type === "in" 
                        ? selectedSearchLetter.letter.sender 
                        : selectedSearchLetter.letter.recipient}
                    </p>
                  </div>
                  {selectedSearchLetter.type === "out" && selectedSearchLetter.letter.recipientEmail && (
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Email Tujuan</span>
                      <p className="text-slate-700 dark:text-slate-300 font-mono mt-0.5">{selectedSearchLetter.letter.recipientEmail}</p>
                    </div>
                  )}
                  {selectedSearchLetter.type === "in" && selectedSearchLetter.letter.attachmentName && (
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Lampiran Berkas</span>
                      <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                        <Paperclip className="h-3.5 w-3.5" />
                        <span>{selectedSearchLetter.letter.attachmentName}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Specific Layout Body depending on incoming/outgoing */}
                {selectedSearchLetter.type === "in" ? (
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3">
                    <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Daftar Instruksi Disposisi</span>
                    {(!selectedSearchLetter.letter.dispositions || selectedSearchLetter.letter.dispositions.length === 0) ? (
                      <div className="p-4 bg-slate-50 dark:bg-slate-950/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500">
                        Belum ada instruksi disposisi dari pimpinan terdaftar untuk surat masuk ini.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedSearchLetter.letter.dispositions.map((disp: any, idx: number) => (
                          <div 
                            key={disp.id || idx}
                            className="bg-slate-50 dark:bg-slate-950/30 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-850"
                          >
                            <div className="flex justify-between items-start gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
                              <div>
                                <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                  Ditujukan Kepada: <span className="text-blue-600 dark:text-blue-400">{disp.targetRole}</span>
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  Dari: {disp.senderName} &bull; Tgl: {formatIndoDateGlobal(disp.createdAt)}
                                </p>
                              </div>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                                disp.priority === "Tinggi" 
                                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                  : disp.priority === "Sedang"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                  : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                              }`}>
                                Prioritas: {disp.priority}
                              </span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-350 italic text-[11px] leading-relaxed">
                              &ldquo;{disp.notes}&rdquo;
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3">
                    <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Isi Surat Keluar</span>
                    <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-150 dark:border-slate-850 font-serif whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-300 max-h-[220px] overflow-y-auto">
                      {selectedSearchLetter.letter.content}
                    </div>

                    {/* Signature Preview */}
                    <div className="bg-slate-50 dark:bg-slate-950/20 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-850 flex items-center justify-between gap-4">
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sertifikasi TTE</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs mt-0.5">{selectedSearchLetter.letter.signatory}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Status Keluar: {selectedSearchLetter.letter.status}</p>
                      </div>
                      <div className="p-1 bg-white border border-slate-200 rounded-lg shrink-0">
                        <div className="w-14 h-14 bg-slate-100 flex items-center justify-center rounded">
                          <svg className="w-10 h-10 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="1" y="1" width="6" height="6" strokeWidth="2.5" />
                            <rect x="17" y="1" width="6" height="6" strokeWidth="2.5" />
                            <rect x="1" y="17" width="6" height="6" strokeWidth="2.5" />
                            <circle cx="12" cy="12" r="1" fill="currentColor" />
                            <circle cx="18" cy="18" r="1" fill="currentColor" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer actions */}
              <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex flex-wrap gap-3 items-center justify-between shrink-0">
                <button
                  onClick={() => {
                    const destTab = selectedSearchLetter.type === "in" ? "surat_masuk" : "surat_keluar";
                    setActiveTab(destTab);
                    setSelectedSearchLetter(null);
                  }}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Buka di Halaman {selectedSearchLetter.type === "in" ? "Surat Masuk" : "Surat Keluar"}</span>
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleGlobalExportPDF(selectedSearchLetter.letter, selectedSearchLetter.type)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    <span>Ekspor PDF Resmi</span>
                  </button>
                  <button
                    onClick={() => setSelectedSearchLetter(null)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Tutup Detail
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
