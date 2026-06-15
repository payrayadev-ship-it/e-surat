import React, { useState } from "react";
import { Folder, Search, FileText, Download, Calendar, Filter, Archive, CheckCircle, ExternalLink, Printer } from "lucide-react";
import { LetterIn, LetterOut, Memo as MemoType } from "../types";

interface ArsipDigitalProps {
  lettersIn: LetterIn[];
  lettersOut: LetterOut[];
  memos: MemoType[];
}

const FOLDERS = [
  { id: "f_masuk", name: "Surat Masuk", category: "Legal/Keuangan/HRD", count: 0 },
  { id: "f_keluar", name: "Surat Keluar", category: "Kemitraan/Penawaran", count: 0 },
  { id: "f_kontrak", name: "Kontrak Kerja", category: "Legal", count: 3 },
  { id: "f_memo", name: "Memo Internal", category: "Operasional", count: 0 },
  { id: "f_spk", name: "SPK / Selesai", category: "Operasional", count: 1 },
  { id: "f_legal", name: "Legal & Advokat", category: "Hukum", count: 2 },
  { id: "f_keuangan", name: "Keuangan & Pajak", category: "Accounting", count: 4 },
  { id: "f_hrd", name: "HRD & Personalia", category: "Karyawan", count: 1 }
];

export default function ArsipDigital({ lettersIn, lettersOut, memos }: ArsipDigitalProps) {
  const [activeFolder, setActiveFolder] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Update real-time counts from our dynamic state database
  const getFolderCounts = (folderId: string) => {
    if (folderId === "f_masuk") return lettersIn.length;
    if (folderId === "f_keluar") return lettersOut.length;
    if (folderId === "f_memo") return memos.length;
    
    // Static fallback seed counts
    const found = FOLDERS.find(f => f.id === folderId);
    return found ? found.count : 0;
  };

  // Compile combined archive listings
  const getCompiledArchiveItems = () => {
    const list: {
      id: string;
      title: string;
      type: "Surat Masuk" | "Surat Keluar" | "Memo" | "Kontrak" | "Keuangan" | "Legal";
      number: string;
      date: string;
      partner: string; // sender or recipient
      category: string;
      status: string;
    }[] = [];

    // Map Inwards
    lettersIn.forEach(item => {
      list.push({
        id: `in-${item.id}`,
        title: item.subject,
        type: "Surat Masuk",
        number: item.letterNumber,
        date: item.letterDate,
        partner: `${item.sender} (${item.senderInstitution})`,
        category: item.category,
        status: item.status
      });
    });

    // Map Outwards
    lettersOut.forEach(item => {
      list.push({
        id: `out-${item.id}`,
        title: item.subject,
        type: "Surat Keluar",
        number: item.letterNumber,
        date: item.letterDate,
        partner: item.recipient,
        category: "Operasional",
        status: item.status
      });
    });

    // Map Memos
    memos.forEach(m => {
      list.push({
        id: `memo-${m.id}`,
        title: m.subject,
        type: "Memo",
        number: m.memoNumber,
        date: m.createdAt.split("T")[0],
        partner: `Kepada: ${m.recipientRole}`,
        category: "Operasional",
        status: m.status
      });
    });

    // Seed mock entries for Contract/Financial categories
    list.push({
      id: "seed-k-1",
      title: "SPK Renovasi Server Room Intranet Utama",
      type: "Kontrak",
      number: "SPK-01/IT/FORSDIG/2026",
      date: "2026-05-10",
      partner: "PT Jaya Konstruksi",
      category: "Legal",
      status: "Selesai"
    });
    list.push({
      id: "seed-kg-1",
      title: "SPT Pajak Tahunan Badan Usaha Kantor 2025",
      type: "Keuangan",
      number: "REG-PAJAK/TAX2025/09",
      date: "2026-04-18",
      partner: "Dirjen Pajak KPP Pratama",
      category: "Keuangan",
      status: "Selesai"
    });

    return list;
  };

  const allItems = getCompiledArchiveItems();

  const filteredItems = allItems.filter(item => {
    // Search query matches
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.partner.toLowerCase().includes(searchQuery.toLowerCase());

    // Folder matches
    let matchesFolder = true;
    if (activeFolder !== "Semua") {
      if (activeFolder === "f_masuk") matchesFolder = item.type === "Surat Masuk";
      else if (activeFolder === "f_keluar") matchesFolder = item.type === "Surat Keluar";
      else if (activeFolder === "f_memo") matchesFolder = item.type === "Memo";
      else if (activeFolder === "f_kontrak") matchesFolder = item.type === "Kontrak";
      else if (activeFolder === "f_keuangan") matchesFolder = item.category === "Keuangan";
      else if (activeFolder === "f_legal") matchesFolder = item.category === "Legal";
    }

    // Date matches
    const matchesStartDate = !startDate || item.date >= startDate;
    const matchesEndDate = !endDate || item.date <= endDate;

    return matchesSearch && matchesFolder && matchesStartDate && matchesEndDate;
  });

  const exportArchiveExcel = () => {
    alert("Protokol Ekspor xlsx Diaktifkan:\nMenyusun seluruh metadata arsip dan status dokumen elektronik perusahaan ke format excel sheet (CSV).");
  };

  return (
    <div className="space-y-6" id="arsip-digital-viewport">
      {/* Search Header toolbar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
        {/* Search Input bar */}
        <div className="lg:col-span-2 relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input 
            type="text" 
            placeholder="Pencarian cepat arsip digital (judul, nomor registrasi, instansi)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs md:text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
            id="search-arsip"
          />
        </div>

        {/* Start Date filter */}
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-slate-400 inline shrink-0" />
          <input 
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-800 rounded p-1.5 text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* End Date filter */}
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-slate-400 inline shrink-0" />
          <input 
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-800 rounded p-1.5 text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Main Grid: Directory Tree & Document listings */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Folders Cabinet */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl shadow-sm p-4 h-fit space-y-4">
          <div className="flex justify-between items-center text-xs font-bold text-slate-450 uppercase tracking-wider font-mono">
            <span>Lemari Arsip Kantor</span>
            <Archive className="h-4 w-4 text-slate-400" />
          </div>

          <div className="space-y-1" id="folders-stage">
            <button 
              onClick={() => setActiveFolder("Semua")}
              className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold text-left transition-all ${
                activeFolder === "Semua" 
                  ? "bg-blue-600 text-white" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/20"
              }`}
            >
              <span className="flex items-center"><Folder className="h-4 w-4 mr-2" /> Semua Dokumen</span>
              <span className="font-mono">{allItems.length}</span>
            </button>

            {FOLDERS.map((f) => {
              const currentCount = getFolderCounts(f.id);
              return (
                <button 
                  key={f.id}
                  onClick={() => setActiveFolder(f.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium text-left transition-all ${
                    activeFolder === f.id
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/20"
                  }`}
                  id={`folder-btn-${f.id}`}
                >
                  <span className="flex items-center"><Folder className="h-4 w-4 text-amber-500 mr-2" /> {f.name}</span>
                  <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full px-2 py-0.2 group-hover:bg-white">{currentCount}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Document Listings */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm lg:col-span-3 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-150 dark:border-slate-800/85 flex justify-between items-center bg-slate-50/50 dark:bg-transparent">
            <div>
              <span className="text-sm font-bold text-slate-805 dark:text-white block">Berkas Terarsip ({filteredItems.length} dokumen)</span>
              <p className="text-[11px] text-slate-450 dark:text-slate-500 mt-0.5">Sistem index terpusat PT. Foresyndo Global Indonesia</p>
            </div>

            <button 
              onClick={exportArchiveExcel}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded text-xs transition-shadow shadow-sm"
              id="btn-export-excel"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Ekspor Rekap Excel</span>
            </button>
          </div>

          <div className="overflow-x-auto min-h-[360px]" id="archive-table-stage">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                  <th className="p-4 font-semibold">Tipe Berkas</th>
                  <th className="p-4 font-semibold">Nomor Berkas / Agenda</th>
                  <th className="p-4 font-semibold">Judul / Perihal</th>
                  <th className="p-4 font-semibold">Mitra / Pengirim</th>
                  <th className="p-4 font-semibold">Tanggal Arsip</th>
                  <th className="p-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr 
                    key={item.id} 
                    className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/45 dark:hover:bg-slate-800/20"
                    id={`archive-row-${item.id}`}
                  >
                    <td className="p-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${
                        item.type === "Surat Masuk" 
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40" 
                          : item.type === "Surat Keluar" 
                          ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40"
                          : "bg-purple-50 text-purple-600 dark:bg-purple-950/40"
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-semibold text-slate-800 dark:text-slate-200 text-[10.5px]">
                      {item.number}
                    </td>
                    <td className="p-4 font-medium text-slate-700 dark:text-slate-300">
                      {item.title}
                    </td>
                    <td className="p-4 text-slate-550 dark:text-slate-400">
                      {item.partner}
                    </td>
                    <td className="p-4 font-mono text-slate-500">
                      {item.date}
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center space-x-1">
                        <CheckCircle className="h-3.5 w-3.5 inline text-emerald-500" />
                        <span>{item.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-450 dark:text-slate-500 italic bg-slate-50/30">
                      Kabinet digital kosong. Tidak ditemukan berkas terindeks untuk kategori ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
