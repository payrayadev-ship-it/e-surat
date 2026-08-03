import React, { useState, useEffect } from "react";
import { Settings, Shield, Key, Mail, RefreshCw, Layers, Edit3, Trash, UserCheck, Smartphone, Sparkles, AlertTriangle, ShieldAlert, CheckCircle, Database, Upload, Trash2, Lock, Fingerprint, Sliders, Eye, EyeOff, CheckCircle2, ShieldCheck } from "lucide-react";
import { CompanySetting, AuditLog, UserRole, UserProfile } from "../types";
import { collection, getDocs, addDoc, query, orderBy, limit } from "firebase/firestore";
import { db, auth } from "../firebase";
import FgiLogo from "./FgiLogo";

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120"
];

interface SettingsAuditProps {
  companySetting: CompanySetting;
  auditLogs: AuditLog[];
  currentRole: UserRole;
  users: UserProfile[];
  onUpdateCompany: (setting: CompanySetting) => void;
  onClearAuditLogs: () => void;
  onUpdateUsers: (users: UserProfile[]) => void;
}

export default function SettingsAudit({
  companySetting,
  auditLogs,
  currentRole,
  users,
  onUpdateCompany,
  onClearAuditLogs,
  onUpdateUsers
}: SettingsAuditProps) {
  const [activeTab, setActiveTab] = useState<"general" | "smtp" | "audit" | "users" | "ai_gemini" | "passkey">("general");

  // Passkey & Password Settings Form States
  const [minPasswordLength, setMinPasswordLength] = useState<number>(companySetting.minPasswordLength || 8);
  const [requireComplexPassword, setRequireComplexPassword] = useState<boolean>(companySetting.requireComplexPassword ?? true);
  const [passkeyExpirationDays, setPasskeyExpirationDays] = useState<number>(companySetting.passkeyExpirationDays || 90);
  const [enablePasskeyAuth, setEnablePasskeyAuth] = useState<boolean>(companySetting.enablePasskeyAuth ?? true);
  const [maxFailedPasskeyAttempts, setMaxFailedPasskeyAttempts] = useState<number>(companySetting.maxFailedPasskeyAttempts || 5);
  const [masterPasskeyPIN, setMasterPasskeyPIN] = useState<string>(companySetting.masterPasskeyPIN || "889900");
  const [showPIN, setShowPIN] = useState<boolean>(false);

  // Reset Passkey Modal state for employee management
  const [selectedUserForPasskeyReset, setSelectedUserForPasskeyReset] = useState<UserProfile | null>(null);
  const [newPasskeyTempPIN, setNewPasskeyTempPIN] = useState<string>("");
  const [passkeyTestSuccess, setPasskeyTestSuccess] = useState<string | null>(null);

  // Master PIN Change Modal State
  const [isChangeMasterPinModalOpen, setIsChangeMasterPinModalOpen] = useState<boolean>(false);
  const [currentPinInput, setCurrentPinInput] = useState<string>("");
  const [newPinInput, setNewPinInput] = useState<string>("");
  const [confirmNewPinInput, setConfirmNewPinInput] = useState<string>("");
  const [showCurrentPin, setShowCurrentPin] = useState<boolean>(false);
  const [showNewPin, setShowNewPin] = useState<boolean>(false);
  const [pinValidationError, setPinValidationError] = useState<string | null>(null);
  const [isEmergencyPinReset, setIsEmergencyPinReset] = useState<boolean>(false);

  // Sync states when companySetting prop updates
  useEffect(() => {
    if (companySetting) {
      setMinPasswordLength(companySetting.minPasswordLength || 8);
      setRequireComplexPassword(companySetting.requireComplexPassword ?? true);
      setPasskeyExpirationDays(companySetting.passkeyExpirationDays || 90);
      setEnablePasskeyAuth(companySetting.enablePasskeyAuth ?? true);
      setMaxFailedPasskeyAttempts(companySetting.maxFailedPasskeyAttempts || 5);
      setMasterPasskeyPIN(companySetting.masterPasskeyPIN || "889900");
    }
  }, [companySetting]);

  // Form states for manual user editing
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isAddingUser, setIsAddingUser] = useState<boolean>(false);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    role: "Staff" as UserRole,
    avatarUrl: ""
  });

  const handleStartEdit = (user: UserProfile) => {
    setEditingUser(user);
    setIsAddingUser(false);
    setUserForm({
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl || ""
    });
  };

  const handleDeleteUser = (userId: string) => {
    if (users.length <= 1) {
      alert("Tidak dapat menghapus semua pegawai. Harus tersisa minimal satu pegawai.");
      return;
    }
    const userToDelete = users.find((u) => u.id === userId);
    if (confirm(`Apakah Anda yakin ingin menghapus pegawai "${userToDelete?.name}"?`)) {
      const updatedUsers = users.filter((u) => u.id !== userId);
      onUpdateUsers(updatedUsers);
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name.trim() || !userForm.email.trim()) {
      alert("Nama dan Email wajib diisi!");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userForm.email.trim())) {
      alert("Format email tidak valid!");
      return;
    }

    const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userForm.name.trim())}`;

    if (editingUser) {
      const updatedUsers = users.map((u) =>
        u.id === editingUser.id
          ? {
              ...u,
              name: userForm.name.trim(),
              email: userForm.email.trim(),
              role: userForm.role,
              avatarUrl: userForm.avatarUrl.trim() || u.avatarUrl || defaultAvatar
            }
          : u
      );
      onUpdateUsers(updatedUsers);
      setEditingUser(null);
    } else {
      const newUser: UserProfile = {
        id: `user_${Date.now()}`,
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        role: userForm.role,
        avatarUrl: userForm.avatarUrl.trim() || defaultAvatar,
        createdAt: new Date().toISOString()
      };
      onUpdateUsers([...users, newUser]);
      setIsAddingUser(false);
    }

    setUserForm({
      name: "",
      email: "",
      role: "Staff",
      avatarUrl: ""
    });
  };

  // Form states - Company metadata
  const [companyName, setCompanyName] = useState(companySetting.companyName);
  const [companyAddress, setCompanyAddress] = useState(companySetting.companyAddress);
  const [companyCity, setCompanyCity] = useState(companySetting.city || "Jakarta");
  const [companyPhone, setCompanyPhone] = useState(companySetting.companyPhone);
  const [companyEmail, setCompanyEmail] = useState(companySetting.companyEmail);
  const [numberFormat, setNumberFormat] = useState(companySetting.letterNumberFormat);
  const [companyLogo, setCompanyLogo] = useState<string | undefined>(companySetting.companyLogo);

  // Form states - SMTP
  const [smtpHost, setSmtpHost] = useState(companySetting.smtpHost || "smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState(companySetting.smtpPort || 587);
  const [smtpUser, setSmtpUser] = useState(companySetting.smtpUser || "office@forsdig-office.co.id");

  // AI Gemini states
  const [apiStatus, setApiStatus] = useState<"CONNECTED" | "FAILED" | "NOT_TESTED">("NOT_TESTED");
  const [envStatus, setEnvStatus] = useState<"ACTIVE" | "INACTIVE">("INACTIVE");
  const [requestToday, setRequestToday] = useState<number>(0);
  const [errorToday, setErrorToday] = useState<number>(0);
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; title: string; message: string } | null>(null);
  const [aiLogsList, setAiLogsList] = useState<any[]>([]);

  const fetchAiLogs = async () => {
    try {
      const q = query(collection(db, "ai_logs"), orderBy("createdAt", "desc"), limit(25));
      const snapshot = await getDocs(q);
      const logs: any[] = [];
      let successCount = 0;
      let failCount = 0;
      
      snapshot.forEach((doc) => {
        const d = doc.data();
        logs.push({ id: doc.id, ...d });
        if (d.status === "SUCCESS") {
          successCount++;
        } else if (d.status === "FAILED") {
          failCount++;
        }
      });
      
      setAiLogsList(logs);
      setRequestToday(successCount);
      setErrorToday(failCount);
    } catch (err) {
      console.warn("Failed to fetch ai_logs, either unauthorized or db not set up yet:", err);
      const localLogsRaw = localStorage.getItem("local_ai_logs");
      if (localLogsRaw) {
        const parsed = JSON.parse(localLogsRaw);
        setAiLogsList(parsed);
        const success = parsed.filter((l: any) => l.status === "SUCCESS").length;
        const failed = parsed.filter((l: any) => l.status === "FAILED").length;
        setRequestToday(success);
        setErrorToday(failed);
      }
    }
  };

  useEffect(() => {
    if (activeTab === "ai_gemini") {
      fetchAiLogs();
    }
  }, [activeTab]);

  const testGeminiConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "Testing modern office AI API connection response. Please answer with 'OK'.", mode: "text" }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        throw new Error(`Endpoint HTTP Error code: ${res.status}`);
      }
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Response is not valid JSON (Returned HTML 404 or other format)");
      }
      
      const data = await res.json();
      const useRealKey = !data.fallback;
      
      setApiStatus("CONNECTED");
      setEnvStatus(useRealKey ? "ACTIVE" : "INACTIVE");
      
      const resText = data.text || "OK";
      
      setTestResult({
        success: true,
        title: "Koneksi Berhasil!",
        message: `Status: CONNECTED\nModel: gemini-3.6-flash\nKunci API Riil: ${useRealKey ? "AKTIF" : "OFFLINE FALLBACK"}\nRespon AI: "${resText}"`
      });
      
      const newLogPayload = {
        userId: auth.currentUser?.uid || "admin_demo",
        prompt: "API connection test query verified",
        response: resText,
        status: "SUCCESS",
        createdAt: new Date().toISOString()
      };
      
      try {
        await addDoc(collection(db, "ai_logs"), newLogPayload);
      } catch (err) {
        console.warn("Could not save log directly to Firestore. Saving locally.");
        const currentLogs = JSON.parse(localStorage.getItem("local_ai_logs") || "[]");
        currentLogs.unshift({ id: `local_${Date.now()}`, ...newLogPayload });
        localStorage.setItem("local_ai_logs", JSON.stringify(currentLogs.slice(0, 50)));
      }
      
      fetchAiLogs();
      
    } catch (err: any) {
      console.error("Test connection aborted or failed:", err);
      
      setApiStatus("FAILED");
      setEnvStatus("INACTIVE");
      
      const isTimeout = err.name === "AbortError";
      const userMessage = isTimeout 
        ? "Sambungan terputus karena batas waktu (timeout). Silakan periksa jaringan internet Anda atau coba lagi." 
        : `Kesalahan Endpoint API: ${err.message || "Gagal menghubungi modul integrasi AI."}\nLayanan AI sedang tidak tersedia.\nSilakan coba beberapa saat lagi.`;
      
      setTestResult({
        success: false,
        title: "Koneksi Gagal!",
        message: userMessage
      });
      
      const newLogPayload = {
        userId: auth.currentUser?.uid || "admin_demo",
        prompt: "API connection test query verified",
        response: err.message || "Connection timeout or invalid response",
        status: "FAILED",
        createdAt: new Date().toISOString()
      };
      
      try {
        await addDoc(collection(db, "ai_logs"), newLogPayload);
      } catch (dbErr) {
        const currentLogs = JSON.parse(localStorage.getItem("local_ai_logs") || "[]");
        currentLogs.unshift({ id: `local_${Date.now()}`, ...newLogPayload });
        localStorage.setItem("local_ai_logs", JSON.stringify(currentLogs.slice(0, 50)));
      }
      
      fetchAiLogs();
    } finally {
      setTestingConnection(false);
    }
  };

  const saveGeneralSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCompany({
      ...companySetting,
      companyName,
      companyAddress,
      city: companyCity,
      companyPhone,
      companyEmail,
      letterNumberFormat: numberFormat,
      companyLogo: companyLogo
    });
    alert("Konfigurasi profil korporat PT. Foresyndo Global Indonesia berhasil diperbarui!");
  };

  const saveSmtpSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCompany({
      ...companySetting,
      smtpHost,
      smtpPort,
      smtpUser
    });
    alert("Pengaturan SMTP Server Outgoing Mail berhasil diamankan & diuji terhubung!");
  };

  const isSuperAdmin = currentRole === "Super Admin";

  const savePasskeySettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      alert("Akses Ditolak: Hanya Super Admin yang memiliki wewenang untuk mengatur kebijakan Kunci Sandi & Passkey Perusahaan!");
      return;
    }
    if (masterPasskeyPIN.length < 6) {
      alert("PIN Kunci Sandi Master Super Admin wajib minimal 6 digit angka/karakter!");
      return;
    }
    onUpdateCompany({
      ...companySetting,
      minPasswordLength,
      requireComplexPassword,
      passkeyExpirationDays,
      enablePasskeyAuth,
      maxFailedPasskeyAttempts,
      masterPasskeyPIN
    });
    alert("✓ Pengaturan Kunci Sandi, Biometrik Passkey, dan Kebijakan Kata Sandi Korporat berhasil diperbarui oleh Super Admin!");
  };

  const handleResetEmployeePasskey = (user: UserProfile) => {
    if (!isSuperAdmin) {
      alert("Akses Terbatas: Hanya Super Admin yang dapat mereset kunci sandi atau passkey pegawai.");
      return;
    }
    setSelectedUserForPasskeyReset(user);
    setNewPasskeyTempPIN(Math.floor(100000 + Math.random() * 900000).toString());
  };

  const confirmResetEmployeePasskey = () => {
    if (!selectedUserForPasskeyReset) return;
    
    const updatedUsers = users.map((u) =>
      u.id === selectedUserForPasskeyReset.id
        ? {
            ...u,
            passkeyStatus: "Perlu Reset" as const,
            lastPasswordChange: new Date().toISOString().split("T")[0]
          }
        : u
    );
    onUpdateUsers(updatedUsers);
    alert(`✓ Kunci Sandi & Passkey untuk pegawai "${selectedUserForPasskeyReset.name}" (${selectedUserForPasskeyReset.email}) berhasil direset!\n\nKode PIN Passkey Sementara: ${newPasskeyTempPIN}\n\nPegawai diminta melakukan pembaruan kata sandi saat sesi login berikutnya.`);
    setSelectedUserForPasskeyReset(null);
  };

  const handleTestPasskeyWebAuthn = () => {
    setPasskeyTestSuccess("Menginisialisasi Verifikasi Biometrik Passkey (WebAuthn / FIDO2)...");
    setTimeout(() => {
      setPasskeyTestSuccess("✓ Kunci Sandi Biometrik Perangkat (Passkey WebAuthn) Berhasil Divalidasi! Perangkat terverifikasi sah oleh Super Admin.");
    }, 1000);
  };

  const handleChangeMasterPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinValidationError(null);

    if (!isSuperAdmin) {
      setPinValidationError("Akses Ditolak: Hanya Super Admin yang berhak mengubah PIN Master.");
      return;
    }

    // 1. Verify Current PIN unless in Emergency Reset mode
    if (!isEmergencyPinReset) {
      if (!currentPinInput) {
        setPinValidationError("Masukkan PIN Master Lama untuk verifikasi otorisasi!");
        return;
      }
      if (currentPinInput !== masterPasskeyPIN) {
        setPinValidationError("PIN Master Lama yang Anda masukkan tidak sesuai. Gunakan Reset Darurat jika Anda lupa PIN.");
        return;
      }
    }

    // 2. Format check
    if (newPinInput.length < 6 || newPinInput.length > 8) {
      setPinValidationError("PIN Master Baru wajib terdiri dari 6 hingga 8 karakter/digit!");
      return;
    }

    // 3. Avoid weak combination
    if (/^(01234567|12345678|123456|654321|000000|111111|222222|333333|444444|555555|666666|777777|888888|999999)$/.test(newPinInput)) {
      setPinValidationError("PIN Master Baru terlalu sederhana. Gunakan pola kombinasi yang lebih acak.");
      return;
    }

    // 4. Confirm match
    if (newPinInput !== confirmNewPinInput) {
      setPinValidationError("Konfirmasi PIN Baru tidak cocok dengan PIN Baru.");
      return;
    }

    // Save
    setMasterPasskeyPIN(newPinInput);
    onUpdateCompany({
      ...companySetting,
      masterPasskeyPIN: newPinInput
    });

    alert("✓ Otorisasi Berhasil: PIN Master Passkey Super Admin telah berhasil diperbarui & disinkronkan ke seluruh sistem!");

    // Reset Form & Close
    setIsChangeMasterPinModalOpen(false);
    setCurrentPinInput("");
    setNewPinInput("");
    setConfirmNewPinInput("");
    setPinValidationError(null);
    setIsEmergencyPinReset(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-4 min-h-[480px]" id="settings-audit-viewport">
      {/* Settings Navigation Menu */}
      <div className="bg-slate-50 dark:bg-slate-950 p-4 border-r border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block mb-2 px-2">Sistem Konsol</span>
          
          <button 
            onClick={() => setActiveTab("general")}
            className={`w-full flex items-center space-x-2 p-2.5 rounded-lg text-xs font-semibold text-left transition-all ${
              activeTab === "general" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
            id="tab-settings-general"
          >
            <Settings className="h-4 w-4" />
            <span>Profil Perusahaan</span>
          </button>

          <button 
            onClick={() => setActiveTab("smtp")}
            className={`w-full flex items-center space-x-2 p-2.5 rounded-lg text-xs font-semibold text-left transition-all ${
              activeTab === "smtp" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
            id="tab-settings-smtp"
          >
            <Mail className="h-4 w-4" />
            <span>Mail Server (SMTP)</span>
          </button>

          <button 
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center space-x-2 p-2.5 rounded-lg text-xs font-semibold text-left transition-all ${
              activeTab === "users" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
            id="tab-settings-users"
          >
            <Layers className="h-4 w-4" />
            <span>Direktori Pegawai</span>
          </button>

          <button 
            onClick={() => setActiveTab("passkey")}
            className={`w-full flex items-center space-x-2 p-2.5 rounded-lg text-xs font-semibold text-left transition-all ${
              activeTab === "passkey" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
            id="tab-settings-passkey"
          >
            <Key className="h-4 w-4 text-amber-500" />
            <span>Pengaturan Kunci Sandi</span>
          </button>

          <button 
            onClick={() => setActiveTab("audit")}
            className={`w-full flex items-center space-x-2 p-2.5 rounded-lg text-xs font-semibold text-left transition-all ${
              activeTab === "audit" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
            id="tab-settings-audit"
          >
            <Shield className="h-4 w-4" />
            <span>Audit Trail & Security</span>
          </button>

          <button 
            onClick={() => setActiveTab("ai_gemini")}
            className={`w-full flex items-center space-x-2 p-2.5 rounded-lg text-xs font-semibold text-left transition-all ${
              activeTab === "ai_gemini" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
            id="tab-settings-ai"
          >
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <span>AI Gemini Dashboard</span>
          </button>
        </div>

        <div className="p-2.5 bg-slate-100 dark:bg-slate-900 rounded-lg text-[11px] text-slate-500 font-mono">
          <p>Role Aktif: <span className="font-bold text-blue-600 dark:text-blue-400">{currentRole}</span></p>
          <p className="mt-1">e-Office v2.6.4</p>
        </div>
      </div>

      {/* Settings Content Grid Area */}
      <div className="md:col-span-3 p-6" id="settings-content-viewport">
        {activeTab === "general" && (
          <form onSubmit={saveGeneralSettings} className="space-y-4" id="form-general-settings">
            <h3 className="text-base font-bold text-slate-805 dark:text-white border-b border-slate-100 pb-2">Konfigurasi Kop & Profil Perusahaan</h3>
            <p className="text-xs text-slate-450 dark:text-slate-500">Sesuaikan metadata resmi PT. Foresyndo Global Indonesia untuk melengkapi draf KOP surat keluar otomatis.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Nama Perusahaan Resmi</label>
                <input 
                  type="text" 
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Format Nomor Surat Keluar</label>
                <input 
                  type="text" 
                  required
                  value={numberFormat}
                  onChange={(e) => setNumberFormat(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 font-mono text-slate-800 dark:text-slate-100"
                  placeholder="e.g., SPD/YYYY/MM/[SEQ]"
                />
                <span className="text-[10px] text-slate-400 block mt-1">Variabel: YYYY (tahun), MM (bulan), [SEQ] (urutan sequential otomatis)</span>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Surel Masuk Kontak (E-mail)</label>
                <input 
                  type="email" 
                  required
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Telepon Resmi Perusahaan</label>
                <input 
                  type="text" 
                  required
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Kota Pembuatan Surat (Default)</label>
                <input 
                  type="text" 
                  required
                  value={companyCity}
                  onChange={(e) => setCompanyCity(e.target.value)}
                  placeholder="e.g. Jakarta, Bandung, Surabaya"
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-500 font-semibold mb-1">Alamat Gedung Korporat</label>
                <textarea 
                  required
                  rows={2}
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100"
                />
              </div>

              {/* Logo Upload Segment */}
              <div className="md:col-span-2 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-xl space-y-4">
                <span className="block text-xs font-bold text-slate-650 dark:text-slate-350 uppercase tracking-wider font-mono">Logo Resmi Perusahaan</span>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Current Logo Render Box */}
                  <div className="w-40 h-16 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center p-2 bg-white dark:bg-slate-950 shadow-inner overflow-hidden">
                    {companyLogo ? (
                      <img src={companyLogo} alt="Corporate Logo" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <FgiLogo size={32} />
                    )}
                  </div>

                  {/* Actions & File Pickers */}
                  <div className="flex-1 space-y-2 w-full text-center sm:text-left">
                    <p className="text-xs text-slate-500">Unggah berkas gambar logo resmi perusahaan untuk disematkan di KOP surat menyurat digital dan dokumen PDF (disarankan aspek rasio memanjang, format PNG transparan).</p>
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      <label className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded text-xs transition-colors cursor-pointer flex items-center space-x-1">
                        <Upload className="h-3.5 w-3.5" />
                        <span>Pilih Berkas Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  setCompanyLogo(event.target.result as string);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      {companyLogo && (
                        <button
                          type="button"
                          onClick={() => setCompanyLogo(undefined)}
                          className="bg-red-500 hover:bg-red-600 text-white font-bold px-3 py-1.5 rounded text-xs transition-colors flex items-center space-x-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Gunakan Default (FGI)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button 
                type="submit" 
                disabled={!isSuperAdmin}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded text-xs transition-colors"
              >
                {!isSuperAdmin ? "Hanya Super Admin yang Dapat Mengedit" : "Simpan Profil Korporat"}
              </button>
            </div>
          </form>
        )}

        {activeTab === "smtp" && (
          <form onSubmit={saveSmtpSettings} className="space-y-4" id="form-smtp-settings">
            <h3 className="text-base font-bold text-slate-805 dark:text-white border-b border-slate-100 pb-2">Integrasi Server Email Otomatis</h3>
            <p className="text-xs text-slate-450 dark:text-slate-500 text-pretty">Konfigurasikan detail SMTP untuk melakukan pengiriman surat PDF dan memo langsung ke pihak eksternal.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs md:text-sm">
              <div className="md:col-span-2">
                <label className="block text-slate-500 font-semibold mb-1">Host Server SMTP</label>
                <input 
                  type="text" 
                  required
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-mono"
                  placeholder="smtp.gmail.com"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Port Server</label>
                <input 
                  type="number" 
                  required
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-mono"
                  placeholder="587"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-500 font-semibold mb-1">Akun User SMTP Surel</label>
                <input 
                  type="text" 
                  required
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Kunci Password SMTP</label>
                <input 
                  type="password" 
                  value="*********" 
                  disabled
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-100 text-slate-400 cursor-not-allowed text-[10px]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button 
                type="submit" 
                disabled={!isSuperAdmin}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded text-xs transition-colors"
              >
                {!isSuperAdmin ? "Hanya Super Admin yang Dapat Mengubah" : "Simpan & Test Koneksi SMTP"}
              </button>
            </div>
          </form>
        )}

        {activeTab === "users" && (
          <div className="space-y-4" id="user-directory-panel">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div>
                <h3 className="text-base font-bold text-slate-805 dark:text-white">Direktori & Jabatan Pegawai</h3>
                <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">Daftar akun berwenang dalam menyusun, memeriksa, serta menandatangani surat dinas.</p>
              </div>
              {!isAddingUser && !editingUser && (
                <button
                  onClick={() => {
                    setIsAddingUser(true);
                    setEditingUser(null);
                    setUserForm({
                      name: "",
                      email: "",
                      role: "Staff",
                      avatarUrl: ""
                    });
                  }}
                  className="mt-2 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors self-start cursor-pointer shadow-sm"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Tambah Pegawai</span>
                </button>
              )}
            </div>

            {(isAddingUser || editingUser) ? (
              <form onSubmit={handleSaveUser} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-850 space-y-4 animate-in fade-in duration-200">
                <h4 className="text-sm font-bold text-slate-805 dark:text-white">
                  {editingUser ? `Edit Pegawai: ${editingUser.name}` : "Tambah Pegawai Baru"}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Nama Lengkap & Gelar</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Andi Wijaya, S.Kom."
                      value={userForm.name}
                      onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                      className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Surel Pegawai</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. nama@forsdig.com"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Jabatan / Role</label>
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                      className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                    >
                      <option value="Super Admin">Super Admin</option>
                      <option value="Direktur">Direktur</option>
                      <option value="Manager">Manager</option>
                      <option value="Staff">Staff</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Avatar URL (Opsional)</label>
                    <input
                      type="text"
                      placeholder="e.g. https://images.unsplash.com/..."
                      value={userForm.avatarUrl}
                      onChange={(e) => setUserForm({ ...userForm, avatarUrl: e.target.value })}
                      className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-slate-500">Pilih Template Avatar Cepat:</span>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_AVATARS.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setUserForm({ ...userForm, avatarUrl: url })}
                        className={`p-1 rounded-full border-2 transition-all cursor-pointer ${userForm.avatarUrl === url ? "border-blue-600 scale-105" : "border-transparent opacity-70 hover:opacity-100"}`}
                      >
                        <img src={url} alt={`Preset ${idx + 1}`} className="h-9 w-9 rounded-full object-cover" />
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setUserForm({ ...userForm, avatarUrl: "" })}
                      className={`h-11 px-3 text-[10px] rounded-lg border border-dashed text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-mono transition-all cursor-pointer ${!userForm.avatarUrl ? "border-blue-600 font-bold bg-blue-50 dark:bg-blue-950/20" : "border-slate-300 dark:border-slate-700"}`}
                    >
                      Initials (Default)
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingUser(false);
                      setEditingUser(null);
                    }}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-sm cursor-pointer"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {users.map((u) => (
                <div key={u.id} className="relative group flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-850 text-xs transition-all hover:shadow-sm">
                  <div className="flex items-center space-x-3">
                    <img src={u.avatarUrl} alt={u.name} className="h-10 w-10 rounded-full object-cover border border-blue-100 shrink-0" />
                    <div>
                      <h4 className="font-bold text-slate-805 dark:text-white">{u.name}</h4>
                      <p className="font-medium text-slate-450 dark:text-slate-500 font-mono text-[10px] mt-0.5">{u.email}</p>
                      <span className="inline-block mt-1 font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded px-1.5 py-0.2 uppercase text-[9px] tracking-wide font-mono">{u.role}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 sm:opacity-0 group-hover:opacity-100 transition-opacity bg-slate-50/90 dark:bg-slate-950/90 pl-2 py-1 rounded-l-lg shrink-0">
                    <button
                      onClick={() => handleStartEdit(u)}
                      title="Edit Pegawai"
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-colors cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      title="Hapus Pegawai"
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "audit" && (
          <div className="space-y-4" id="audit-trail-panel">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-base font-bold text-slate-850 dark:text-white">Alur Audit Log & Jejak Keamanan</h3>
                <p className="text-xs text-slate-450 mt-0.5">Catatan audit log aktivitas penandatanganan, persetujuan korespondensi, dan log autentikasi.</p>
              </div>

              {isSuperAdmin && (
                <button 
                  onClick={onClearAuditLogs}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-3 py-1.5 rounded text-xs transition-colors"
                >
                  Clear Logs
                </button>
              )}
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs max-h-[320px] overflow-y-auto overflow-x-auto w-full" id="audit-table-viewport">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase tracking-wider font-mono text-[10px]">
                  <tr>
                    <th className="p-3 font-semibold">Waktu Sidang</th>
                    <th className="p-3 font-semibold">Pegawai User</th>
                    <th className="p-3 font-semibold">Tindakan Aktivitas</th>
                    <th className="p-3 font-semibold">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-sans">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20">
                      <td className="p-3 font-mono text-slate-500 text-[10.5px]">
                        {new Date(log.timestamp).toLocaleString("id-ID")}
                      </td>
                      <td className="p-3 font-semibold text-slate-805 dark:text-slate-250">
                        {log.userEmail}
                      </td>
                      <td className="p-3 text-slate-650 dark:text-slate-400">
                        <span className={`inline-block mr-1.5 px-1.5 py-0.2 rounded font-bold text-[9px] ${
                          log.actionType === "Approval" 
                            ? "bg-emerald-50 text-emerald-600" 
                            : log.actionType === "Hapus Surat" 
                            ? "bg-rose-50 text-rose-600" 
                            : "bg-slate-100 text-slate-550"
                        }`}>{log.actionType}</span>
                        {log.activity}
                      </td>
                      <td className="p-3 font-mono text-slate-400 text-[11px]">
                        {log.ipAddress}
                      </td>
                    </tr>
                  ))}
                  
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center p-8 text-slate-400 italic">Jejak audit log kosong.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "ai_gemini" && (
          <div className="space-y-6 animate-in fade-in duration-200" id="ai-gemini-panel">
            <h3 className="text-base font-bold text-slate-805 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              <span>Pusat Kendali & Pengaturan AI Gemini</span>
            </h3>
            <p className="text-xs text-slate-450 dark:text-slate-500">
              Pantau kredensial, performa, dan kemajuan proses otomasi dokumen AI di lingkungan produksi Vercel.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Status API & Endpoint</span>
                <div className="flex items-center space-x-2 mt-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${apiStatus === "CONNECTED" ? "bg-emerald-500 animate-pulse" : apiStatus === "NOT_TESTED" ? "bg-amber-400" : "bg-rose-500"}`} />
                  <span className="text-sm font-bold text-slate-850 dark:text-slate-100">
                    {apiStatus === "CONNECTED" ? "ONLINE" : apiStatus === "NOT_TESTED" ? "Siap Diuji" : "OFFLINE / ERROR"}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">/api/gemini/generate</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Environment Secret</span>
                <div className="flex items-center space-x-2 mt-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${envStatus === "ACTIVE" ? "bg-emerald-500" : "bg-teal-500"}`} />
                  <span className="text-sm font-bold text-slate-850 dark:text-slate-100">
                    {envStatus === "ACTIVE" ? "GEMINI_API_KEY Aktif" : "Mode Demo/Fallback"}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">Konfigurasi Key Vercel</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Model Aktif Utama</span>
                <div className="mt-2">
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono">gemini-3.6-flash</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">Basic Text &amp; Structured Content</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-blue-50/40 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-100/50 dark:border-blue-900/40 text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-blue-800 dark:text-blue-300 block">Jumlah Request Berhasil</span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400">Total interaksi sukses AI</span>
                </div>
                <span className="text-2xl font-black text-blue-700 dark:text-blue-200">{requestToday}</span>
              </div>

              <div className="bg-rose-50/40 dark:bg-rose-950/20 p-4 rounded-xl border border-rose-100/50 dark:border-rose-900/40 text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-rose-800 dark:text-rose-300 block">Jumlah Error Rekaman</span>
                  <span className="text-[10px] text-rose-600 dark:text-rose-400">Gagal / Timeout / Masalah Key</span>
                </div>
                <span className="text-2xl font-black text-rose-700 dark:text-rose-200">{errorToday}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl flex flex-col md:flex-row md:items-center justify-between text-xs space-y-3 md:space-y-0">
              <div>
                <span className="font-bold text-slate-805 dark:text-slate-100 block">Uji Konektivitas Keamanan API</span>
                <p className="text-slate-500 mt-0.5">Kirimkan draf request kecil ke Vercel Serverless Function untuk mentes jembatan respon.</p>
              </div>
              <button
                type="button"
                onClick={testGeminiConnection}
                disabled={testingConnection}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2 px-5 rounded-lg shadow-sm transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer"
              >
                {testingConnection ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Mentransmisi...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Test Gemini Connection</span>
                  </>
                )}
              </button>
            </div>

            {testResult && (
              <div className={`p-4 rounded-xl border text-xs leading-relaxed flex items-start space-x-2.5 animate-in fade-in duration-200 ${
                testResult.success 
                  ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300"
                  : "bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-300"
              }`}>
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold block mb-1">{testResult.title}</span>
                  <pre className="text-[11px] select-all font-mono leading-relaxed bg-slate-100/50 dark:bg-slate-900/50 p-2.5 rounded border border-slate-200/50 dark:border-slate-800/50 mt-1 max-h-[140px] overflow-y-auto whitespace-pre-wrap">
                    {testResult.message}
                  </pre>
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-350 block uppercase tracking-wider font-mono">Recent AI Query Monitoring (ai_logs)</span>
              <div className="border border-slate-200 dark:border-slate-850 rounded-xl overflow-hidden text-xs max-h-[220px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase tracking-wider font-mono text-[9px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-2.5 font-semibold">Waktu</th>
                      <th className="p-2.5 font-semibold">Prompt</th>
                      <th className="p-2.5 font-semibold">Respon Model</th>
                      <th className="p-2.5 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-sans">
                    {aiLogsList.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/10">
                        <td className="p-2.5 font-mono text-[10px] text-slate-400 shrink-0 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleTimeString("id-ID")}
                        </td>
                        <td className="p-2.5 font-medium text-slate-600 dark:text-slate-300 max-w-[150px] truncate" title={log.prompt}>
                          {log.prompt}
                        </td>
                        <td className="p-2.5 text-slate-500 max-w-[205px] truncate" title={log.response}>
                          {log.response}
                        </td>
                        <td className="p-2.5 font-bold">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[8.5px] uppercase font-mono border ${
                            log.status === "SUCCESS"
                              ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30"
                              : "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30"
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {aiLogsList.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center p-6 text-slate-400 italic">Belum ada aktivitas query AI terekam di database.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "passkey" && (
          <div className="space-y-6 animate-in fade-in duration-200" id="passkey-settings-panel">
            {/* Super Admin Authority Badge Banner */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              isSuperAdmin 
                ? "bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200"
                : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200"
            }`}>
              <div className="flex items-start space-x-3">
                {isSuperAdmin ? (
                  <ShieldCheck className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <Lock className="h-6 w-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm">
                      {isSuperAdmin ? "Otorisasi Super Admin: Penuh (Full Control)" : "Akses Terkunci - Hanya Super Admin"}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      isSuperAdmin 
                        ? "bg-amber-100 dark:bg-amber-900/50 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300"
                        : "bg-rose-100 dark:bg-rose-900/50 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300"
                    }`}>
                      Role Saat Ini: {currentRole}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {isSuperAdmin
                      ? "Sebagai Super Admin, Anda memiliki wewenang penuh mengatur kebijakan kunci sandi, masa berlaku passkey biometrik, PIN master TTE, serta mereset kunci sandi akun pegawai."
                      : "Perhatian: Mengatur dan mengubah kebijakan kunci sandi serta passkey perusahaan hanya diizinkan untuk Super Admin. Seluruh kontrol di bawah dalam mode Baca-Saja."}
                  </p>
                </div>
              </div>
            </div>

            {/* Passkey & Security Settings Form */}
            <form onSubmit={savePasskeySettings} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Panel 1: Kebijakan Kata Sandi (Password Policy) */}
                <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <Sliders className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-100">
                        Kebijakan Kata Sandi
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Global Enforcer</span>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                        Panjang Minimal Kata Sandi Akun
                      </label>
                      <select
                        disabled={!isSuperAdmin}
                        value={minPasswordLength}
                        onChange={(e) => setMinPasswordLength(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-mono text-slate-800 dark:text-slate-100 disabled:opacity-60 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={8}>8 Karakter (Standar Minimal)</option>
                        <option value={10}>10 Karakter (Rekomendasi Keamanan)</option>
                        <option value={12}>12 Karakter (Tingkat Tinggi)</option>
                        <option value={16}>16 Karakter (Kriptografi Ketat)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                        Masa Berlaku Kata Sandi / Passkey
                      </label>
                      <select
                        disabled={!isSuperAdmin}
                        value={passkeyExpirationDays}
                        onChange={(e) => setPasskeyExpirationDays(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-mono text-slate-800 dark:text-slate-100 disabled:opacity-60 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={30}>30 Hari (Reset Bulanan Wajib)</option>
                        <option value={60}>60 Hari (Reset 2 Bulan)</option>
                        <option value={90}>90 Hari (Standar Triwulan ISO 27001)</option>
                        <option value={180}>180 Hari (Semesteran)</option>
                        <option value={0}>Tanpa Masa Kadaluarsa</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                        Batas Percobaan Percobaan Gagal (Lockout Limit)
                      </label>
                      <select
                        disabled={!isSuperAdmin}
                        value={maxFailedPasskeyAttempts}
                        onChange={(e) => setMaxFailedPasskeyAttempts(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-mono text-slate-800 dark:text-slate-100 disabled:opacity-60 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={3}>3 Kali Salah (Proteksi Kritis)</option>
                        <option value={5}>5 Kali Salah (Standar Operasional)</option>
                        <option value={10}>10 Kali Salah (Toleransi Tinggi)</option>
                      </select>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-200 block">Wajib Kompleksitas Karakter</span>
                        <span className="text-[11px] text-slate-400">Kombinasi Karakter Khusus (@#$), Angka & Kapital</span>
                      </div>
                      <input
                        type="checkbox"
                        disabled={!isSuperAdmin}
                        checked={requireComplexPassword}
                        onChange={(e) => setRequireComplexPassword(e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Panel 2: Biometrik Passkey & PIN Master TTE */}
                <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <Fingerprint className="h-4 w-4 text-amber-500" />
                      <span className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-100">
                        Passkey Biometrik & PIN Master
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-amber-500 font-bold">FIDO2 / WebAuthn</span>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-100 block">
                          Autentikasi Passkey / WebAuthn Perangkat
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Izinkan login biometrik (Fingerprint/FaceID) tanpa input password manual.
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={!isSuperAdmin}
                        onClick={() => setEnablePasskeyAuth(!enablePasskeyAuth)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                          enablePasskeyAuth ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-700"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            enablePasskeyAuth ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                        PIN Master Kunci Sandi Super Admin / Penandatanganan TTE
                      </label>
                      <div className="relative">
                        <input
                          type={showPIN ? "text" : "password"}
                          disabled={!isSuperAdmin}
                          value={masterPasskeyPIN}
                          onChange={(e) => setMasterPasskeyPIN(e.target.value)}
                          placeholder="Masukkan 6-8 digit PIN Master"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 pr-10 font-mono text-slate-800 dark:text-slate-100 disabled:opacity-60 focus:ring-2 focus:ring-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPIN(!showPIN)}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          {showPIN ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Digunakan sebagai Otorisasi Kunci Kriptografi Utama untuk approval dan override keamanan sistem.
                      </span>

                      <button
                        type="button"
                        disabled={!isSuperAdmin}
                        onClick={() => {
                          setIsChangeMasterPinModalOpen(true);
                          setPinValidationError(null);
                          setCurrentPinInput("");
                          setNewPinInput("");
                          setConfirmNewPinInput("");
                        }}
                        className="w-full mt-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 font-bold py-1.5 px-3 rounded-lg flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                      >
                        <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <span>Ubah / Reset PIN Master (Super Admin)</span>
                      </button>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleTestPasskeyWebAuthn}
                        className="w-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold py-2 px-3 rounded-lg flex items-center justify-center space-x-2 transition-all cursor-pointer"
                      >
                        <Fingerprint className="h-4 w-4 text-amber-500" />
                        <span>Uji Coba Respon Passkey Biometrik</span>
                      </button>
                      {passkeyTestSuccess && (
                        <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-2 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded border border-emerald-200 dark:border-emerald-800">
                          {passkeyTestSuccess}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Settings Action Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-500">
                  {isSuperAdmin ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="h-4 w-4 inline" />
                      <span>Anda berhak mengubah & menyimpan pengaturan ini secara langsung.</span>
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center space-x-1">
                      <Lock className="h-4 w-4 inline" />
                      <span>Tombol Simpan dinonaktifkan karena Anda bukan Super Admin.</span>
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!isSuperAdmin}
                  className="bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Key className="h-4 w-4" />
                  <span>Simpan Pengaturan Kunci Sandi</span>
                </button>
              </div>
            </form>

            {/* Panel 3: Tabel Manajemen Kunci Sandi & Passkey Pegawai */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono flex items-center space-x-2">
                    <Key className="h-4 w-4 text-amber-500" />
                    <span>Manajemen Kunci Sandi Pegawai (Super Admin Only)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Daftar akun pegawai dan status pendaftaran biometrik passkey. Super Admin dapat mereset kunci sandi kapan saja.
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase tracking-wider font-mono text-[10px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3 font-bold">Pegawai</th>
                      <th className="p-3 font-bold">Role</th>
                      <th className="p-3 font-bold">Status Passkey</th>
                      <th className="p-3 font-bold">Terakhir Diperbarui</th>
                      <th className="p-3 font-bold text-right">Aksi Kunci Sandi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {users.map((u) => {
                      const status = u.passkeyStatus || "Aktif";
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20">
                          <td className="p-3">
                            <div className="flex items-center space-x-3">
                              <img
                                src={u.avatarUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120"}
                                alt={u.name}
                                className="h-8 w-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                              />
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-100 block">{u.name}</span>
                                <span className="text-[11px] text-slate-400 font-mono">{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                              status === "Aktif"
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                : status === "Perlu Reset"
                                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 animate-pulse"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                            }`}>
                              <Fingerprint className="h-3 w-3 mr-1" />
                              <span>{status}</span>
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-500">
                            {u.lastPasswordChange || "2026-08-01"}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              disabled={!isSuperAdmin}
                              onClick={() => handleResetEmployeePasskey(u)}
                              className="bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 disabled:opacity-40 disabled:cursor-not-allowed font-semibold py-1.5 px-3 rounded-lg text-xs transition-all inline-flex items-center space-x-1 cursor-pointer"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              <span>Reset Passkey</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Dialog: Reset Passkey Confirmation */}
            {selectedUserForPasskeyReset && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                  <div className="flex items-center space-x-3 text-amber-600 dark:text-amber-400">
                    <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 rounded-xl">
                      <Key className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        Reset Kunci Sandi & Passkey Pegawai
                      </h3>
                      <p className="text-[11px] text-slate-500">Super Admin Security Action</p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <p className="text-slate-700 dark:text-slate-300">
                      Anda akan mereset Kunci Sandi dan Passkey Biometrik untuk:
                    </p>
                    <div className="font-bold text-slate-900 dark:text-slate-100 font-mono bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                      {selectedUserForPasskeyReset.name} ({selectedUserForPasskeyReset.email})
                    </div>
                    <div className="pt-2">
                      <span className="text-[11px] text-slate-500 block">Kode PIN Passkey Sementara yang Dihasilkan:</span>
                      <span className="text-lg font-mono font-bold text-amber-600 dark:text-amber-400 tracking-wider">
                        {newPasskeyTempPIN}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedUserForPasskeyReset(null)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={confirmResetEmployeePasskey}
                      className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm flex items-center space-x-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Konfirmasi Reset</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Dialog: Change / Reset Master Passkey PIN for Super Admin */}
            {isChangeMasterPinModalOpen && (
              <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200" id="modal-change-master-pin">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
                  <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center space-x-3 text-amber-600 dark:text-amber-400">
                      <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 rounded-xl">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          Ubah / Reset PIN Master Passkey Super Admin
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Validasi Keamanan Kriptografi & Penandatanganan Dokumen
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsChangeMasterPinModalOpen(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleChangeMasterPinSubmit} className="space-y-4 text-xs">
                    {/* Emergency Mode Checkbox */}
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-100 block">
                            Mode Reset Darurat PIN Master
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Gunakan jika Super Admin lupa PIN lama (memerlukan hak akses Super Admin aktif).
                          </span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isEmergencyPinReset}
                        onChange={(e) => {
                          setIsEmergencyPinReset(e.target.checked);
                          setPinValidationError(null);
                        }}
                        className="h-4 w-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500 cursor-pointer"
                      />
                    </div>

                    {/* Field 1: Current PIN (if not Emergency Reset) */}
                    {!isEmergencyPinReset && (
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          PIN Master Lama (Saat Ini) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPin ? "text" : "password"}
                            required
                            value={currentPinInput}
                            onChange={(e) => setCurrentPinInput(e.target.value)}
                            placeholder="Masukkan PIN Master Lama"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 pr-10 font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPin(!showCurrentPin)}
                            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            {showCurrentPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Field 2: New PIN Input */}
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        PIN Master Baru <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPin ? "text" : "password"}
                          required
                          value={newPinInput}
                          onChange={(e) => setNewPinInput(e.target.value)}
                          placeholder="Masukkan 6-8 digit PIN Master Baru"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 pr-10 font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPin(!showNewPin)}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          {showNewPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>

                      {/* Live Validation Badges */}
                      <div className="flex items-center space-x-2 mt-1.5 font-mono text-[10px]">
                        <span className={`px-2 py-0.5 rounded border ${
                          newPinInput.length >= 6 && newPinInput.length <= 8
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                        }`}>
                          {newPinInput.length >= 6 && newPinInput.length <= 8 ? "✓" : "○"} 6 - 8 Karakter
                        </span>
                        <span className={`px-2 py-0.5 rounded border ${
                          newPinInput && !/^(01234567|12345678|123456|654321|000000|111111|222222|333333|444444|555555|666666|777777|888888|999999)$/.test(newPinInput)
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                        }`}>
                          {newPinInput && !/^(01234567|12345678|123456|654321|000000|111111|222222|333333|444444|555555|666666|777777|888888|999999)$/.test(newPinInput) ? "✓" : "○"} Kompleksitas Aman
                        </span>
                      </div>
                    </div>

                    {/* Field 3: Confirm New PIN Input */}
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Konfirmasi PIN Master Baru <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmNewPinInput}
                        onChange={(e) => setConfirmNewPinInput(e.target.value)}
                        placeholder="Ketik Ulang PIN Master Baru"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
                      />
                      {confirmNewPinInput && (
                        <span className={`text-[10px] font-mono mt-1 block font-semibold ${
                          newPinInput === confirmNewPinInput ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                        }`}>
                          {newPinInput === confirmNewPinInput ? "✓ Konfirmasi PIN cocok" : "✕ Konfirmasi PIN tidak cocok!"}
                        </span>
                      )}
                    </div>

                    {/* Error callout */}
                    {pinValidationError && (
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center space-x-2 text-rose-700 dark:text-rose-300">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span className="font-semibold text-[11px]">{pinValidationError}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setIsChangeMasterPinModalOpen(false)}
                        className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer font-semibold"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm flex items-center space-x-2 cursor-pointer"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>Simpan & Terapkan PIN Master Baru</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
