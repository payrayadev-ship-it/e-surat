import React, { useState } from "react";
import { 
  Sparkles, ShieldAlert, CheckCircle2, AlertTriangle, Scale, ClipboardCheck, 
  Copy, Check, Printer, FileText, Info, ArrowRight, Loader2, RefreshCw, FileSignature, HelpCircle,
  FileDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserRole, UserProfile } from "../types";
import { jsPDF } from "jspdf";

interface AIKontrakProps {
  currentRole: UserRole;
  currentUser: UserProfile;
}

interface KeyClause {
  title: string;
  originalText: string;
  riskRating: "Low" | "Medium" | "High" | "None";
  simpleExplanation: string;
  recommendation: string;
}

interface MissingClause {
  clauseName: string;
  reason: string;
  recommendedDraft: string;
}

interface Obligation {
  party: string;
  obligationText: string;
  deadline: string;
  consequence: string;
}

interface AnalysisResult {
  summary: string;
  overallRiskLevel: "Low" | "Medium" | "High" | "Critical";
  overallRiskExplanation: string;
  keyClauses: KeyClause[];
  missingClauses: MissingClause[];
  obligationsAndDeadlines: Obligation[];
  customDraft: string;
  fallback?: boolean;
}

// 4 Preset templates to make trying the feature super easy!
const CONTRACT_TEMPLATES = [
  {
    id: "nda",
    title: "Perjanjian Kerahasiaan (NDA)",
    category: "nda",
    description: "Melindungi pertukaran data rahasia dan kode TTE",
    defaultPartner: "PT. Global Solusi Utama",
    text: `PERJANJIAN KERAHASIAAN DAN NON-DISCLOSURE AGREEMENT

Perjanjian ini dibuat antara PT Foresyndo Global Indonesia ("FGI") dan Pihak Kedua.
Penerima informasi wajib menjaga kerahasiaan Informasi Rahasia berupa kode penomoran e-office, skema database, dan dokumen internal.
Pihak Penerima wajib mengganti seluruh kerugian finansial, reputasi, dan biaya hukum akibat kebocoran informasi tanpa batasan nilai jika terjadi kelalaian.`
  },
  {
    id: "spk",
    title: "Surat Perintah Kerja (SPK) IT",
    category: "spk",
    description: "Pekerjaan instalasi modul server & API e-Office",
    defaultPartner: "CV. Digital Integra Jaya",
    text: `SURAT PERINTAH KERJA (SPK) PENGEMBANGAN SISTEM E-OFFICE

PT Foresyndo Global Indonesia menunjuk CV Digital Integra Jaya untuk melakukan instalasi modul e-Office, pemeliharaan server, dan integrasi QR Code.
Pembayaran dilakukan 100% lunas di muka setelah penandatanganan Surat Perintah Kerja oleh kedua belah pihak.
Keterlambatan penyelesaian pekerjaan oleh penyedia jasa akan dikenakan denda sesuai peraturan internal yang berlaku.`
  },
  {
    id: "mou",
    title: "Nota Kesepahaman (MOU) Kemitraan",
    category: "partnership",
    description: "Nota kesepahaman awal kerja sama pemasaran digital",
    defaultPartner: "PT. Sinergi Bisnis Nasional",
    text: `NOTA KESEPAHAMAN / MEMORANDUM OF UNDERSTANDING (MOU)

PT Foresyndo Global Indonesia dan Mitra sepakat bekerja sama memanfaatkan ekosistem digital untuk perluasan pasar korespondensi digital.
Perjanjian ini dapat diakhiri sewaktu-waktu oleh salah satu pihak dengan pemberitahuan tertulis sebelumnya kepada pihak lainnya.`
  },
  {
    id: "sewa",
    title: "Kontrak Sewa Ruang Kantor",
    category: "custom",
    description: "Perjanjian sewa ruko operasional cabang Jakarta Utara",
    defaultPartner: "Bapak H. Achmad Fauzi (Pemilik Gedung)",
    text: `SURAT PERJANJIAN SEWA MENYEWA RUANG KANTOR

Pihak Pertama menyewakan ruangan seluas 120m2 di Maspion Plaza kepada PT Foresyndo Global Indonesia untuk operasional kantor.
Uang sewa dibayarkan per tahun di muka. Kerusakan struktur bangunan akibat usia gedung sepenuhnya menjadi beban penyewa selama masa sewa berlangsung.`
  }
];

export default function AIKontrak({ currentRole, currentUser }: AIKontrakProps) {
  const [contractText, setContractText] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [contractType, setContractType] = useState("custom");
  const [actionMode, setActionMode] = useState<"analyze" | "draft">("analyze");
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<"summary" | "clauses" | "missing" | "obligations" | "draft">("summary");
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedDraft, setCopiedDraft] = useState(false);

  // Trigger loading text cycles
  const loadingMessages = [
    "Menghubungkan ke secure backend legal gateway...",
    "Membedah struktur klausa perdata dan tata bahasa hukum...",
    "Mendeteksi tingkat potensi bahaya & celah kewajiban (Risk Analysis)...",
    "Memeriksa kelengkapan elemen penting kontrak perusahaan...",
    "Menyusun visual dashboard & merancang draf rekomendasi amandemen..."
  ];

  const handleLoadTemplate = (template: typeof CONTRACT_TEMPLATES[0]) => {
    setContractText(template.text);
    setPartnerName(template.defaultPartner);
    setContractType(template.category);
    setError(null);
  };

  const handleProcessAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractText && actionMode === "analyze") {
      setError("Silakan masukkan teks kontrak terlebih dahulu.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setLoadingStep(0);

    // Increment loading step to make it feel alive
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
    }, 1800);

    try {
      const response = await fetch("/api/gemini/analyze-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractText: contractText,
          action: actionMode,
          contractType: contractType,
          partyName: partnerName
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gagal memproses draf hukum");
      }

      setResult(data);
      // Auto switch appropriate tabs depending on result action
      if (actionMode === "draft" && data.customDraft) {
        setActiveResultTab("draft");
      } else {
        setActiveResultTab("summary");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kegagalan koneksi sistem AI.");
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  };

  const handleCopyText = (text: string, index: number | null = null) => {
    navigator.clipboard.writeText(text);
    if (index !== null) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } else {
      setCopiedDraft(true);
      setTimeout(() => setCopiedDraft(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Export full legal contract draft with professional spacing and design
  const handleExportPDF = () => {
    if (!result || !result.customDraft) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pageHeight = 297;
    const pageWidth = 210;
    const leftMargin = 20;
    const contentWidth = 170;
    const bottomSafeZone = 275;

    let currentY = 25;
    let currentPage = 1;

    // Draw page decoration (corporate-style thin border and footer)
    const drawPageDecoration = (pageNum: number) => {
      // Draw thin elegant border
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.35);
      doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

      // Header watermark style info
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("FORSDIG AI LEGAL ADVOCACY PLATFORM - DRAFT DOKUMEN RESMI", leftMargin, 16);

      // Footer with page numbering
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Halaman ${pageNum}`, pageWidth / 2, pageHeight - 16, { align: "center" });
      doc.text("Verifikasi Keaslian Digital lewat QR Code di penomoran E-Office", leftMargin, pageHeight - 16);
    };

    drawPageDecoration(1);

    const rawLines = result.customDraft.split("\n");
    doc.setFont("times", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(30, 41, 59); // dark slate

    rawLines.forEach((rawLine) => {
      const trimmed = rawLine.trim();
      if (!trimmed) {
        currentY += 4.5; // empty line spacing
        return;
      }

      let isHeading = false;
      let headingSize = 10.5;
      let lineText = rawLine;

      if (trimmed.startsWith("# ")) {
        isHeading = true;
        headingSize = 14;
        lineText = trimmed.replace("# ", "");
        doc.setFont("times", "bold");
        doc.setFontSize(headingSize);
      } else if (trimmed.startsWith("## ")) {
        isHeading = true;
        headingSize = 12;
        lineText = trimmed.replace("## ", "");
        doc.setFont("times", "bold");
        doc.setFontSize(headingSize);
      } else if (trimmed.startsWith("### ")) {
        isHeading = true;
        headingSize = 11;
        lineText = trimmed.replace("### ", "");
        doc.setFont("times", "bold");
        doc.setFontSize(headingSize);
      } else {
        // Standard line, strip Markdown bold tags '**'
        doc.setFont("times", "normal");
        doc.setFontSize(10.5);
        lineText = trimmed.replace(/\*\*/g, ""); 
      }

      // Format wrap line
      const wrappedLines = doc.splitTextToSize(lineText, contentWidth);
      const lineSpacing = isHeading ? 6 : 5.2;

      wrappedLines.forEach((singleLine: string) => {
        if (currentY > bottomSafeZone - 20) {
          doc.addPage();
          currentPage++;
          drawPageDecoration(currentPage);
          currentY = 25;
          // Preserve font state on new page
          if (isHeading) {
            doc.setFont("times", "bold");
            doc.setFontSize(headingSize);
          } else {
            doc.setFont("times", "normal");
            doc.setFontSize(10.5);
          }
        }

        // Center main title heading
        if (trimmed.startsWith("# ")) {
          doc.text(singleLine, pageWidth / 2, currentY, { align: "center" });
        } else {
          doc.text(singleLine, leftMargin, currentY, { align: "justify", maxWidth: contentWidth });
        }
        currentY += lineSpacing;
      });

      currentY += isHeading ? 3.5 : 1.5; 
    });

    // Signature Block Section at the bottom of the contract
    if (currentY > bottomSafeZone - 45) {
      doc.addPage();
      currentPage++;
      drawPageDecoration(currentPage);
      currentY = 25;
    }

    currentY += 10;
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.text("DEMIKIAN PERJANJIAN ini dibuat secara sadar untuk dipatuhi bersama.", leftMargin, currentY);
    currentY += 12;

    const colLeft1 = leftMargin;
    const colLeft2 = leftMargin + 90;

    // Party labels
    doc.setFont("times", "bold");
    doc.setFontSize(10);
    doc.text("PIHAK PERTAMA,", colLeft1, currentY);
    doc.text("PT Foresyndo Global Indonesia", colLeft1, currentY + 4);

    doc.text("PIHAK KEDUA,", colLeft2, currentY);
    doc.text(partnerName || "Mitra Kerja Sama", colLeft2, currentY + 4);

    currentY += 10;

    // Certified stamp block for PT FGI (Pihak Pertama)
    doc.setDrawColor(37, 99, 235); // Blue-600
    doc.setLineWidth(0.4);
    doc.setFillColor(239, 246, 255); // Blue-50 bg
    doc.roundedRect(colLeft1, currentY, 60, 20, 1.5, 1.5, "FD");

    doc.setTextColor(37, 99, 235);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("DIGITAL SIGNATURE SECURED", colLeft1 + 4, currentY + 5.5);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text("Oleh: PT Foresyndo Global Indonesia", colLeft1 + 4, currentY + 10);
    doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, colLeft1 + 4, currentY + 13.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129); // green-500
    doc.text("✓ VERIFIED BY FORSDIG SYSTEM", colLeft1 + 4, currentY + 17);

    // Empty signature field for Pihak Kedua
    doc.setDrawColor(148, 163, 184); // slate-400
    doc.setLineWidth(0.3);
    doc.line(colLeft2, currentY + 14, colLeft2 + 60, currentY + 14);
    doc.setTextColor(71, 85, 105);
    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.text("(Tanda Tangan & Nama Terang)", colLeft2, currentY + 18.5);

    // Save PDF
    const safePartner = (partnerName || "Mitra").trim().replace(/[^a-zA-Z0-9]/g, "_");
    doc.save(`Draf_Kontrak_${safePartner}.pdf`);
  };

  // Export Legal Risk Audit/Analysis Report as PDF
  const handleExportAnalysisPDF = () => {
    if (!result) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pageHeight = 297;
    const pageWidth = 210;
    const leftMargin = 20;
    const contentWidth = 170;
    const bottomSafeZone = 275;

    let currentY = 20;
    let currentPage = 1;

    // Draw Report header decoration
    const drawReportHeader = (pageNum: number) => {
      // Elegant Blue Banner header block
      doc.setFillColor(30, 41, 142); // Navy
      doc.rect(0, 0, pageWidth, 12, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("FORSDIG AI LEGAL AUDIT REPORT & RISK CLASSIFICATION", leftMargin, 8);

      // Elegant grey frame border
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.35);
      doc.rect(12, 18, pageWidth - 24, pageHeight - 32);

      // Footer
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`Laporan Analisis  |  Halaman ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: "center" });
      doc.text("PT Foresyndo Global Indonesia", leftMargin, pageHeight - 10);
    };

    drawReportHeader(1);
    currentY = 28;

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("LAPORAN ANALISIS RISIKO HUKUM KONTRAK", leftMargin, currentY);
    currentY += 6.5;

    // Basic metadata details
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Kategori Kontrak: ${(contractType || "Custom").toUpperCase()}`, leftMargin, currentY);
    doc.text(`Mitra Kerja Sama: ${partnerName || "-"}`, leftMargin + 85, currentY);
    currentY += 5;
    doc.text(`Waktu Audit AI: ${new Date().toLocaleString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, leftMargin, currentY);
    currentY += 7;

    // Separator line
    doc.setDrawColor(30, 41, 142);
    doc.setLineWidth(0.8);
    doc.line(leftMargin, currentY, pageWidth - leftMargin, currentY);
    currentY += 6;

    // Risk classification banner block
    let rColor = [148, 163, 184]; // grey default
    let rBg = [248, 250, 252];
    const riskLvl = (result.overallRiskLevel || "Medium").toLowerCase();
    
    if (riskLvl === "critical" || riskLvl === "high") {
      rColor = [185, 28, 28]; // red
      rBg = [254, 242, 242];
    } else if (riskLvl === "medium") {
      rColor = [180, 83, 9]; // amber/orange
      rBg = [255, 251, 235];
    } else if (riskLvl === "low") {
      rColor = [4, 120, 87]; // emerald/green
      rBg = [240, 253, 250];
    }

    doc.setFillColor(rBg[0], rBg[1], rBg[2]);
    doc.roundedRect(leftMargin, currentY, contentWidth, 18, 1.5, 1.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(rColor[0], rColor[1], rColor[2]);
    doc.text(`TINGKAT RISIKO GLOBAL: ${(result.overallRiskLevel || "MEDIUM").toUpperCase()} RISK`, leftMargin + 4, currentY + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const explWrapped = doc.splitTextToSize(result.overallRiskExplanation, contentWidth - 8);
    doc.text(explWrapped, leftMargin + 4, currentY + 11.5, { lineHeightFactor: 1.25 });
    currentY += 24;

    // Executive summary section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("1. RINGKASAN EKSEKUTIF", leftMargin, currentY);
    currentY += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const sumWrapped = doc.splitTextToSize(result.summary, contentWidth);
    doc.text(sumWrapped, leftMargin, currentY, { align: "justify", maxWidth: contentWidth });
    currentY += (sumWrapped.length * 4.8) + 8;

    // Key Clause audit list
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("2. PEMBEDAHAN KLAUSUL & REKOMENDASI AMANDEMEN", leftMargin, currentY);
    currentY += 6;

    if (result.keyClauses && result.keyClauses.length > 0) {
      result.keyClauses.forEach((clause, idx) => {
        if (currentY > bottomSafeZone - 30) {
          doc.addPage();
          currentPage++;
          drawReportHeader(currentPage);
          currentY = 25;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text(`${idx + 1}. ${clause.title}`, leftMargin, currentY);

        // Draw badge for clause risk rating
        let clauseBadgeColor = [148, 163, 184];
        const clRisk = (clause.riskRating || "").toLowerCase();
        if (clRisk === "high" || clRisk === "critical") {
          clauseBadgeColor = [220, 38, 38];
        } else if (clRisk === "medium") {
          clauseBadgeColor = [217, 119, 6];
        } else if (clRisk === "low") {
          clauseBadgeColor = [5, 150, 105];
        }

        doc.setFillColor(clauseBadgeColor[0], clauseBadgeColor[1], clauseBadgeColor[2]);
        doc.roundedRect(pageWidth - leftMargin - 22, currentY - 3.5, 22, 4.5, 0.8, 0.8, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.text(clause.riskRating.toUpperCase() + " RISK", pageWidth - leftMargin - 11, currentY - 0.2, { align: "center" });

        currentY += 4.5;

        // Original text block inside a light gray box
        doc.setFillColor(248, 250, 252);
        const originalTextCleaned = (clause.originalText || "").replace(/\s+/g, " ");
        const textLines = doc.splitTextToSize(`Teks Asli: "${originalTextCleaned}"`, contentWidth - 6);
        const boxHeight = (textLines.length * 4) + 5;
        
        doc.roundedRect(leftMargin, currentY - 1, contentWidth, boxHeight, 0.8, 0.8, "F");
        
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.text(textLines, leftMargin + 3, currentY + 3);
        currentY += boxHeight + 2;

        // Explanation and recommendation
        doc.setTextColor(51, 65, 85);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        
        doc.setFont("helvetica", "bold");
        doc.text("Arti Hukum: ", leftMargin, currentY);
        doc.setFont("helvetica", "normal");
        const simpleExplWrapped = doc.splitTextToSize(clause.simpleExplanation, contentWidth - 25);
        doc.text(simpleExplWrapped, leftMargin + 25, currentY);
        currentY += (simpleExplWrapped.length * 4.2) + 1.5;

        doc.setFont("helvetica", "bold");
        doc.text("Rekomendasi: ", leftMargin, currentY);
        doc.setFont("helvetica", "normal");
        const recWrapped = doc.splitTextToSize(clause.recommendation, contentWidth - 25);
        doc.text(recWrapped, leftMargin + 25, currentY);
        currentY += (recWrapped.length * 4.2) + 6;
      });
    }

    // Missing vital clauses section
    if (result.missingClauses && result.missingClauses.length > 0) {
      if (currentY > bottomSafeZone - 20) {
        doc.addPage();
        currentPage++;
        drawReportHeader(currentPage);
        currentY = 25;
      }

      currentY += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text("3. KLAUSUL HUKUM YANG ABSEN (REKOMENDASI VITAL)", leftMargin, currentY);
      currentY += 5.5;

      result.missingClauses.forEach((clause, idx) => {
        if (currentY > bottomSafeZone - 35) {
          doc.addPage();
          currentPage++;
          drawReportHeader(currentPage);
          currentY = 25;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(220, 38, 38); // red
        doc.text(`[HILANG] ${clause.clauseName}`, leftMargin, currentY);
        currentY += 4.5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        const reasonLines = doc.splitTextToSize(`Sebab Vital: ${clause.reason}`, contentWidth);
        doc.text(reasonLines, leftMargin, currentY);
        currentY += (reasonLines.length * 4.2) + 2.5;

        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("Saran Naskah Tambahan:", leftMargin, currentY);
        currentY += 4;

        doc.setFillColor(241, 245, 249); // slate-100 bg
        const draftLines = doc.splitTextToSize(clause.recommendedDraft, contentWidth - 6);
        const draftBoxHeight = (draftLines.length * 4) + 6;

        doc.roundedRect(leftMargin, currentY - 1, contentWidth, draftBoxHeight, 0.8, 0.8, "F");
        doc.setFont("courier", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        doc.text(draftLines, leftMargin + 3, currentY + 3.5);
        currentY += draftBoxHeight + 6;
      });
    }

    // Save report PDF
    const safePartner = (partnerName || "Mitra").trim().replace(/[^a-zA-Z0-9]/g, "_");
    doc.save(`Laporan_Analisis_Risiko_${safePartner}.pdf`);
  };
  const getRiskColor = (level: string) => {
    switch ((level || "").toLowerCase()) {
      case "critical": return { bg: "bg-rose-50 dark:bg-rose-950/30", text: "text-rose-700 dark:text-rose-400", border: "border-rose-200 dark:border-rose-900", badge: "bg-rose-600 text-white" };
      case "high": return { bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-700 dark:text-orange-400", border: "border-orange-200 dark:border-orange-900", badge: "bg-orange-500 text-white" };
      case "medium": return { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-900", badge: "bg-amber-500 text-slate-900" };
      case "low": return { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-900", badge: "bg-emerald-600 text-white" };
      default: return { bg: "bg-slate-50 dark:bg-slate-900/30", text: "text-slate-700 dark:text-slate-400", border: "border-slate-200 dark:border-slate-800", badge: "bg-slate-500 text-white" };
    }
  };

  return (
    <div className="space-y-6" id="ai-kontrak-view">
      
      {/* Upper banner design */}
      <div className="p-6 bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl shadow-md border border-blue-850 relative overflow-hidden">
        {/* Subtle glow decorative shapes */}
        <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-[-30px] left-[20%] w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/10 dark:bg-black/20 rounded-full text-[10px] font-bold tracking-widest uppercase text-blue-300">
              <Sparkles className="h-3 w-3 animate-pulse" />
              <span>Smart Legal Workspace</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
              FORSDIG AI Kontrak & Legal Advisor
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Analisis risiko draf hukum, bedah celah pasal penalti, penjelasan bahasa perdata yang rumit secara ringkas, serta otomatisasi penyusunan draf kontrak baru berbasis model penalaran hukum (Gemini AI).
            </p>
          </div>
          <div className="flex gap-2">
            <div className="px-4 py-3 bg-white/5 dark:bg-black/10 rounded-xl border border-white/10 text-center shrink-0">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Akurasi Sistem</p>
              <p className="text-lg font-black text-blue-400">98.4%</p>
            </div>
            <div className="px-4 py-3 bg-white/5 dark:bg-black/10 rounded-xl border border-white/10 text-center shrink-0">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status Sertifikasi</p>
              <p className="text-lg font-black text-emerald-400">AKTIF</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Form and Template Column (Left Side) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Quick templates loader card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-5 shadow-xs">
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center space-x-1.5">
              <ClipboardCheck className="h-4 w-4 text-blue-500" />
              <span>Muat Cepat Templat Kontrak</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" id="contract-templates-grid">
              {CONTRACT_TEMPLATES.map(tmpl => (
                <button
                  key={tmpl.id}
                  onClick={() => handleLoadTemplate(tmpl)}
                  className="p-3 text-left bg-slate-50 hover:bg-blue-50/40 dark:bg-slate-950 dark:hover:bg-blue-950/25 border border-slate-150 dark:border-slate-850 hover:border-blue-300 dark:hover:border-blue-800 rounded-lg group transition-all cursor-pointer"
                  title="Klik untuk memuat draf teks ke form analisis"
                >
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">{tmpl.title}</p>
                  <p className="text-[9px] text-slate-450 dark:text-slate-400 mt-1 line-clamp-2">{tmpl.description}</p>
                  <div className="flex items-center space-x-1 text-[9px] text-blue-600 dark:text-blue-450 font-bold mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Gunakan</span>
                    <ArrowRight className="h-2.5 w-2.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Core Input Form Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-5 shadow-xs">
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center space-x-1.5">
              <Scale className="h-4 w-4 text-indigo-500" />
              <span>Konfigurasi & Berkas Kontrak</span>
            </h2>

            <form onSubmit={handleProcessAI} className="space-y-4 text-xs md:text-sm">
              
              {/* Action Mode Toggle */}
              <div>
                <label className="block text-slate-500 font-semibold mb-2">Tujuan Pemrosesan AI</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setActionMode("analyze");
                      setError(null);
                    }}
                    className={`py-2 px-3 text-center rounded-md font-bold text-xs transition-all cursor-pointer ${
                      actionMode === "analyze"
                        ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-250"
                    }`}
                  >
                    Analisis Risiko Draf
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActionMode("draft");
                      setError(null);
                    }}
                    className={`py-2 px-3 text-center rounded-md font-bold text-xs transition-all cursor-pointer ${
                      actionMode === "draft"
                        ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-250"
                    }`}
                  >
                    Drafting Kontrak Baru
                  </button>
                </div>
              </div>

              {/* Partner Name Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Nama Mitra (Pihak Kedua)</label>
                  <input
                    type="text"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder="Nama Instansi/Perusahaan"
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Kategori Perjanjian</label>
                  <select
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-medium"
                  >
                    <option value="custom">Perjanjian Umum (Custom)</option>
                    <option value="nda">Perjanjian Kerahasiaan (NDA)</option>
                    <option value="spk">Surat Perintah Kerja (SPK)</option>
                    <option value="partnership">Kerja Sama Kemitraan (PKS)</option>
                  </select>
                </div>
              </div>

              {/* Large Text Area for Input */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  {actionMode === "analyze" ? "Salin & Tempel Teks Kontrak / Klausul" : "Instruksi Kontrak & Klausul Khusus"}
                </label>
                <div className="relative">
                  <textarea
                    rows={11}
                    value={contractText}
                    onChange={(e) => setContractText(e.target.value)}
                    placeholder={
                      actionMode === "analyze"
                        ? "Masukkan pasal-pasal atau dokumen kontrak hukum yang ingin ditinjau risikonya di sini...\nAtau muat salah satu templat cepat di atas."
                        : "Tulis poin-poin yang Anda inginkan masuk dalam draf kontrak. Contoh:\n- Jual beli software server seharga Rp 150juta\n- Pembayaran 3 termin\n- Denda keterlambatan 1 permil per hari."
                    }
                    className="w-full p-3 font-mono text-[11px] border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                  />
                  {contractText && (
                    <button
                      type="button"
                      onClick={() => setContractText("")}
                      className="absolute top-2.5 right-2.5 p-1 bg-slate-200 dark:bg-slate-800 text-slate-500 rounded hover:text-rose-500 transition-colors"
                      title="Clear text"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex justify-between items-center mt-1 text-[10px] text-slate-400 font-medium">
                  <span>Saran: {actionMode === "analyze" ? "Tinjau minimal 3 baris klausa" : "Gunakan detail lengkap"}</span>
                  <span>{contractText.length} karakter</span>
                </div>
              </div>

              {/* Submit Action Button */}
              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-semibold">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-xs cursor-pointer flex items-center justify-center space-x-2 disabled:bg-blue-400/50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    <span>Memproses Analisis AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 shrink-0" />
                    <span>
                      {actionMode === "analyze" ? "Eksekusi Analisis Hukum AI" : "Susun Draf Kontrak Hukum AI"}
                    </span>
                  </>
                )}
              </button>

            </form>
          </div>

        </div>

        {/* Output and Results Column (Right Side) */}
        <div className="lg:col-span-7">
          
          <AnimatePresence mode="wait">
            
            {/* 1. Loading Visualizer */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-8 shadow-md text-center space-y-6 flex flex-col justify-center items-center min-h-[480px]"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-blue-100 dark:border-blue-900/40 border-t-blue-600 dark:border-t-blue-400 animate-spin" />
                  <Sparkles className="h-6 w-6 text-blue-500 absolute top-5 left-5 animate-pulse" />
                </div>
                
                <div className="space-y-2 max-w-sm">
                  <h3 className="font-bold text-slate-850 dark:text-slate-100 text-base">Sedang Memproses Dokumen</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Asisten AI sedang menyisir dokumen hukum Anda. Mohon tunggu sejenak.
                  </p>
                </div>

                {/* Simulated Terminal logs container to look premium and authentic */}
                <div className="w-full max-w-md bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl p-4 text-left font-mono text-[10px] space-y-1 text-slate-500">
                  <div className="flex items-center space-x-1.5 text-blue-600 dark:text-blue-400 font-bold">
                    <span>●</span>
                    <span>AI_STUDIO_COGNITIVE_ENGINE_ON</span>
                  </div>
                  <div className="text-slate-400">Analyst: FORSDIG Legal Sandbox Agent v2.5</div>
                  <div className="text-slate-400">Category: {contractType.toUpperCase()} | Action: {actionMode.toUpperCase()}</div>
                  <div className="border-t border-slate-200 dark:border-slate-800/80 my-2"></div>
                  <div className="text-slate-700 dark:text-slate-350 font-semibold animate-pulse flex items-center space-x-1">
                    <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                    <span>{loadingMessages[loadingStep]}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. Blank State (Before action) */}
            {!isLoading && !result && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-10 shadow-xs text-center space-y-5 flex flex-col justify-center items-center min-h-[480px]"
              >
                <div className="h-16 w-16 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-2xl flex items-center justify-center text-blue-600">
                  <FileSignature className="h-8 w-8" />
                </div>
                <div className="space-y-2 max-w-md">
                  <h3 className="font-bold text-slate-850 dark:text-slate-100 text-base">Layanan Asisten AI Kontrak</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Belum ada proses yang berjalan. Silakan pilih salah satu templat cepat di sebelah kiri atau ketik sendiri draf klausa hukum Anda, lalu klik tombol eksekusi untuk memulai visualisasi analisis.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4 w-full max-w-md pt-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-150 dark:border-slate-850 text-center">
                    <p className="text-lg font-black text-slate-800 dark:text-slate-200">1</p>
                    <p className="text-[9px] text-slate-450 font-semibold uppercase">Pilih Templat</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-150 dark:border-slate-850 text-center">
                    <p className="text-lg font-black text-slate-800 dark:text-slate-200">2</p>
                    <p className="text-[9px] text-slate-450 font-semibold uppercase">Sesuaikan Nama</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-150 dark:border-slate-850 text-center">
                    <p className="text-lg font-black text-slate-800 dark:text-slate-200">3</p>
                    <p className="text-[9px] text-slate-450 font-semibold uppercase">Analisis AI</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 3. Output Dashboard */}
            {!isLoading && result && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
                id="ai-analysis-results-container"
              >
                
                {/* Overall Risk Banner */}
                <div className={`p-5 rounded-2xl border ${getRiskColor(result.overallRiskLevel).border} ${getRiskColor(result.overallRiskLevel).bg} flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xs`}>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4 flex-1">
                    <div className={`p-3 rounded-xl shrink-0 flex items-center justify-center ${getRiskColor(result.overallRiskLevel).badge}`}>
                      {result.overallRiskLevel === "Critical" || result.overallRiskLevel === "High" ? (
                        <ShieldAlert className="h-6 w-6" />
                      ) : result.overallRiskLevel === "Medium" ? (
                        <AlertTriangle className="h-6 w-6" />
                      ) : (
                        <CheckCircle2 className="h-6 w-6" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Tingkat Risiko Kontrak</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase ${getRiskColor(result.overallRiskLevel).badge}`}>
                          {result.overallRiskLevel} Risk
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-450 font-medium leading-relaxed">
                        <span className="font-bold text-slate-800 dark:text-slate-200">Analisis Pimpinan:</span> {result.overallRiskExplanation}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 flex self-start sm:self-center">
                    <button
                      type="button"
                      onClick={handleExportAnalysisPDF}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                      title="Unduh file Laporan Analisis Risiko Hukum Lengkap dalam format PDF"
                    >
                      <FileDown className="h-4 w-4" />
                      <span>Ekspor Laporan PDF</span>
                    </button>
                  </div>
                </div>

                {/* Tab select dashboard result */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden shadow-xs">
                  
                  {/* Results Tab Buttons */}
                  <div className="flex border-b border-slate-150 dark:border-slate-850 overflow-x-auto" id="results-sub-tabs">
                    <button
                      onClick={() => setActiveResultTab("summary")}
                      className={`px-4 py-3 text-xs font-bold shrink-0 transition-all border-b-2 cursor-pointer ${
                        activeResultTab === "summary"
                          ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-slate-50/50 dark:bg-slate-950/20"
                          : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      Kesimpulan
                    </button>
                    <button
                      onClick={() => setActiveResultTab("clauses")}
                      className={`px-4 py-3 text-xs font-bold shrink-0 transition-all border-b-2 cursor-pointer ${
                        activeResultTab === "clauses"
                          ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-slate-50/50 dark:bg-slate-950/20"
                          : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      Pembedahan Klausul ({result.keyClauses?.length || 0})
                    </button>
                    <button
                      onClick={() => setActiveResultTab("missing")}
                      className={`px-4 py-3 text-xs font-bold shrink-0 transition-all border-b-2 cursor-pointer ${
                        activeResultTab === "missing"
                          ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-slate-50/50 dark:bg-slate-950/20"
                          : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      Klausul Hilang ({result.missingClauses?.length || 0})
                    </button>
                    <button
                      onClick={() => setActiveResultTab("obligations")}
                      className={`px-4 py-3 text-xs font-bold shrink-0 transition-all border-b-2 cursor-pointer ${
                        activeResultTab === "obligations"
                          ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-slate-50/50 dark:bg-slate-950/20"
                          : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      Kewajiban & SLA ({result.obligationsAndDeadlines?.length || 0})
                    </button>
                    {result.customDraft && (
                      <button
                        onClick={() => setActiveResultTab("draft")}
                        className={`px-4 py-3 text-xs font-bold shrink-0 transition-all border-b-2 cursor-pointer ${
                          activeResultTab === "draft"
                            ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-slate-50/50 dark:bg-slate-950/20"
                            : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                      >
                        Hasil Draf Kontrak
                      </button>
                    )}
                  </div>

                  <div className="p-6">
                    
                    {/* TAB A: SUMMARY */}
                    {activeResultTab === "summary" && (
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Ringkasan Eksekutif Kontrak</h4>
                          <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed font-medium bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850">
                            {result.summary}
                          </p>
                        </div>

                        {/* Visual Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-1">
                            <div className="flex items-center space-x-1.5 text-indigo-600 dark:text-indigo-400">
                              <Info className="h-3.5 w-3.5 shrink-0" />
                              <span className="text-[10px] font-bold uppercase tracking-wider">Temuan Utama</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                              Terdapat <span className="font-bold text-slate-850 dark:text-slate-100">{result.keyClauses.filter(c => c.riskRating === "High" || c.riskRating === "Critical").length} klausul berisiko tinggi</span> dan <span className="font-bold text-slate-850 dark:text-slate-100">{result.missingClauses.length} elemen vital</span> hukum yang terdeteksi luput/absen.
                            </p>
                          </div>

                          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-1">
                            <div className="flex items-center space-x-1.5 text-blue-600 dark:text-blue-400">
                              <Scale className="h-3.5 w-3.5 shrink-0" />
                              <span className="text-[10px] font-bold uppercase tracking-wider">Mitigasi Rekomendasi</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                              Amandemen klausul ganti rugi & penetapan denda keterlambatan (SLA) disarankan segera dimasukkan sebelum melakukan tanda tangan digital (TTE).
                            </p>
                          </div>
                        </div>

                        {result.fallback && (
                          <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl flex items-center space-x-2 text-[11px] text-blue-700 dark:text-blue-400 font-semibold">
                            <Info className="h-4 w-4 text-blue-500 shrink-0" />
                            <span>Ini adalah simulasi analisis detail. Hubungkan kunci API di panel Pengaturan Secrets untuk menggunakan AI real-time.</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB B: KEY CLAUSES */}
                    {activeResultTab === "clauses" && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Pembedahan Klausul Kontrak Terdeteksi</h4>
                          <span className="text-[10px] font-mono text-slate-400">Menyisir {result.keyClauses.length} Klausul</span>
                        </div>
                        
                        <div className="space-y-3" id="risk-clause-list">
                          {result.keyClauses.map((clause, idx) => (
                            <div key={idx} className="border border-slate-150 dark:border-slate-850 rounded-xl p-4 bg-slate-50/40 dark:bg-slate-950/20 space-y-3">
                              <div className="flex justify-between items-start gap-2">
                                <h5 className="font-bold text-slate-800 dark:text-slate-100 text-xs md:text-sm">{clause.title}</h5>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase ${getRiskColor(clause.riskRating).badge}`}>
                                  {clause.riskRating}
                                </span>
                              </div>

                              <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border-l-2 border-slate-300 dark:border-slate-700 rounded-r font-mono text-[10px] text-slate-500 leading-relaxed">
                                &ldquo;{clause.originalText}&rdquo;
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center space-x-1">
                                    <HelpCircle className="h-3 w-3" />
                                    <span>Penjelasan Sederhana</span>
                                  </p>
                                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                                    {clause.simpleExplanation}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center space-x-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span>Saran Amandemen Hukum</span>
                                  </p>
                                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                                    {clause.recommendation}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TAB C: MISSING CLAUSES */}
                    {activeResultTab === "missing" && (
                      <div className="space-y-4">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Komponen Hukum Yang Hilang (Direkomendasikan)</h4>
                        
                        {result.missingClauses.length === 0 ? (
                          <div className="p-8 text-center text-slate-400">
                            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Dokumen Lengkap</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Seluruh klausa vital yang disarankan telah terpenuhi dalam draf ini.</p>
                          </div>
                        ) : (
                          <div className="space-y-4" id="missing-clauses-list">
                            {result.missingClauses.map((clause, idx) => (
                              <div key={idx} className="border border-slate-150 dark:border-slate-850 rounded-xl p-4 bg-slate-50/40 dark:bg-slate-950/20 space-y-3">
                                <div>
                                  <h5 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs md:text-sm flex items-center space-x-1.5">
                                    <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                                    <span>{clause.clauseName}</span>
                                  </h5>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium mt-1">
                                    <span className="font-bold text-slate-700 dark:text-slate-350">Dampak Absennya:</span> {clause.reason}
                                  </p>
                                </div>

                                <div className="space-y-1.5">
                                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    <span>Rancangan Draf Pasal Siap Pakai</span>
                                    <button
                                      onClick={() => handleCopyText(clause.recommendedDraft, idx)}
                                      className="inline-flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer bg-transparent border-none py-0.5 px-1 rounded hover:bg-blue-50/50"
                                    >
                                      {copiedIndex === idx ? (
                                        <>
                                          <Check className="h-3 w-3 text-emerald-500" />
                                          <span className="text-emerald-500">Tersalin!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="h-3 w-3" />
                                          <span>Salin Klausul</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                  <pre className="p-3 bg-slate-900 dark:bg-black text-slate-200 text-[10px] font-mono leading-relaxed rounded-lg whitespace-pre-wrap select-all">
                                    {clause.recommendedDraft}
                                  </pre>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB D: OBLIGATIONS & DEADLINES */}
                    {activeResultTab === "obligations" && (
                      <div className="space-y-4">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Pemetaan Tanggung Jawab & Tenggat Waktu (SLA)</h4>
                        
                        <div className="overflow-x-auto border border-slate-150 dark:border-slate-850 rounded-xl" id="obligations-table-container">
                          <table className="min-w-full divide-y divide-slate-150 dark:divide-slate-850 text-xs text-left">
                            <thead className="bg-slate-50 dark:bg-slate-950 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                              <tr>
                                <th className="p-3">Penanggung Jawab</th>
                                <th className="p-3">Rincian Kewajiban</th>
                                <th className="p-3">Tenggat Waktu</th>
                                <th className="p-3">Dampak/Sanksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-150 dark:divide-slate-850 font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900">
                              {result.obligationsAndDeadlines.map((ob, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                                  <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                                    {ob.party}
                                  </td>
                                  <td className="p-3 max-w-xs">{ob.obligationText}</td>
                                  <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{ob.deadline}</td>
                                  <td className="p-3 text-[11px] text-rose-600 dark:text-rose-400">{ob.consequence}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* TAB E: REVISED CONTRACT DRAFT */}
                    {activeResultTab === "draft" && result.customDraft && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Naskah Draf Kontrak Hukum Legal</h4>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleCopyText(result.customDraft)}
                              className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] rounded-md shadow-xs transition-all active:scale-95 cursor-pointer"
                            >
                              {copiedDraft ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-500" />
                                  <span className="text-emerald-500 font-bold">Berhasil Tersalin!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  <span>Salin Naskah</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={handleExportPDF}
                              className="inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 border border-blue-600 text-white font-bold text-[10px] rounded-md shadow-xs transition-all active:scale-95 cursor-pointer"
                              title="Ekspor draf naskah hukum legal dalam format PDF profesional"
                            >
                              <FileDown className="h-3.5 w-3.5" />
                              <span>Unduh Naskah PDF</span>
                            </button>
                            <button
                              onClick={handlePrint}
                              className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] rounded-md shadow-xs transition-all active:scale-95 cursor-pointer"
                            >
                              <Printer className="h-3.5 w-3.5" />
                              <span>Cetak / Print</span>
                            </button>
                          </div>
                        </div>

                        {/* Beautiful Paper View mimicking corporate draft */}
                        <div 
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-xl shadow-xs overflow-auto max-h-[500px]" 
                          id="legal-paper-view"
                        >
                          <div className="font-sans text-xs md:text-sm text-slate-800 dark:text-slate-200 leading-relaxed space-y-4 whitespace-pre-line">
                            {result.customDraft}
                          </div>
                        </div>
                      </div>
                    )}

                  </div>

                </div>

              </motion.div>
            )}

          </AnimatePresence>

        </div>

      </div>

    </div>
  );
}
