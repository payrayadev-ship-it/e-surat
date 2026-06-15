import React, { useState } from "react";
import { Plus, FileText, Calendar, Users, List, Send, MessageSquare, AlertCircle, Eye, CheckCircle, Printer, Sparkles, RefreshCw, Bot, Clock } from "lucide-react";
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

  // Automatic minutes/notulen states
  const [isAutoNotulenOpen, setIsAutoNotulenOpen] = useState(false);
  const [autoMeetTitle, setAutoMeetTitle] = useState("");
  const [autoMeetDate, setAutoMeetDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [autoMeetTime, setAutoMeetTime] = useState("09:00 - 11:00 WIB");
  const [autoMeetAttendees, setAutoMeetAttendees] = useState("");
  const [autoMeetRoughNotes, setAutoMeetRoughNotes] = useState("");
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);

  const generateAutoNotulenWithAI = async () => {
    if (!autoMeetTitle.trim() || !autoMeetRoughNotes.trim()) {
      alert("Silakan lengkapi Judul/Topik Rapat dan Poin Kasar Diskusi terlebih dahulu!");
      return;
    }
    setIsAutoGenerating(true);
    try {
      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Anda adalah Sekretaris Cerdas AI dari PT. Foresyndo Global Indonesia.
Tugas Anda adalah merangkum daftar poin-poin diskusi rapat kasar menjadi draf notulen formal yang terstruktur rapi.

INFORMASI RAPAT:
- Judul/Topik Rapat: ${autoMeetTitle}
- Peserta Rapat: ${autoMeetAttendees || "Seluruh anggota tim yang hadir"}

POIN-POIN KASAR DISKUSI RAPAT:
${autoMeetRoughNotes}

Tolong sintesiskan informasi di atas menjadi 3 komponen dalam format JSON dengan properti string sebagai berikut:
{
  "agenda": "Daftar agenda utama atau pembicaraan yang dibahas pada rapat tersebut, dipisahkan koma atau dibuat list singkat berpoin tebal.",
  "results": "Hasil kesepakatan rapat, poin keputusan operasional, atau resolusi penting yang disetujui. Tulis dalam bentuk butir-butir paragraf formal yang rapi.",
  "actions": "Daftar rencana tindak lanjut (Action items), target implementasi, atau penugasan tugas kepada personil tim terkait secara terperinci."
}

PENTING: Respon Anda HANYA berupa text string JSON valid tanpa tambahan teks pengantar atau penutup apapun. Harap pastikan properti "agenda", "results", dan "actions" terisi secara profesional menggunakan Bahasa Indonesia formal, sopan, dan baku.`,
          mode: "text"
        })
      });

      const data = await res.json();
      if (data.success) {
        let runText = data.text || "";
        runText = runText.trim();
        if (runText.startsWith("```")) {
          runText = runText.replace(/^```(json)?\s*/i, "").replace(/\s*```$/i, "").trim();
        }

        try {
          const parsed = JSON.parse(runText);
          
          // Set to main form state values
          setMeetTitle(autoMeetTitle);
          setMeetDate(autoMeetDate || new Date().toISOString().split('T')[0]);
          setMeetTime(autoMeetTime || "09:00 WIB");
          setMeetAttendees(autoMeetAttendees || "Seluruh tim terkait");
          setMeetAgenda(parsed.agenda || `Membahas perihal ${autoMeetTitle}`);
          setMeetResults(parsed.results || "Kesepakatan dan mufakat telah dicapai pada rapat.");
          setMeetActions(parsed.actions || "Rencana aksi akan dilaksanakan secepatnya sesuai jadwal.");

          // Close wizard and open the form modal for review and editing
          setIsAutoNotulenOpen(false);
          setIsMeetOpen(true);
        } catch (jsonErr) {
          console.warn("Gemini output list was not standard JSON, executing fallback string mapping:", jsonErr);
          // Fallback parser: put everything into results
          setMeetTitle(autoMeetTitle);
          setMeetDate(autoMeetDate || new Date().toISOString().split('T')[0]);
          setMeetTime(autoMeetTime || "09:00 WIB");
          setMeetAttendees(autoMeetAttendees || "Seluruh tim terkait");
          setMeetAgenda(`Rapat Koordinasi: ${autoMeetTitle}`);
          setMeetResults(runText);
          setMeetActions("Sesuai instruksi tindak lanjut dari rapat.");

          setIsAutoNotulenOpen(false);
          setIsMeetOpen(true);
        }
      } else {
        alert("Gagal memproses draf otomatis: " + (data.error || "Gagal menghubungi modul Gemini"));
      }
    } catch (err) {
      alert("Terjadi kesalahan koneksi saat memproses Notulen AI.");
    } finally {
      setIsAutoGenerating(false);
    }
  };

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
              <div className="flex flex-wrap items-center gap-2">
                <button 
                  onClick={() => setIsAutoNotulenOpen(true)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-violet-600 to-indigo-655 hover:from-violet-700 hover:to-indigo-750 font-semibold text-white px-4 py-2.5 rounded-lg text-sm transition-all shadow-sm cursor-pointer"
                  id="btn-auto-notulen"
                >
                  <Bot className="h-4 w-4 animate-pulse" />
                  <span>Notulen Otomatis dengan AI</span>
                </button>
                <button 
                  onClick={() => setIsMeetOpen(true)}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 font-semibold text-white px-4 py-2.5 rounded-lg text-sm transition-all shadow-sm cursor-pointer"
                  id="btn-buat-notulen"
                >
                  <Plus className="h-4 w-4" />
                  <span>Buat Notulen Baru</span>
                </button>
              </div>
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

      {/* MODAL: Notulen Rapat Otomatis dengan AI */}
      {isAutoNotulenOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-gradient-to-r from-violet-600 to-indigo-655 text-white font-bold text-base flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5 animate-pulse" />
                <span>Notulen Rapat Otomatis (Gemini AI)</span>
              </div>
              <button 
                onClick={() => setIsAutoNotulenOpen(false)} 
                className="text-white hover:text-slate-200 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs md:text-sm">
              <div className="bg-violet-50/50 dark:bg-slate-950/40 p-4 rounded-lg border border-violet-100/50 dark:border-violet-900/30">
                <h4 className="font-bold text-violet-900 dark:text-violet-300 flex items-center gap-1.5 mb-1 text-sm">
                  <Sparkles className="h-4 w-4 text-violet-500 animate-spin" /> 
                  Gunakan Asisten Sekretaris AI
                </h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-xs">
                  Membantu menyusun notulensi rapat formal secara otomatis dari catatan pembicaraan kasar/bebas yang Anda masukkan. Selesai diproses, draf dapat ditinjau dan disunting kembali sebelum disimpan ke arsip resmi perusahaan.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-350 font-semibold mb-1">Topik / Nama Rapat</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Contoh: Rapat Evaluasi Kinerja & Rencana Kerja Triwulan III"
                    value={autoMeetTitle}
                    onChange={(e) => setAutoMeetTitle(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-805 dark:text-slate-100 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-350 font-semibold mb-1">Tanggal Rapat</label>
                  <input 
                    type="date" 
                    required
                    value={autoMeetDate}
                    onChange={(e) => setAutoMeetDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-350 font-semibold mb-1">Waktu Pelaksanaan</label>
                  <input 
                    type="text" 
                    placeholder="Misal: 10:00 - 12:00 WIB"
                    value={autoMeetTime}
                    onChange={(e) => setAutoMeetTime(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-805 dark:text-slate-100 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-350 font-semibold mb-1">Daftar Hadir Peserta (Dipisah dengan Koma)</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Ir. Joko Sutrisno, Ibu Amalia, Budi Pratama (IT)"
                  value={autoMeetAttendees}
                  onChange={(e) => setAutoMeetAttendees(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-805 dark:text-slate-100 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-slate-700 dark:text-slate-350 font-semibold">Catatan Kasar / Poin Hasil Diskusi Rapat</label>
                  <span className="text-[10px] text-slate-400 font-mono">Input bebas / hasil chat</span>
                </div>
                <textarea 
                  required
                  rows={6}
                  placeholder={`Ketik draf kasar pembahasan di sini secara bebas, contoh:\n- Pembukaan oleh pimpinan\n- Susi lapor progress integrasi digital sudah 90%\n- Budi usulkan server cloud diperbesar untuk antisipasi lonjakan trafik\n- Disetujui deploy server baru tanggal 15 Juli\n- Penutupan rincian budget oleh Divisi Keuangan`}
                  value={autoMeetRoughNotes}
                  onChange={(e) => setAutoMeetRoughNotes(e.target.value)}
                  className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-805 dark:text-slate-100 text-xs shadow-inner focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all leading-relaxed font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setIsAutoNotulenOpen(false)}
                  className="px-4 py-2.5 border border-slate-250 dark:border-slate-800 text-slate-650 dark:text-slate-400 rounded-lg hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="button"
                  onClick={generateAutoNotulenWithAI}
                  disabled={isAutoGenerating || !autoMeetTitle.trim() || !autoMeetRoughNotes.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-655 hover:from-violet-700 hover:to-indigo-750 disabled:from-slate-400 disabled:to-slate-500 disabled:opacity-50 text-white rounded-lg font-bold flex items-center space-x-2 shadow-md cursor-pointer"
                >
                  {isAutoGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Memproses Notulen...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Sintesis Notulen Formal</span>
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
