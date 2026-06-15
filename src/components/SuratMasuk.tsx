import React, { useState } from "react";
import { Plus, Search, FileText, Share2, CornerDownRight, Check, AlertTriangle, ArrowUpRight, UploadCloud, X, User } from "lucide-react";
import { LetterIn, UserRole, Disposition, UserProfile } from "../types";

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
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Pratinjau Agenda Detail</h3>
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
