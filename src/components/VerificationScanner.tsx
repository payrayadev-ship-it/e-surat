import React, { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { jsPDF } from "jspdf";
import { 
  QrCode, 
  ShieldCheck, 
  ShieldAlert, 
  Upload, 
  Check, 
  Camera, 
  FileText, 
  Search, 
  ArrowRight, 
  Download, 
  Clock, 
  Sparkles, 
  X,
  AlertCircle,
  ExternalLink,
  Copy,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { LetterOut, LetterIn, CompanySetting } from "../types";
import { generateVerificationQR, getDocumentValidityStatus } from "../utils";

interface VerificationScannerProps {
  lettersOut: LetterOut[];
  lettersIn: LetterIn[];
  companySetting: CompanySetting;
  onNavigate: (tab: string) => void;
  initialVerifyCode?: string | null;
}

export default function VerificationScanner({ 
  lettersOut, 
  lettersIn, 
  companySetting, 
  onNavigate,
  initialVerifyCode
}: VerificationScannerProps) {
  const [activeScanMethod, setActiveScanMethod] = useState<"camera" | "upload" | "manual">("camera");
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  
  // Scanned Document resolution states
  const [resolvedDoc, setResolvedDoc] = useState<LetterOut | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<"VERIFIED" | "INVALID" | null>(null);
  const [verificationTime, setVerificationTime] = useState<string>("");

  // Camera scanner states
  const [scannerActive, setScannerActive] = useState<boolean>(false);
  const [cameras, setCameras] = useState<any[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string>("");
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const qrCodeInstance = useRef<Html5Qrcode | null>(null);

  // Manual code input
  const [manualCode, setManualCode] = useState<string>("");

  // Initialize camera list on mount or when camera scan method is activated
  useEffect(() => {
    if (activeScanMethod === "camera") {
      Html5Qrcode.getCameras()
        .then((devices) => {
          setCameras(devices);
          if (devices.length > 0) {
            setCameraPermission(true);
            setActiveCameraId(devices[0].id);
          }
        })
        .catch((err) => {
          console.warn("Error listing cameras:", err);
          setCameraPermission(false);
        });
    } else {
      stopCameraScanner();
    }

    return () => {
      stopCameraScanner();
    };
  }, [activeScanMethod]);

  useEffect(() => {
    if (initialVerifyCode) {
      processVerificationCode(initialVerifyCode);
    }
  }, [initialVerifyCode]);

  const startCameraScanner = async (cameraId: string) => {
    try {
      await stopCameraScanner(); // Stop existing if any
      
      const html5QrCode = new Html5Qrcode("camera-reader-viewport");
      qrCodeInstance.current = html5QrCode;
      setScannerActive(true);

      await html5QrCode.start(
        cameraId,
        {
          fps: 15,
          qrbox: (width, height) => {
            const minSize = Math.min(width, height);
            const boxSize = Math.floor(minSize * 0.7);
            return { width: boxSize, height: boxSize };
          },
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Silent verbose scanner tracking
        }
      );
    } catch (err) {
      console.error("Gagal menyalakan kamera scanner:", err);
      alert("Gagal mengakses kamera. Pastikan izin kamera diizinkan.");
      setScannerActive(false);
    }
  };

  const stopCameraScanner = async () => {
    if (qrCodeInstance.current && qrCodeInstance.current.isScanning) {
      try {
        await qrCodeInstance.current.stop();
        qrCodeInstance.current = null;
        setScannerActive(false);
      } catch (err) {
        console.error("Gagal mematikan kamera scanner:", err);
      }
    }
  };

  const changeCamera = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const camId = e.target.value;
    setActiveCameraId(camId);
    if (scannerActive) {
      startCameraScanner(camId);
    }
  };

  // Main code verification processor
  const processVerificationCode = (inputString: string) => {
    setScannedResult(inputString);
    setVerificationTime(new Date().toLocaleString("id-ID") + " WIB");

    // Clean code extraction
    let cleanCode = inputString.trim();

    // If payload contains multiline or formatted SERTIFIKAT SAH data, extract verification code if present
    if (cleanCode.includes("Kode:")) {
      const codeMatch = cleanCode.match(/Kode:\s*([^\s\n]+)/);
      if (codeMatch && codeMatch[1]) {
        cleanCode = codeMatch[1].trim();
      }
    }

    // 1. Detect if it's a verification URL (?verify=DOC-XXXX-YYY)
    if (cleanCode.includes("?verify=")) {
      const parts = cleanCode.split("?verify=");
      if (parts.length > 1) {
        cleanCode = parts[1].split("&")[0];
      }
    } 
    // 2. Detect if it's a pipe-separated payload (FORSDIG-DOC|id:xxx|vcode:yyy)
    else if (cleanCode.includes("|vcode:")) {
      const match = cleanCode.match(/\|vcode:([^|]+)/);
      if (match && match[1]) {
        cleanCode = match[1];
      }
    }
    // 3. Strip any "TTE-" prefix if present in signature text
    else if (cleanCode.startsWith("TTE-")) {
      cleanCode = cleanCode.replace("TTE-", "DOC-");
    }

    // Try finding in letters out
    const matchOut = lettersOut.find(
      (l) => l.verificationCode === cleanCode || l.verificationCode.endsWith(cleanCode) || cleanCode.includes(l.verificationCode)
    );

    if (matchOut) {
      setResolvedDoc(matchOut);
      setVerificationStatus("VERIFIED");
      stopCameraScanner();
    } else {
      // Check if matches letters in
      const matchIn = lettersIn.find(
        (l) => l.letterNumber === cleanCode || l.agendaNumber === cleanCode || l.id === cleanCode
      );

      if (matchIn) {
        // Adapt LetterIn structure to match Report Preview layout
        setResolvedDoc({
          id: matchIn.id,
          letterNumber: matchIn.letterNumber,
          letterDate: matchIn.letterDate,
          recipient: companySetting.companyName,
          recipientInstitution: companySetting.companyName,
          subject: matchIn.subject,
          content: `Dokumen masuk terverifikasi. Pengirim: ${matchIn.sender} [${matchIn.senderInstitution}]. Klasifikasi: ${matchIn.category}.`,
          status: "Terkirim",
          signatureEnabled: true,
          signatureType: "QR",
          verificationCode: matchIn.letterNumber || matchIn.agendaNumber || matchIn.id,
          signatory: matchIn.sender,
          draftBy: "Kolektor Arsip",
          createdAt: matchIn.createdAt
        });
        setVerificationStatus("VERIFIED");
        stopCameraScanner();
      } else {
        setResolvedDoc(null);
        setVerificationStatus("INVALID");
      }
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    // Play subtle audio click feedback if supported
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.connect(gain);
      gain.connect(context.destination);
      osc.frequency.setValueAtTime(880, context.currentTime); // high note click
      gain.gain.setValueAtTime(0.1, context.currentTime);
      osc.start();
      osc.stop(context.currentTime + 0.08);
    } catch {}

    processVerificationCode(decodedText);
  };

  // Image Upload Scanner
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode("camera-reader-viewport-temp");
      const decodedText = await html5QrCode.scanFile(file, true);
      handleScanSuccess(decodedText);
    } catch (err) {
      console.warn("QR code not decoded from image, trying filename matching", err);
      // Fallback: search for verification code pattern inside file name
      const vcodeMatch = file.name.match(/(DOC-\d{8}-\d{3})|(TTE-\d+)/i);
      if (vcodeMatch) {
        handleScanSuccess(vcodeMatch[0]);
      } else {
        alert("Gagal mendeteksi QR Code dari gambar berkas. Silakan coba pastikan gambar QR Code terang & jelas, atau ketik Kode Verifikasi secara manual.");
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    processVerificationCode(manualCode);
  };

  const handleResetVerification = () => {
    setScannedResult(null);
    setResolvedDoc(null);
    setVerificationStatus(null);
    setVerificationTime("");
    setManualCode("");
    if (activeScanMethod === "camera" && activeCameraId) {
      startCameraScanner(activeCameraId);
    }
  };

  const handleDownloadCertificatePDF = (docItem: LetterOut) => {
    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      
      // Outer emerald border
      pdf.setDrawColor(16, 185, 129);
      pdf.setLineWidth(1.5);
      pdf.rect(10, 10, 190, 277);
      
      pdf.setDrawColor(30, 41, 142);
      pdf.setLineWidth(0.5);
      pdf.rect(13, 13, 184, 271);

      // Header / Logo
      pdf.setTextColor(30, 41, 142);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text((companySetting?.companyName || "PT FORESYNDO GLOBAL INDONESIA").toUpperCase(), 105, 28, { align: "center" });

      pdf.setFontSize(8.5);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 116, 139);
      pdf.text(companySetting?.companyAddress || "Gedung Cyber, Jl. M.H. Thamrin No. 12, Jakarta Selatan", 105, 34, { align: "center" });

      // Line
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.5);
      pdf.line(25, 40, 185, 40);

      // Badge
      pdf.setFillColor(240, 253, 244);
      pdf.setDrawColor(16, 185, 129);
      pdf.roundedRect(30, 46, 150, 18, 3, 3, "FD");

      pdf.setTextColor(5, 150, 105);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.text("SERTIFIKAT KEABSAHAN DOKUMEN ELEKTRONIK", 105, 55, { align: "center" });
      pdf.setFontSize(8.5);
      pdf.text("DOKUMEN TERVERIFIKASI SAH & RESMI", 105, 60, { align: "center" });

      // Judul Sertifikat
      pdf.setTextColor(15, 23, 42);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text(`JUDUL SERTIFIKAT: ${docItem.subject.toUpperCase()}`, 105, 76, { align: "center" });

      // Table
      pdf.setFontSize(9.5);
      let y = 92;
      const addRow = (label: string, val: string) => {
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(71, 85, 105);
        pdf.text(label, 30, y);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(15, 23, 42);
        pdf.text(`: ${val}`, 82, y);
        y += 8;
      };

      // Validity calculation
      const valInfo = getDocumentValidityStatus(docItem.letterDate, docItem.validUntil);

      addRow("Kode Verifikasi TTE", docItem.verificationCode || "-");
      addRow("Nomor Surat / Berkas", docItem.letterNumber || "-");
      addRow("Tanggal Diterbitkan", docItem.letterDate || "-");
      addRow("Masa Berlaku Dokumen", valInfo.validUntilFormatted);
      addRow("Status Masa Berlaku", valInfo.isValid ? "DOKUMEN MASIH AKTIF / BERLAKU" : "KEDALUWARSA / EXPIRED");
      addRow("Penerima Dokumen", `${docItem.recipient || "-"} (${docItem.recipientInstitution || "-"})`);
      addRow("Penandatangan Sah", docItem.signatory || "-");
      addRow("Status Keabsahan TTE", "DOKUMEN TERVERIFIKASI SAH");
      addRow("Waktu Pengecekan", verificationTime || new Date().toLocaleString("id-ID"));

      // Direct Link Text
      y += 6;
      pdf.setFillColor(248, 250, 252);
      pdf.setDrawColor(203, 213, 225);
      pdf.roundedRect(28, y, 154, 20, 2, 2, "FD");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(30, 41, 142);
      pdf.text("TAUTAN SERTIFIKAT RESMI:", 34, y + 6);

      pdf.setFont("courier", "bold");
      pdf.setFontSize(7.5);
      pdf.setTextColor(37, 99, 235);
      const linkText = `${window.location.origin}${window.location.pathname}?verify=${encodeURIComponent(docItem.verificationCode)}`;
      pdf.text(linkText, 34, y + 13);

      // Footer Notes
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text("Sertifikat ini diterbitkan secara otomatis oleh Sistem e-Office PT Foresyndo Global Indonesia", 105, 260, { align: "center" });
      pdf.text("sebagai bukti keabsahan dokumen elektronik berisikan TTE resmi tanpa perlu login ke dalam aplikasi.", 105, 265, { align: "center" });

      pdf.save(`Sertifikat_Sah_${docItem.verificationCode}.pdf`);
    } catch (err) {
      console.error("Gagal membuat PDF Sertifikat:", err);
      alert("Gagal mengunduh file sertifikat.");
    }
  };

  return (
    <div className="space-y-6" id="verification-scanner-panel">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900/60 dark:to-slate-900/10 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <QrCode className="h-5.5 w-5.5 text-blue-600 animate-pulse" />
            <span>Verifikator & Pemindai TTE</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Utilitas resmi pemindai QR Code dan Barcode sertifikat tanda tangan elektronik (TTE) PT Foresyndo Global Indonesia.
          </p>
        </div>
        <button
          onClick={() => onNavigate("surat_keluar")}
          className="text-xs font-semibold bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-250 dark:border-slate-800 px-3.5 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer"
        >
          <span>Daftar Surat Keluar</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Scanner Interface */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex border-b border-slate-100 dark:border-slate-800/80 pb-1">
            <button
              onClick={() => setActiveScanMethod("camera")}
              className={`flex-1 pb-2.5 text-xs font-bold transition-all border-b-2 text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                activeScanMethod === "camera"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <Camera className="h-3.5 w-3.5" />
              <span>Kamera Web</span>
            </button>
            <button
              onClick={() => setActiveScanMethod("upload")}
              className={`flex-1 pb-2.5 text-xs font-bold transition-all border-b-2 text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                activeScanMethod === "upload"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Unggah Gambar</span>
            </button>
            <button
              onClick={() => setActiveScanMethod("manual")}
              className={`flex-1 pb-2.5 text-xs font-bold transition-all border-b-2 text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                activeScanMethod === "manual"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <Search className="h-3.5 w-3.5" />
              <span>Input Manual</span>
            </button>
          </div>

          {/* Scanner Viewport displays based on method */}
          {activeScanMethod === "camera" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {cameras.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pilih Perangkat Kamera</label>
                  <select
                    value={activeCameraId}
                    onChange={changeCamera}
                    className="p-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300"
                  >
                    {cameras.map((cam) => (
                      <option key={cam.id} value={cam.id}>
                        {cam.label || `Kamera ${cameras.indexOf(cam) + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {/* Viewport for live video scanner */}
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
                <div id="camera-reader-viewport" className="absolute inset-0 w-full h-full object-cover [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />
                
                {/* Temp anchor div required for html5-qrcode file scans */}
                <div id="camera-reader-viewport-temp" className="hidden" />

                {!scannerActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-950/80 space-y-3 z-10">
                    <Camera className="h-10 w-10 text-slate-500 animate-pulse" />
                    <div>
                      <p className="font-bold text-slate-200 text-sm">Kamera Siap Diaktifkan</p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-[220px]">
                        Arahkan lensa kamera perangkat Anda ke QR Code atau Barcode yang tertera di sertifikat atau dokumen dinas FGI.
                      </p>
                    </div>
                    {cameraPermission !== false ? (
                      <button
                        onClick={() => {
                          if (activeCameraId) startCameraScanner(activeCameraId);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-lg cursor-pointer transition-all shadow-md active:scale-95"
                      >
                        Nyalakan Kamera Web
                      </button>
                    ) : (
                      <div className="text-xs text-rose-500 font-semibold bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                        Izin kamera ditolak. Silakan berikan izin kamera di pengaturan browser Anda.
                      </div>
                    )}
                  </div>
                )}

                {scannerActive && (
                  <>
                    {/* Laser scanning indicator bar */}
                    <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none z-10 flex flex-col justify-center items-center">
                      <div className="w-[85%] h-0.5 bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-bounce duration-2000" />
                    </div>

                    {/* Scanner border corners decoration overlay */}
                    <div className="absolute inset-0 pointer-events-none border-[12px] border-slate-950/20 flex items-center justify-center z-10">
                      <div className="w-[65%] h-[65%] border-2 border-dashed border-blue-400/80 rounded relative flex items-center justify-center">
                        <span className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-blue-500 rounded-tl" />
                        <span className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-blue-500 rounded-tr" />
                        <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-blue-500 rounded-bl" />
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-blue-500 rounded-br" />
                      </div>
                    </div>

                    {/* Interactive Stop Button */}
                    <button
                      onClick={stopCameraScanner}
                      className="absolute bottom-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] uppercase tracking-wider py-1.5 px-3 rounded-lg cursor-pointer transition-all shadow-md z-20 flex items-center gap-1"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Matikan Kamera</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {activeScanMethod === "upload" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div id="camera-reader-viewport-temp" className="hidden" />
              
              <div className="border-2 border-dashed border-slate-250 dark:border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-950/30 hover:bg-slate-50 transition-colors relative">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                />
                <Upload className="h-8 w-8 text-blue-500 mb-3" />
                <p className="font-bold text-xs text-slate-800 dark:text-slate-200">Pilih Berkas Gambar Sertifikat</p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">
                  Unggah gambar tangkapan layar, foto cetak, atau lampiran PNG/JPG yang berisi QR Code atau Barcode.
                </p>
                <button className="mt-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors pointer-events-none">
                  Pilih Gambar Berkas
                </button>
              </div>
            </div>
          )}

          {activeScanMethod === "manual" && (
            <form onSubmit={handleManualSubmit} className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Kode Verifikasi TTE</label>
                <input
                  type="text"
                  placeholder="e.g. DOC-20260615-001"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-xs font-mono text-slate-800 dark:text-slate-200"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-lg cursor-pointer transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <Search className="h-4 w-4" />
                <span>Verifikasi Kode</span>
              </button>
            </form>
          )}

          {/* Rapid demo shortcuts section */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span>Demo Cepat (Sertifikat Berkas Tersedia)</span>
            </h5>
            <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1 text-[11px]" id="demo-verify-links">
              {lettersOut.length === 0 ? (
                <p className="text-slate-400 text-xs italic">Belum ada surat keluar terdaftar.</p>
              ) : (
                lettersOut.map((l) => {
                  const val = getDocumentValidityStatus(l.letterDate, l.validUntil);
                  return (
                    <button
                      key={l.id}
                      onClick={() => processVerificationCode(l.verificationCode)}
                      className="w-full text-left p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 rounded border border-slate-150 dark:border-slate-800/60 font-medium text-slate-650 dark:text-slate-400 flex items-center justify-between transition-colors group cursor-pointer"
                    >
                      <div className="truncate flex-1 pr-2">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{l.subject}</p>
                          <span className={`text-[8px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                            val.isValid 
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" 
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          }`}>
                            {val.isValid ? "AKTIF" : "KEDALUWARSA"}
                          </span>
                        </div>
                        <span className="font-mono text-[9px] text-slate-400 block mt-0.5">{l.verificationCode}</span>
                      </div>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 shrink-0 font-bold">
                        <span>Uji</span>
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right column: Verification Result Card */}
        <div className="lg:col-span-7 flex flex-col justify-start">
          {verificationStatus === null ? (
            <div className="h-full min-h-[350px] border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-slate-50/20 dark:bg-slate-950/5 relative">
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm mb-4">
                <QrCode className="h-10 w-10 text-slate-400 animate-bounce duration-3000" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Menunggu Scan atau Masukan Kode</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
                Silakan nyalakan kamera untuk memindai Barcode QR pada sertifikat, unggah gambar draf, atau gunakan pintasan demo cepat di sebelah kiri untuk menguji autentisitas berkas tanda tangan dinas.
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {verificationStatus === "VERIFIED" && resolvedDoc ? (
                /* Gorgeous Verified Certificate */
                <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-md">
                  {/* Glowing header banner */}
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-650 p-4 text-white flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-1.5 bg-white/20 rounded-lg">
                        <ShieldCheck className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm tracking-wide">TTE VERIFIED (ASLI)</h4>
                        <p className="text-[10px] text-emerald-100 font-medium">Sertifikat Digital Sah PT Foresyndo Global Indonesia</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-white text-emerald-800 font-bold p-1 px-2.5 rounded-full uppercase tracking-wider font-mono">
                      ✓ INTEGRITY SECURE
                    </span>
                  </div>

                  {/* Document and Signature details */}
                  <div className="p-6 space-y-6 relative">
                    {/* Watermark Logo background */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
                      <div className="text-[120px] font-black tracking-widest font-mono">FGI</div>
                    </div>

                    {/* Dedicated Link Sertifikat Sah Card (Matches Judul Sertifikat) */}
                    <div className="bg-emerald-50/90 dark:bg-emerald-950/40 border-2 border-emerald-500/50 rounded-2xl p-4.5 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span>TAUTAN / LINK SERTIFIKAT SAH</span>
                        </span>
                        <span className="text-[10px] font-mono bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                          DOKUMEN TERVERIFIKASI
                        </span>
                      </div>

                      <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/80 p-3.5 rounded-xl space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                          Judul Sertifikat Sah
                        </span>
                        <a 
                          href={`${window.location.origin}${window.location.pathname}?verify=${encodeURIComponent(resolvedDoc.verificationCode)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm md:text-base font-extrabold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 leading-snug group"
                        >
                          <span className="break-words">Sertifikat Sah: {resolvedDoc.subject}</span>
                          <ExternalLink className="h-4 w-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                        </a>
                        <p className="text-[10px] font-mono text-slate-400 truncate pt-1 border-t border-slate-100 dark:border-slate-800">
                          URL Direct: {window.location.origin}{window.location.pathname}?verify={resolvedDoc.verificationCode}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          onClick={() => handleDownloadCertificatePDF(resolvedDoc)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer transition-all shadow-sm flex items-center gap-2 active:scale-95"
                        >
                          <Download className="h-4 w-4" />
                          <span>Unduh Sertifikat PDF: {resolvedDoc.subject}</span>
                        </button>

                        <button
                          onClick={() => {
                            const link = `${window.location.origin}${window.location.pathname}?verify=${encodeURIComponent(resolvedDoc.verificationCode)}`;
                            navigator.clipboard.writeText(link);
                            alert(`Tautan sertifikat "${resolvedDoc.subject}" berhasil disalin!`);
                          }}
                          className="bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-250 dark:border-slate-800 font-semibold text-xs py-2 px-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Copy className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Salin Link Sertifikat</span>
                        </button>
                      </div>
                    </div>

                    {/* Dedicated Validasi Masa Berlaku Dokumen Card */}
                    {(() => {
                      const valInfo = getDocumentValidityStatus(resolvedDoc.letterDate, resolvedDoc.validUntil);
                      
                      // Calculate retention progress bar percentage
                      let progressPercent = 0;
                      if (valInfo.isPermanent) {
                        progressPercent = 100;
                      } else if (resolvedDoc.letterDate && resolvedDoc.validUntil) {
                        const start = new Date(resolvedDoc.letterDate).getTime();
                        const end = new Date(resolvedDoc.validUntil).getTime();
                        const now = new Date().getTime();
                        if (end > start) {
                          const total = end - start;
                          const elapsed = now - start;
                          progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
                        }
                      }

                      return (
                        <div className={`p-4.5 rounded-2xl border-2 space-y-3 shadow-sm transition-all ${
                          valInfo.isValid 
                            ? "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500/50" 
                            : "bg-rose-50/90 dark:bg-rose-950/40 border-rose-500/60"
                        }`}>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className={`text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                              valInfo.isValid ? "text-emerald-800 dark:text-emerald-300" : "text-rose-800 dark:text-rose-300"
                            }`}>
                              <Calendar className="h-4 w-4" />
                              <span>VALIDASI MASA BERLAKU DOKUMEN</span>
                            </span>
                            <span className={`text-[10px] font-mono px-3 py-1 rounded-full font-extrabold flex items-center gap-1.5 ${
                              valInfo.isValid 
                                ? "bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200" 
                                : "bg-rose-100 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200 animate-pulse"
                            }`}>
                              {valInfo.isValid ? (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span>{valInfo.statusBadgeText}</span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                                  <span>{valInfo.statusBadgeText}</span>
                                </>
                              )}
                            </span>
                          </div>

                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl space-y-3">
                            <p className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                              {valInfo.statusDetailText}
                            </p>

                            {/* Visual Progress Bar for Retention / Validity */}
                            {!valInfo.isPermanent && (
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-500">
                                  <span>Tingkat Retensi Terpakai: {progressPercent}%</span>
                                  <span>
                                    {valInfo.isValid 
                                      ? `Sisa Retensi: ${valInfo.daysRemainingOrExpired} Hari` 
                                      : `Terlewat ${Math.abs(valInfo.daysRemainingOrExpired)} Hari`}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-700">
                                  <div 
                                    className={`h-full transition-all duration-500 rounded-full ${
                                      valInfo.isValid 
                                        ? progressPercent > 80 ? "bg-amber-500" : "bg-emerald-500" 
                                        : "bg-rose-600"
                                    }`}
                                    style={{ width: `${progressPercent}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                              <div className="space-y-0.5">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tanggal Diterbitkan</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{resolvedDoc.letterDate || "-"}</span>
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Batas Masa Berlaku</span>
                                <span className={`font-extrabold font-mono ${valInfo.isValid ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                                  {valInfo.validUntilFormatted}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm">
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-850">
                        <span className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Nomor / Kode Verifikasi</span>
                        <p className="font-mono font-extrabold text-blue-700 dark:text-blue-400 text-sm mt-1">{resolvedDoc.verificationCode}</p>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-850">
                        <span className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Tanggal Verifikasi</span>
                        <p className="font-bold text-slate-755 dark:text-slate-300 mt-1 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{verificationTime}</span>
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-3.5">
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data Penandatangan (Signatory)</h5>
                      <div className="flex items-center space-x-3 p-3 bg-blue-50/30 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 rounded-xl">
                        <div className="h-10 w-10 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                          {resolvedDoc.signatory.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h6 className="font-extrabold text-slate-900 dark:text-white text-sm">{resolvedDoc.signatory}</h6>
                          <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold font-mono uppercase tracking-wide">
                            Penandatangan Elektronik Sah FGI Hub
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-3">
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Metadata Berkas Dinas</h5>
                      
                      <div className="space-y-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-1 pb-2 border-b border-slate-200/50 dark:border-slate-800/40">
                          <span className="md:col-span-3 text-slate-400 font-semibold">Nomor Surat:</span>
                          <span className="md:col-span-9 font-bold text-slate-800 dark:text-slate-200 font-mono">{resolvedDoc.letterNumber}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-1 pb-2 border-b border-slate-200/50 dark:border-slate-800/40">
                          <span className="md:col-span-3 text-slate-400 font-semibold">Tanggal Surat:</span>
                          <span className="md:col-span-9 text-slate-800 dark:text-slate-200">{resolvedDoc.letterDate}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-1 pb-2 border-b border-slate-200/50 dark:border-slate-800/40">
                          <span className="md:col-span-3 text-slate-400 font-semibold">Penerima:</span>
                          <span className="md:col-span-9 text-slate-800 dark:text-slate-200">{resolvedDoc.recipient} ({resolvedDoc.recipientInstitution})</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-1">
                          <span className="md:col-span-3 text-slate-400 font-semibold">Perihal / Subjek:</span>
                          <span className="md:col-span-9 font-bold text-slate-905 dark:text-white">{resolvedDoc.subject}</span>
                        </div>
                      </div>
                    </div>

                    {/* Reset Button */}
                    <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <button
                        onClick={handleResetVerification}
                        className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer transition-colors"
                      >
                        Scan Berkas Baru
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Invalid Certificate Warning */
                <div className="border border-rose-200 dark:border-rose-900 bg-rose-50/10 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-gradient-to-r from-rose-600 to-rose-700 p-4 text-white flex items-center space-x-3">
                    <ShieldAlert className="h-6 w-6 shrink-0" />
                    <div>
                      <h4 className="font-extrabold text-sm tracking-wide">DOKUMEN TIDAK VALID / PALSU</h4>
                      <p className="text-[10px] text-rose-100 font-medium">Autentikasi Kriptografi FGI Gagal</p>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="flex items-start space-x-3 p-3 bg-rose-100/30 dark:bg-rose-950/25 border border-rose-200/50 dark:border-rose-900/30 rounded-xl">
                      <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="text-xs space-y-1">
                        <p className="font-bold text-rose-800 dark:text-rose-300">Peringatan Keamanan Kearsipan!</p>
                        <p className="text-slate-550 dark:text-slate-400 leading-relaxed">
                          Sertifikat digital atau kode verifikasi <span className="font-mono font-bold text-rose-700 dark:text-rose-400">"{scannedResult}"</span> tidak terdaftar dalam pangkalan data korporat PT Foresyndo Global Indonesia. Dokumen ini terindikasi mengalami manipulasi, penipuan, atau belum disahkan oleh pejabat berwenang.
                        </p>
                      </div>
                    </div>

                    <div className="text-xs space-y-2 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-150 p-4 rounded-xl">
                      <p className="font-bold text-slate-755 dark:text-slate-300">Kemungkinan Penyebab:</p>
                      <ul className="list-disc list-inside space-y-1 pl-1 text-[11px]">
                        <li>Kode verifikasi salah ketik atau memiliki spasi tambahan.</li>
                        <li>QR Code dicetak terlalu buram/gelap sehingga tidak terbaca sempurna.</li>
                        <li>Dokumen dinas merupakan berkas fiktif yang tidak diterbitkan secara resmi melalui FGI Hub.</li>
                      </ul>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 font-mono">Dideteksi pada: {verificationTime}</span>
                      <button
                        onClick={handleResetVerification}
                        className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer transition-colors"
                      >
                        Ulangi Pemindaian
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
