import React, { useState } from "react";
import { Plus, FileText, Calendar, Users, List, Send, MessageSquare, AlertCircle, Eye, CheckCircle, Printer, Sparkles, RefreshCw } from "lucide-react";
import { Memo as MemoType, Meeting, UserRole, UserProfile } from "../types";

interface MemosMeetingsProps {
  memos: MemoType[];
  meetings: Meeting[];
  currentRole: UserRole;
  currentUser: UserProfile;
  onAddMemo: (memo: Omit<MemoType, "id" | "createdAt" | "senderId" | "senderName">) => void;
  onAddMeeting: (meeting: Omit<Meeting, "id" | "createdAt">) => void;
}

export default function MemosMeetings({
  memos,
  meetings,
  currentRole,
  currentUser,
  onAddMemo,
  onAddMeeting
}: MemosMeetingsProps) {
  const [activeSubTab, setActiveSubTab] = useState<"memo" | "rapat">("memo");

  // Form states - Memo
  const [isMemoOpen, setIsMemoOpen] = useState(false);
  const [memoNo, setMemoNo] = useState("");
  const [memoSubject, setMemoSubject] = useState("");
  const [memoContent, setMemoContent] = useState("");
  const [memoRecipient, setMemoRecipient] = useState("Staff");

  // Form states - Meeting
  const [isMeetOpen, setIsMeetOpen] = useState(false);
  const [meetTitle, setMeetTitle] = useState("");
  const [meetDate, setMeetDate] = useState("");
  const [meetTime, setMeetTime] = useState("");
  const [meetAttendees, setMeetAttendees] = useState("");
  const [meetAgenda, setMeetAgenda] = useState("");
  const [meetResults, setMeetResults] = useState("");
  const [meetActions, setMeetActions] = useState("");

  // AI Assistant states
  const [generatingAI, setGeneratingAI] = useState(false);

  const generateMemoContentWithAI = async () => {
    if (!memoSubject) {
      alert("Masukkan perihal memo terlebih dahulu agar AI dapat menyusun isinya!");
      return;
    }
    setGeneratingAI(true);
    try {
      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Tuliskan isi amanat memo dinas internal yang profesional, padat, dan formal untuk ditujukan kepada ${memoRecipient} dengan perihal perihal "${memoSubject}". Gunakan Bahasa Indonesia kedinasan yang baik.`,
          mode: "text"
        })
      });
      const data = await res.json();
      if (data.success) {
        setMemoContent(data.text);
      } else {
        alert("Gagal memproses draf memo: " + (data.error || "Layanan tidak bersedia"));
      }
    } catch (err) {
      alert("Layanan AI sedang tidak tersedia. Silakan coba beberapa saat lagi.");
    } finally {
      setGeneratingAI(false);
    }
  };

  const generateMeetingInsightsWithAI = async () => {
    if (!meetTitle || !meetAgenda) {
      alert("Silakan lengkapi Judul/Topik Rapat dan Agenda Utama terlebih dahulu!");
      return;
    }
    setGeneratingAI(true);
    try {
      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Tasarukan kesimpulan rapat (notulensi) yang formal dan 3 rencana tindak lanjut (action items) dari rapat bertema "${meetTitle}" dengan deskripsi agenda: "${meetAgenda}". Format jawaban Anda dalam 2 bagian jelas (Hasil Rapat & Rencana Tindak Lanjut).`,
          mode: "text"
        })
      });
      const data = await res.json();
      if (data.success) {
        const text = data.text;
        const lowerText = text.toLowerCase();
        let splitIndex = lowerText.indexOf("rencana");
        if (splitIndex === -1) splitIndex = lowerText.indexOf("tindak");
        if (splitIndex === -1) splitIndex = text.length / 2;
        
        const part1 = text.substring(0, splitIndex).trim();
        const part2 = text.substring(splitIndex).trim();
        
        setMeetResults(part1 || "Hasil Rapat berhasil dikonstruksi otomatis.");
        setMeetActions(part2 || "Menindaklanjuti program kerja tim sesuai tenggat.");
      } else {
        alert("Gagal memproses notulensi: " + (data.error || "Layanan tidak bersedia"));
      }
    } catch (err) {
      alert("Layanan AI sedang tidak tersedia. Silakan coba beberapa saat lagi.");
    } finally {
      setGeneratingAI(false);
    }
  };

  const submitMemo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoSubject || !memoContent) return;

    onAddMemo({
      memoNumber: memoNo || `MEMO-${String(memos.length + 1).padStart(2, "0")}/FORSDIG/2026`,
      recipientRole: memoRecipient,
      subject: memoSubject,
      content: memoContent,
      status: "Terkirim"
    });

    setMemoNo("");
    setMemoSubject("");
    setMemoContent("");
    setIsMemoOpen(false);
  };

  const submitMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetTitle || !meetDate) return;

    onAddMeeting({
      title: meetTitle,
      date: meetDate,
      time: meetTime || "09:00 WIB",
      attendees: meetAttendees,
      agenda: meetAgenda,
      results: meetResults,
      actions: meetActions,
      status: "Selesai"
    });

    setMeetTitle("");
    setMeetDate("");
    setMeetTime("");
    setMeetAttendees("");
    setMeetAgenda("");
    setMeetResults("");
    setMeetActions("");
    setIsMeetOpen(false);
  };

  const isViewer = currentRole === "Viewer";
  const canModify = currentRole === "Super Admin" || currentRole === "Staff" || currentRole === "Manager" || currentRole === "Direktur";

  return (
    <div className="space-y-6" id="memos-meetings-viewport">
      {/* Subtab toggle */}
      <div className="flex border-b border-slate-200 dark:border-slate-800" id="memos-sub-tab">
        <button 
          onClick={() => setActiveSubTab("memo")}
          className={`pb-3 px-6 text-sm font-semibold border-b-2 transition-all ${
            activeSubTab === "memo" 
              ? "border-blue-600 text-blue-600 dark:text-blue-400" 
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          id="btn-subtab-memo"
        >
          Memo Internal ({memos.length})
        </button>
        <button 
          onClick={() => setActiveSubTab("rapat")}
          className={`pb-3 px-6 text-sm font-semibold border-b-2 transition-all ${
            activeSubTab === "rapat" 
              ? "border-blue-600 text-blue-600 dark:text-blue-400" 
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          id="btn-subtab-rapat"
        >
          Notulen Rapat ({meetings.length})
        </button>
      </div>

      {activeSubTab === "memo" ? (
        <div className="space-y-6" id="memo-sub-tab-content">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 duration-150 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Korespondensi Memo Mandiri</h3>
              <p className="text-xs text-slate-500">Nota dinas internal antar-departemen dan tingkat jabatan perusahaan</p>
            </div>

            {canModify && !isViewer && (
              <button 
                onClick={() => setIsMemoOpen(true)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 font-semibold text-white px-4 py-2.5 rounded-lg text-sm transition-all shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Buat Memo Baru</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="memos-grid">
            {memos.map((memo) => (
              <div key={memo.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3 relative overflow-hidden" id={`memo-card-${memo.id}`}>
                <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-850 pb-2">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Nomor Memo</span>
                    <h4 className="font-semibold text-blue-600 dark:text-blue-400 font-mono text-xs">{memo.memoNumber}</h4>
                  </div>
                  <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">{memo.status}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 block font-semibold">Perihal:</span>
                  <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{memo.subject}</p>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 leading-relaxed font-sans whitespace-pre-line">
                  {memo.content}
                </p>

                <div className="flex justify-between items-center text-[10px] text-slate-450 dark:text-slate-500 font-mono pt-1">
                  <span>Dari: <span className="font-semibold">{memo.senderName}</span></span>
                  <span>Kepada: <span className="font-semibold">{memo.recipientRole}</span></span>
                </div>
              </div>
            ))}

            {memos.length === 0 && (
              <div className="text-center p-12 text-slate-400 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl col-span-2">
                Belum ada berkas memo internal yang diterbitkan.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6" id="meeting-sub-tab-content">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 duration-150 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Berita Acara Notulen Rapat</h3>
              <p className="text-xs text-slate-500">Hasil resolusi, daftar hadir, dan tindak lanjut sidang dewan kooperasi</p>
            </div>

            {canModify && !isViewer && (
              <button 
                onClick={() => setIsMeetOpen(true)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 font-semibold text-white px-4 py-2.5 rounded-lg text-sm transition-all shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Buat Notulen Baru</span>
              </button>
            )}
          </div>

          <div className="space-y-6" id="meetings-list">
            {meetings.map((meet) => (
              <div key={meet.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4" id={`meeting-card-${meet.id}`}>
                <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <div>
                    <h4 className="text-base font-bold text-slate-800 dark:text-white flex items-center">
                      <Calendar className="h-4.5 w-4.5 text-blue-500 mr-2" />
                      {meet.title}
                    </h4>
                    <div className="flex space-x-4 text-[11px] text-slate-450 dark:text-slate-500 font-mono mt-1">
                      <span>Tanggal: {meet.date}</span>
                      <span>Waktu: {meet.time}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      alert(`Melakukan Export Notulen: "${meet.title}" ke format DOCX/PDF.`);
                    }}
                    className="flex items-center space-x-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded text-xs font-bold"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Pratinjau Cetak</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                  {/* Attendees */}
                  <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-850">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center">
                      <Users className="h-3.5 w-3.5 text-blue-500 mr-1.5 inline" /> Peserta Sidang Rapat
                    </span>
                    <p className="text-slate-600 dark:text-slate-400 mt-1 leading-normal">{meet.attendees}</p>
                  </div>

                  {/* Agenda */}
                  <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-850">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center">
                      <List className="h-3.5 w-3.5 text-indigo-500 mr-1.5 inline" /> Agenda Pembahasan
                    </span>
                    <p className="text-slate-600 dark:text-slate-400 mt-1 leading-normal">{meet.agenda}</p>
                  </div>
                </div>

                {/* Hasil rapat */}
                <div className="bg-blue-50/20 dark:bg-blue-950/5 border border-blue-100 dark:border-blue-900/40 p-4 rounded-lg space-y-1 text-xs">
                  <span className="font-bold text-slate-805 dark:text-white flex items-center mb-1">
                    <CheckCircle className="h-4 w-4 text-emerald-500 mr-1.5" /> Hasil Resolusi & Kesepakatan
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 leading-normal whitespace-pre-line">{meet.results}</p>
                </div>

                {/* Actions */}
                <div className="bg-amber-50/20 dark:bg-amber-950/5 border border-amber-100 dark:border-amber-900/40 p-4 rounded-lg space-y-1 text-xs">
                  <span className="font-bold text-slate-805 dark:text-white flex items-center mb-1">
                    <AlertCircle className="h-4 w-4 text-amber-500 mr-1.5" /> Tindak Lanjut Tugas Karyawan
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 leading-normal whitespace-pre-line">{meet.actions}</p>
                </div>
              </div>
            ))}

            {meetings.length === 0 && (
              <div className="text-center p-12 text-slate-400 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl">
                Belum ada berita acara rapat / notulensi rapat yang tersimpan.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Buat Memo Baru */}
      {isMemoOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-blue-600 text-white font-bold text-base flex justify-between items-center">
              <span>Formulir Memo Dinas Internal</span>
              <button onClick={() => setIsMemoOpen(false)} className="text-white/80 hover:text-white"><Printer className="hidden md:inline h-5 w-5" />X</button>
            </div>

            <form onSubmit={submitMemo} className="p-5 space-y-4 text-xs md:text-sm">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Nomor Registrasi Memo (Opsional)</label>
                <input 
                  type="text" 
                  placeholder="Format otomatis: MEMO-01/..."
                  value={memoNo}
                  onChange={(e) => setMemoNo(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-805 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Penerima Memo (Role Jabatan)</label>
                <select 
                  value={memoRecipient}
                  onChange={(e) => setMemoRecipient(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-805 dark:text-slate-100"
                >
                  <option value="Direktur">Seluruh Jajaran Direksi</option>
                  <option value="Manager">Jajaran Manager Divisi</option>
                  <option value="Staff">Seluruh Staff & Karyawan</option>
                  <option value="Semua Departemen">Terbuka (Semua Departemen)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Perihal Isi Memo</label>
                <input 
                  type="text" 
                  required
                  placeholder="Judul pokok pesan memo..."
                  value={memoSubject}
                  onChange={(e) => setMemoSubject(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-805 dark:text-slate-100"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-slate-500 font-semibold">Isi & Amanat Memo Dinas</label>
                  <button
                    type="button"
                    onClick={generateMemoContentWithAI}
                    disabled={generatingAI}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center space-x-1 hover:underline cursor-pointer disabled:opacity-50"
                  >
                    {generatingAI ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    <span>Draft Otomatis via AI</span>
                  </button>
                </div>
                <textarea 
                  required
                  placeholder="Ketik rincian memo kedinasan secara formal..."
                  rows={5}
                  value={memoContent}
                  onChange={(e) => setMemoContent(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-805 dark:text-slate-100 focus:outline-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setIsMemoOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded hover:bg-slate-100"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold"
                >
                  Kirim Memo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Buat Notulen Rapat Baru */}
      {isMeetOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-blue-600 text-white font-bold text-base flex justify-between items-center">
              <span>Formulir Berita Acara Notulen Sidang</span>
              <button onClick={() => setIsMeetOpen(false)} className="text-white/80 hover:text-white">X</button>
            </div>

            <form onSubmit={submitMeeting} className="p-6 space-y-4 text-xs md:text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-slate-500 font-semibold mb-1">Topik / Nama Rapat</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Contoh: Rapat Evaluasi Anggaran Triwulan..."
                    value={meetTitle}
                    onChange={(e) => setMeetTitle(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-805 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Tanggal Rapat</label>
                  <input 
                    type="date" 
                    required
                    value={meetDate}
                    onChange={(e) => setMeetDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-805 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Waktu Pelaksanaan</label>
                  <input 
                    type="text" 
                    placeholder="Misal: 09:00 - 12:00 WIB"
                    value={meetTime}
                    onChange={(e) => setMeetTime(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-805 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Daftar Hadir Peserta (Dipisah dengan Koma)</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ir. Joko Sutrisno, Dewi Lestari, Budi Pratama..."
                  value={meetAttendees}
                  onChange={(e) => setMeetAttendees(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-805 dark:text-slate-100"
                />
              </div>

              <div className="bg-indigo-50/40 dark:bg-slate-950/40 p-2.5 rounded-lg border border-indigo-100/50 dark:border-indigo-900/30 text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-805 dark:text-white block">Sintesis Notulensi Berbantu AI (Gemini)</span>
                  <span className="text-[10px] text-slate-400">Menyusun Hasil Resolusi & Rencana Kerja otomatis berbasis Topik & Agenda</span>
                </div>
                <button
                  type="button"
                  onClick={generateMeetingInsightsWithAI}
                  disabled={generatingAI}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-1.5 px-3 rounded flex items-center space-x-1 hover:underline cursor-pointer text-[10px]"
                >
                  {generatingAI ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  <span>Jadikan Notulan AI</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Agenda Utama Pembahasan</label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="Tulis list agenda atau topik pokok..."
                    value={meetAgenda}
                    onChange={(e) => setMeetAgenda(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-805 dark:text-slate-100 text-xs shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Hasil Keputusan & Resolusi</label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="Hasil kesepakatan mufakat dewan rapat..."
                    value={meetResults}
                    onChange={(e) => setMeetResults(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-805 dark:text-slate-100 text-xs shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Tindak Lanjut Tugas Karyawan (Action Plan)</label>
                <textarea 
                  required
                  rows={2}
                  placeholder="Langkah nyata yang ditugaskan kepada personil..."
                  value={meetActions}
                  onChange={(e) => setMeetActions(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-805 dark:text-slate-100 text-xs shadow-inner"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setIsMeetOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded hover:bg-slate-100"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold"
                >
                  Simpan Berita Acara
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
