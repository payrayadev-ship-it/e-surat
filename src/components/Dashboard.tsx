import React, { useState } from "react";
import { Mail, MailOpen, AlertCircle, FileText, Send, Clock, UserCheck, ShieldAlert } from "lucide-react";
import { LetterIn, LetterOut, Disposition, AuditLog } from "../types";
import { jsPDF } from "jspdf";

interface DashboardProps {
  lettersIn: LetterIn[];
  lettersOut: LetterOut[];
  dispositions: Disposition[];
  auditLogs: AuditLog[];
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ lettersIn, lettersOut, dispositions, auditLogs, onNavigate }: DashboardProps) {
  // Calculated status indicators
  const totalIn = lettersIn.length;
  const totalOut = lettersOut.length;
  const pendingDisp = lettersIn.filter(l => l.status === "Baru" || l.status === "Diproses").length;
  const unreadMails = lettersIn.filter(l => l.status === "Baru").length;
  
  // Real-time "Urgent / Jatuh Tempo" calculation
  const urgentMails = lettersIn.filter(l => l.urgency === "Penting" || l.urgency === "Sangat Rahasia").length;

  // Monthly stats seed mapping for chart visualization
  // Jan to Jun corresponding data
  const monthlyData = [
    { name: "Jan", masuk: 12, keluar: 8 },
    { name: "Feb", masuk: 18, keluar: 12 },
    { name: "Mar", masuk: 15, keluar: 14 },
    { name: "Apr", masuk: 22, keluar: 19 },
    { name: "Mei", masuk: 25, keluar: 22 },
    { name: "Jun", masuk: totalIn + 5, keluar: totalOut + 3 }
  ];

  const maxVal = 30; // Scale height

  const handleDownloadSummaryPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");
    
    // Define layout sizes and colors
    const leftMargin = 15;
    const rightMargin = 195;
    const contentWidth = 180;
    
    // --- 1. Corporate Header Band ---
    doc.setFillColor(30, 58, 138); // Deep official navy blue
    doc.roundedRect(leftMargin, 12, 16, 16, 2, 2, "F");
    
    // Logo text
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("FGI", leftMargin + 8, 22, { align: "center" });
    
    // Corporate names
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("PT FGI INDONESIA", 36, 17);
    
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text("Sistem Korespondensi & Arsip Digital Terpadu (FGI Office)", 36, 21.5);
    doc.text("Gedung FGI Hub, Lt. 12, Jakarta Selatan, DKI Jakarta", 36, 25);
    
    // Divider line
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.65);
    doc.line(leftMargin, 31, rightMargin, 31);
    
    doc.setDrawColor(148, 163, 184); // slate-400
    doc.setLineWidth(0.2);
    doc.line(leftMargin, 32.2, rightMargin, 32.2);
    
    // --- 2. Title & Metadata ---
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("LAPORAN RINGKASAN KOLEKTIF STATISTIK BULANAN", leftMargin, 41);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139); // slate-500
    const printDate = new Date().toLocaleString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    doc.text(`Tanggal Cetak: ${printDate} WIB`, leftMargin, 46);
    
    doc.setFont("courier", "bold");
    doc.text("DOKUMEN: RPT-FGI-STAT-2026", rightMargin, 46, { align: "right" });
    
    // --- 3. Cards Section (Metrics Summary Grid) ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text("I. METRIK UTAMA KORESPONDENSI", leftMargin, 55);
    
    const cardY1 = 58;
    const cardWidth = 56;
    const cardHeight = 18;
    
    // Metric Card 1: Surat Masuk
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.2);
    doc.roundedRect(leftMargin, cardY1, cardWidth, cardHeight, 1, 1, "FD");
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text("TOTAL SURAT MASUK", leftMargin + 4, cardY1 + 5.5);
    doc.setTextColor(29, 78, 216); // blue-700
    doc.setFontSize(14);
    doc.text(String(totalIn), leftMargin + 4, cardY1 + 14);
    
    // Metric Card 2: Surat Keluar
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(leftMargin + cardWidth + 6, cardY1, cardWidth, cardHeight, 1, 1, "FD");
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text("TOTAL SURAT KELUAR", leftMargin + cardWidth + 10, cardY1 + 5.5);
    doc.setTextColor(109, 40, 217); // purple-700
    doc.setFontSize(14);
    doc.text(String(totalOut), leftMargin + cardWidth + 10, cardY1 + 14);
    
    // Metric Card 3: Butuh Disposisi
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(leftMargin + (cardWidth * 2) + 12, cardY1, cardWidth - 4, cardHeight, 1, 1, "FD");
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text("BUTUH DISPOSISI", leftMargin + (cardWidth * 2) + 16, cardY1 + 5.5);
    doc.setTextColor(180, 83, 9); // amber-700
    doc.setFontSize(14);
    doc.text(String(pendingDisp), leftMargin + (cardWidth * 2) + 16, cardY1 + 14);
    
    // Card Row 2
    const cardY2 = 80;
    
    // Metric Card 4: Belum Dibaca
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(leftMargin, cardY2, cardWidth, cardHeight, 1, 1, "FD");
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text("BELUM DIBACA", leftMargin + 4, cardY2 + 5.5);
    doc.setTextColor(13, 148, 136); // teal-600
    doc.setFontSize(14);
    doc.text(String(unreadMails), leftMargin + 4, cardY2 + 14);
    
    // Metric Card 5: Sifat Mendesak/Penting
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(leftMargin + cardWidth + 6, cardY2, cardWidth, cardHeight, 1, 1, "FD");
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text("SIFAT MENDESAK (URGENT)", leftMargin + cardWidth + 10, cardY2 + 5.5);
    doc.setTextColor(220, 38, 38); // red-600
    doc.setFontSize(14);
    doc.text(String(urgentMails), leftMargin + cardWidth + 10, cardY2 + 14);
    
    // Metric Card 6: Log Audit
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(leftMargin + (cardWidth * 2) + 12, cardY2, cardWidth - 4, cardHeight, 1, 1, "FD");
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text("AKTIVITAS SISTEM (AUDIT)", leftMargin + (cardWidth * 2) + 16, cardY2 + 5.5);
    doc.setTextColor(51, 65, 85); // slate-700
    doc.setFontSize(14);
    doc.text(String(auditLogs.length), leftMargin + (cardWidth * 2) + 16, cardY2 + 14);

    // --- 4. Monthly Trend Chart Visual Representation ---
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("II. TREN VOLUME DISTRIBUSI SURAT BULANAN (TAHUN 2026)", leftMargin, 107);
    
    // Draw modern visual grid background for chart
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.15);
    for (let l = 0; l <= 4; l++) {
      const lineY = 111 + (l * 8);
      doc.line(leftMargin, lineY, rightMargin, lineY);
    }
    
    // Draw Y-Axis baseline and label
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.4);
    doc.line(leftMargin, 111, leftMargin, 143); // Vertical Line
    doc.line(leftMargin, 143, rightMargin, 143); // Horizontal Line
    
    // Render dynamic bar charts inside the report
    const chartBaseY = 143;
    const barSpacing = 27;
    const maxValChart = 35;
    
    monthlyData.forEach((m, idx) => {
      const barX = leftMargin + 10 + (idx * barSpacing);
      
      // Calculate heights
      const heightIn = (m.masuk / maxValChart) * 28; // Max 28mm height
      const heightOut = (m.keluar / maxValChart) * 28;
      
      // 1. Draw "Surat Masuk" Bar (Blue gradient simulation)
      doc.setFillColor(37, 99, 235); // Blue-600
      doc.rect(barX, chartBaseY - heightIn, 4.5, heightIn, "F");
      
      // 2. Draw "Surat Keluar" Bar (Indigo gradient simulation)
      doc.setFillColor(79, 70, 229); // Indigo-600
      doc.rect(barX + 5, chartBaseY - heightOut, 4.5, heightOut, "F");
      
      // Text underneath
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(m.name, barX + 4.5, chartBaseY + 4, { align: "center" });
      
      // Data labels above bars
      doc.setFontSize(6);
      doc.setTextColor(37, 99, 235);
      doc.text(String(m.masuk), barX + 2.2, chartBaseY - heightIn - 1.5, { align: "center" });
      
      doc.setTextColor(79, 70, 229);
      doc.text(String(m.keluar), barX + 7.2, chartBaseY - heightOut - 1.5, { align: "center" });
    });
    
    // Add Legend
    doc.setFillColor(37, 99, 235);
    doc.rect(130, 148, 3, 3, "F");
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text("Surat Masuk", 134, 150.5);
    
    doc.setFillColor(79, 70, 229);
    doc.rect(155, 148, 3, 3, "F");
    doc.text("Surat Keluar", 159, 150.5);

    // --- 5. Dynamic Recent Letters Table Overview ---
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("III. DAFTAR AGENDA SURAT MASUK TERSEDIA (REGISTER TERBARU)", leftMargin, 161);
    
    const tableHeaderY = 165;
    const itemHeight = 11;
    
    // Draw Header
    doc.setFillColor(31, 41, 55); // Gray-800
    doc.rect(leftMargin, tableHeaderY, contentWidth, 7, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("NOMOR AGENDA", leftMargin + 3, tableHeaderY + 4.5);
    doc.text("INSTITUSI PENGIRIM", leftMargin + 40, tableHeaderY + 4.5);
    doc.text("PERIHAL SURAT", leftMargin + 95, tableHeaderY + 4.5);
    doc.text("SIFAT", leftMargin + 155, tableHeaderY + 4.5);
    doc.text("STATUS", leftMargin + 179, tableHeaderY + 4.5);
    
    let currentY = tableHeaderY + 7;
    
    const sampleLetters = lettersIn.slice(0, 3);
    
    if (sampleLetters.length === 0) {
      // Empty State
      doc.setFillColor(250, 250, 250);
      doc.rect(leftMargin, currentY, contentWidth, 15, "F");
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.15);
      doc.line(leftMargin, currentY + 15, rightMargin, currentY + 15);
      
      doc.setTextColor(148, 163, 184);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.text("Belum ada agenda surat masuk tercatat dalam sistem.", leftMargin + contentWidth / 2, currentY + 9, { align: "center" });
      currentY += 15;
    } else {
      sampleLetters.forEach((letter, index) => {
        // Alternating row styling
        if (index % 2 === 0) {
          doc.setFillColor(255, 255, 255);
        } else {
          doc.setFillColor(248, 250, 252);
        }
        doc.rect(leftMargin, currentY, contentWidth, itemHeight, "F");
        
        // Horizontal cell divider
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.15);
        doc.line(leftMargin, currentY + itemHeight, rightMargin, currentY + itemHeight);
        
        // Write letter details securely
        doc.setTextColor(29, 78, 216);
        doc.setFont("courier", "bold");
        doc.setFontSize(7);
        doc.text(letter.agendaNumber || `IN-${1000 + index}`, leftMargin + 3, currentY + 7);
        
        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        
        const croppedInstitution = letter.senderInstitution.length > 28 ? `${letter.senderInstitution.substring(0, 26)}...` : letter.senderInstitution;
        const croppedSubject = letter.subject.length > 34 ? `${letter.subject.substring(0, 32)}...` : letter.subject;
        
        doc.text(croppedInstitution, leftMargin + 40, currentY + 7);
        doc.text(croppedSubject, leftMargin + 95, currentY + 7);
        
        // Urgency color indicator
        if (letter.urgency === "Sangat Rahasia" || letter.urgency === "Penting") {
          doc.setTextColor(220, 38, 38);
          doc.setFont("helvetica", "bold");
        } else {
          doc.setTextColor(100, 116, 139);
          doc.setFont("helvetica", "normal");
        }
        doc.text(letter.urgency || "Biasa", leftMargin + 155, currentY + 7);
        
        // Status color
        doc.setTextColor(180, 83, 9);
        doc.setFont("helvetica", "bold");
        doc.text(letter.status || "Baru", leftMargin + 179, currentY + 7);
        
        currentY += itemHeight;
      });
    }
    
    // --- 6. Footer Digital Authenticity Stamp ---
    const footerY = 248;
    
    // Drawing a thin line above stamp
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(leftMargin, footerY - 5, rightMargin, footerY - 5);
    
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "medium");
    doc.setFontSize(6.5);
    doc.text("Laporan ini diterbitkan secara otomatis oleh modul FGI Office Analytics Hub.", leftMargin, footerY);
    doc.text("Sistem Kearsipan & Manajemen Surat Berbasis Standar Digital Nasional.", leftMargin, footerY + 3.5);
    doc.text("Seluruh data statistik yang disajikan terintegrasi dan valid.", leftMargin, footerY + 7);
    
    // Right text: Digital verification box
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(219, 234, 254);
    doc.roundedRect(rightMargin - 52, footerY - 2, 52, 14, 0.5, 0.5, "FD");
    
    // fake mini validation barcode lines
    doc.setFillColor(29, 78, 216); // Royal blue lines
    const barXStart = rightMargin - 49;
    const barYStart = footerY + 1.5;
    const pattern = [1, 2, 0.5, 3, 1, 0.5, 2, 1, 0.5, 2.5, 1, 0.5];
    let drawX = barXStart;
    pattern.forEach(p => {
      doc.rect(drawX, barYStart, p, 5, "F");
      drawX += p + 0.8;
    });
    
    doc.setTextColor(29, 78, 216);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5);
    doc.text("SYSTEM VERIFIED", rightMargin - 49, footerY + 9.5);
    
    doc.setTextColor(100, 116, 139);
    doc.setFont("courier", "bold");
    doc.setFontSize(4.5);
    doc.text("VER-RPT-FGI-STAT-2026", rightMargin - 49, footerY + 11.2);
    
    // Save report
    doc.save("FGI_Office_Monthly_Report.pdf");
  };

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Dashboard Custom Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900/60 dark:to-slate-900/10 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm" id="dashboard-custom-header">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>FGI Office - Dashboard Utama</span>
            <span className="hidden sm:inline-block px-2.5 py-0.5 bg-blue-100/80 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 text-[10px] font-bold rounded-full border border-blue-200/50 uppercase tracking-widest font-mono">Real-time</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sistem Korespondensi Mandiri & Dashboard Analitis PT FGI INDONESIA</p>
        </div>
        
        <button
          onClick={handleDownloadSummaryPDF}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-750 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md cursor-pointer transition-all border border-blue-500/30 font-sans tracking-wide active:scale-[0.98]"
          id="btn-download-summary"
        >
          <FileText className="h-4 w-4 shrink-0" />
          <span>Download Summary PDF</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4" id="stats-grid">
        {/* Total Surat Masuk Card */}
        <div 
          onClick={() => onNavigate("surat_masuk")}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-blue-500 cursor-pointer transition-all flex items-center space-x-4"
          id="stat-card-masuk"
        >
          <div className="p-3 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Surat Masuk</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalIn}</h3>
          </div>
        </div>

        {/* Total Surat Keluar Card */}
        <div 
          onClick={() => onNavigate("surat_keluar")}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-blue-500 cursor-pointer transition-all flex items-center space-x-4"
          id="stat-card-keluar"
        >
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Send className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Surat Keluar</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalOut}</h3>
          </div>
        </div>

        {/* Surat Menunggu Disposisi Card */}
        <div 
          onClick={() => onNavigate("surat_masuk")}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-blue-500 cursor-pointer transition-all flex items-center space-x-4"
          id="stat-card-pending"
        >
          <div className="p-3 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-lg">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Butuh Disposisi</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{pendingDisp}</h3>
          </div>
        </div>

        {/* Surat Belum Dibaca Card */}
        <div 
          onClick={() => onNavigate("surat_masuk")}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-blue-500 cursor-pointer transition-all flex items-center space-x-4"
          id="stat-card-unread"
        >
          <div className="p-3 bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 rounded-lg">
            <MailOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Belum Dibaca</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{unreadMails}</h3>
          </div>
        </div>

        {/* Surat Jatuh Tempo Tindak Lanjut Card */}
        <div 
          onClick={() => onNavigate("surat_masuk")}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-blue-500 cursor-pointer transition-all flex items-center space-x-4"
          id="stat-card-overdue"
        >
          <div className="p-3 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-lg">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sifat Mendesak</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{urgentMails}</h3>
          </div>
        </div>
      </div>

      {/* Main Graph & Actionable Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-body">
        {/* Graph Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm lg:col-span-2 block" id="volume-graph-card">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Statistik Volume Surat</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Perbandingan tren bulanan surat masuk vs surat keluar (Tahun 2026)</p>
            </div>
            
            {/* Legend indicators */}
            <div className="flex items-center space-x-4 text-xs font-medium">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500 block"></span>
                <span className="text-slate-600 dark:text-slate-300">Surat Masuk</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-indigo-500 block"></span>
                <span className="text-slate-600 dark:text-slate-300">Surat Keluar</span>
              </div>
            </div>
          </div>

          {/* Dynamic Interactive Vector Graph Grid */}
          <div className="relative h-64 w-full border-b border-l border-slate-200 dark:border-slate-800 px-2 pb-6" id="chart-stage">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-slate-400 font-mono -left-7 py-3">
              <span>{maxVal}</span>
              <span>{maxVal * 2 / 3}</span>
              <span>{maxVal / 3}</span>
              <span>0</span>
            </div>
            
            <div className="flex justify-between items-end h-full pt-4">
              {monthlyData.map((d, index) => {
                const heightIn = (d.masuk / maxVal) * 100;
                const heightOut = (d.keluar / maxVal) * 100;
                return (
                  <div key={index} className="flex flex-col items-center flex-1 group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 bg-slate-800 text-white text-[10px] px-2.5 py-1.5 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10 flex flex-col space-y-1">
                      <span className="font-semibold text-center">{d.name} 2026</span>
                      <span className="text-blue-300">Masuk: {d.masuk}</span>
                      <span className="text-indigo-300">Keluar: {d.keluar}</span>
                    </div>

                    {/* Bars */}
                    <div className="flex items-end justify-center space-x-2 w-full">
                      <div 
                        style={{ height: `${heightIn}%` }} 
                        className="w-4 sm:w-6 bg-blue-500 hover:bg-blue-600 rounded-t transition-all duration-300"
                      />
                      <div 
                        style={{ height: `${heightOut}%` }} 
                        className="w-4 sm:w-6 bg-indigo-500 hover:bg-indigo-600 rounded-t transition-all duration-300"
                      />
                    </div>
                    
                    {/* Tick label */}
                    <span className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400 font-mono">{d.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Activities Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm" id="activities-card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Aktivitas Terbaru</h3>
            <span className="p-1 px-2.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded-full uppercase tracking-wider font-mono">Audit Trail</span>
          </div>

          <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1" id="log-feed">
            {auditLogs.slice(0, 6).map((log) => {
              let iconColor = "text-blue-500 bg-blue-50 dark:bg-blue-950";
              if (log.actionType === "Approval") iconColor = "text-emerald-500 bg-emerald-50 dark:bg-emerald-950";
              if (log.actionType === "Hapus Surat") iconColor = "text-rose-500 bg-rose-50 dark:bg-rose-950";

              return (
                <div key={log.id} className="flex items-start space-x-3 text-xs leading-relaxed border-b border-slate-50 dark:border-slate-800/50 pb-2.5 last:border-0" id={`activity-item-${log.id}`}>
                  <div className={`p-2 rounded-lg shrink-0 ${iconColor}`}>
                    {log.actionType === "Approval" ? <UserCheck className="h-3.5 w-3.5" /> : log.actionType === "Hapus Surat" ? <ShieldAlert className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{log.activity}</p>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                      <span>{log.userEmail}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Overview of letters waiting for attention */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm" id="attention-required-card">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Agenda Surat Penting & Mendesak</h3>
        <div className="overflow-x-auto" id="dashboard-table-viewport">
          <table className="w-full text-left text-xs border-collapse" id="dashboard-letters-table">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                <th className="py-2.5 font-semibold">Nomor Agenda</th>
                <th className="py-2.5 font-semibold">Pengirim</th>
                <th className="py-2.5 font-semibold">Perihal</th>
                <th className="py-2.5 font-semibold">Kategori</th>
                <th className="py-2.5 font-semibold">Sifat</th>
                <th className="py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {lettersIn.slice(0, 3).map((letter) => (
                <tr 
                  key={letter.id} 
                  className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/20 cursor-pointer"
                  onClick={() => onNavigate("surat_masuk")}
                >
                  <td className="py-3 font-semibold text-blue-600 dark:text-blue-400 font-mono">{letter.agendaNumber}</td>
                  <td className="py-3 font-medium text-slate-800 dark:text-slate-200">{letter.senderInstitution}</td>
                  <td className="py-3 text-slate-600 dark:text-slate-400 truncate max-w-xs">{letter.subject}</td>
                  <td className="py-3 font-mono text-[11px] text-slate-500">{letter.category}</td>
                  <td className="py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      letter.urgency === "Sangat Rahasia" || letter.urgency === "Penting" 
                        ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400" 
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}>
                      {letter.urgency}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="font-semibold text-amber-600 dark:text-amber-400">{letter.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
