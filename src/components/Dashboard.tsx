import React, { useState } from "react";
import { Mail, MailOpen, AlertCircle, FileText, Send, Clock, UserCheck, ShieldAlert } from "lucide-react";
import { LetterIn, LetterOut, Disposition, AuditLog } from "../types";

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

  return (
    <div className="space-y-6" id="dashboard-container">
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
