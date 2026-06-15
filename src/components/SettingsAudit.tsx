import React, { useState } from "react";
import { Settings, Shield, Key, Mail, RefreshCw, Layers, Edit3, Trash, UserCheck, Smartphone } from "lucide-react";
import { CompanySetting, AuditLog, UserRole, UserProfile } from "../types";

interface SettingsAuditProps {
  companySetting: CompanySetting;
  auditLogs: AuditLog[];
  currentRole: UserRole;
  users: UserProfile[];
  onUpdateCompany: (setting: CompanySetting) => void;
  onClearAuditLogs: () => void;
}

export default function SettingsAudit({
  companySetting,
  auditLogs,
  currentRole,
  users,
  onUpdateCompany,
  onClearAuditLogs
}: SettingsAuditProps) {
  const [activeTab, setActiveTab] = useState<"general" | "smtp" | "audit" | "users">("general");

  // Form states - Company metadata
  const [companyName, setCompanyName] = useState(companySetting.companyName);
  const [companyAddress, setCompanyAddress] = useState(companySetting.companyAddress);
  const [companyPhone, setCompanyPhone] = useState(companySetting.companyPhone);
  const [companyEmail, setCompanyEmail] = useState(companySetting.companyEmail);
  const [numberFormat, setNumberFormat] = useState(companySetting.letterNumberFormat);

  // Form states - SMTP
  const [smtpHost, setSmtpHost] = useState(companySetting.smtpHost || "smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState(companySetting.smtpPort || 587);
  const [smtpUser, setSmtpUser] = useState(companySetting.smtpUser || "office@forsdig-office.co.id");

  const saveGeneralSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCompany({
      ...companySetting,
      companyName,
      companyAddress,
      companyPhone,
      companyEmail,
      letterNumberFormat: numberFormat
    });
    alert("Konfigurasi profil korporat PT FORSDIG OFFICE berhasil diperbarui!");
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
            onClick={() => setActiveTab("audit")}
            className={`w-full flex items-center space-x-2 p-2.5 rounded-lg text-xs font-semibold text-left transition-all ${
              activeTab === "audit" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
            id="tab-settings-audit"
          >
            <Shield className="h-4 w-4" />
            <span>Audit Trail & Security</span>
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
            <p className="text-xs text-slate-450 dark:text-slate-500">Sesuaikan metadata resmi PT untuk melengkapi draf KOP surat keluar otomatis.</p>

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
            <h3 className="text-base font-bold text-slate-805 dark:text-white border-b border-slate-100 pb-2">Direktori & Jabatan Pegawai</h3>
            <p className="text-xs text-slate-450 dark:text-slate-500">Daftar akun berwenang dalam menyusun, memeriksa, serta menandatangani surat dinas.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {users.map((u) => (
                <div key={u.id} className="flex items-center space-x-3 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-850 text-xs">
                  <img src={u.avatarUrl} alt={u.name} className="h-10 w-10 rounded-full object-cover border border-blue-100 shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-805 dark:text-white">{u.name}</h4>
                    <p className="font-medium text-slate-450 dark:text-slate-500 font-mono text-[10px] mt-0.5">{u.email}</p>
                    <span className="inline-block mt-1 font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded px-1.5 py-0.2 uppercase text-[9px] tracking-wide font-mono">{u.role}</span>
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

            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs max-h-[320px] overflow-y-auto" id="audit-table-viewport">
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
      </div>
    </div>
  );
}
