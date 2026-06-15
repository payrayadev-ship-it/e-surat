import React, { useState, useEffect } from "react";
import { 
  Building2, LayoutDashboard, Mail, Send, MessageSquare, Archive, Settings, 
  LogOut, Sun, Moon, Sparkles, User, ShieldAlert, CheckCircle, Bell, RefreshCw, Plus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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
  const getTabLabel = () => {
    switch (activeTab) {
      case "dashboard": return "Dashboard Overview";
      case "surat_masuk": return "Arsip Surat Masuk";
      case "surat_keluar": return "Surat Keluar (E-Sign)";
      case "memos": return "Memo & Notulen Rapat";
      case "arsip": return "Cabinet Digital";
      case "settings": return "Sistem Pengaturan";
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
            <div className="relative hidden md:block">
              <input 
                type="text" 
                placeholder="Cari dokumen..." 
                className="bg-slate-100 dark:bg-slate-950 border-none rounded-full py-1.5 px-4 text-xs w-64 focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-300"
              />
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
    </div>
  );
}
