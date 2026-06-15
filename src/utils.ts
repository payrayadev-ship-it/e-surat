import { LetterIn, LetterOut, Memo, Meeting, CompanySetting, AuditLog, Disposition } from "./types";

/**
 * Procedural Vector QR Code (matrix) generator.
 * Creates an elegant corporate-grade 2D vector puzzle grid block dynamically using simple modulo hashing,
 * ensuring clean SVG-rendering without slow package load times.
 */
export function generateVerificationQR(code: string, width = 120, height = 120): string {
  // Simple deterministic pseudo-random matrix based on code hash
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash);
  }

  const size = 15; // 15x15 matrix grid
  const pad = 2; // grid cell padding
  const rects: string[] = [];

  // Corner timing synchronization anchors (standard QR markers)
  const isPosAnchor = (r: number, c: number) => {
    if (r < 4 && c < 4) return true; // Top Left
    if (r < 4 && c >= size - 4) return true; // Top Right
    if (r >= size - 4 && c < 4) return true; // Bottom Left
    return false;
  };

  const isPosAnchorBorder = (r: number, c: number) => {
    // Hollow inner timing pattern
    if ((r === 1 || r === 2) && (c === 1 || c === 2)) return false;
    if ((r === 1 || r === 2) && (c === size - 2 || c === size - 3)) return false;
    if ((r === size - 2 || r === size - 3) && (c === 1 || c === 2)) return false;
    return isPosAnchor(r, c);
  };

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      let active = false;

      if (isPosAnchor(r, c)) {
        active = isPosAnchorBorder(r, c);
      } else {
        // Deterministic high-density noise
        const cellHash = Math.abs(Math.sin(hash + r * 17 + c * 31));
        active = cellHash > 0.45;
      }

      if (active) {
        const x = (c / size) * width;
        const y = (r / size) * height;
        const cellW = width / size - pad;
        const cellH = height / size - pad;
        rects.push(`<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" fill="currentColor" rx="1" />`);
      }
    }
  }

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-slate-800">
      <rect width="${width}" height="${height}" rx="6" fill="#F8FAFC" />
      <g transform="translate(4,4) scale(0.93)">
        ${rects.join("\n")}
      </g>
    </svg>
  `;
}

/**
 * Automates corporate registration numbers.
 * Format e.g., SPD/2026/06/0001
 */
export function generateLetterNumber(index: number, setting: CompanySetting): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const sequential = String(index + 1).padStart(4, "0");

  let format = setting.letterNumberFormat || "SPD/YYYY/MM/[SEQ]";
  return format
    .replace("YYYY", String(year))
    .replace("MM", month)
    .replace("[SEQ]", sequential);
}

/**
 * Injects contextual variables into document templates.
 */
export function injectTemplateVariables(template: string, vars: {
  nomor_surat: string;
  tanggal: string;
  nama_penerima: string;
  alamat: string;
  jabatan: string;
  perihal: string;
  nama_direktur: string;
}): string {
  let output = template;
  output = output.replace(/\{\{nomor_surat\}\}/g, vars.nomor_surat || "[Nomor Surat]");
  output = output.replace(/\{\{tanggal\}\}/g, vars.tanggal || "[Tanggal]");
  output = output.replace(/\{\{nama_penerima\}\}/g, vars.nama_penerima || "[Nama Penerima]");
  output = output.replace(/\{\{alamat\}\}/g, vars.alamat || "[Alamat Penerima]");
  output = output.replace(/\{\{jabatan\}\}/g, vars.jabatan || "[Jabatan Penerima]");
  output = output.replace(/\{\{perihal\}\}/g, vars.perihal || "[Perihal]");
  output = output.replace(/\{\{nama_direktur\}\}/g, vars.nama_direktur || "[Nama Penandatangan]");
  return output;
}

/**
 * Hardcoded initial mock seeds for fallback and direct demonstration,
 * guaranteeing offline robustness.
 */
export const seedCompanySetting: CompanySetting = {
  id: "company_setting_default",
  companyName: "PT FORSDIG TEKNOLOGI INDONESIA",
  companyAddress: "Maspion Plaza Lt. 18, Jl. Gunung Sahari No.18, Jakarta Utara, 14420",
  companyEmail: "office@forsdig-teknologi.com",
  companyPhone: "+62 21-5099-8800",
  letterNumberFormat: "FORSDIG/YYYY/MM/[SEQ]",
  smtpHost: "smtp.forsdig-teknologi.com",
  smtpPort: 587,
  smtpUser: "notifications@forsdig-teknologi.com"
};

export const seedUsers = [
  { id: "user_dir", name: "Ir. Joko Sutrisno, M.T.", email: "joko.sutrisno@forsdig.com", role: "Direktur", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
  { id: "user_mng", name: "Dewi Lestari, S.E.", email: "dewi.lestari@forsdig.com", role: "Manager", avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150" },
  { id: "user_adm", name: "Andi Wijaya", email: "payrayadev@gmail.com", role: "Super Admin", avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150" },
  { id: "user_stf", name: "Budi Pratama", email: "budi.pratama@forsdig.com", role: "Staff", avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150" },
  { id: "user_vwr", name: "Siti Rahma", email: "siti@forsdig.com", role: "Viewer", avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150" }
];

export const seedLettersIn: LetterIn[] = [
  {
    id: "in_001",
    agendaNumber: "001/A-SM/VI/2026",
    letterNumber: "102/KEMENKES/V/2026",
    letterDate: "2026-05-18",
    receivedDate: "2026-06-02",
    sender: "dr. Budi Gunadi Sadikin, CHFC, CLU",
    senderInstitution: "Kementerian Kesehatan RI",
    subject: "Himbauan Vaksinasi Booster Karyawan Swasta Tahap II",
    category: "Legal",
    urgency: "Penting",
    attachmentName: "Surat_Edaran_Vaksinasi.pdf",
    status: "Didisposisi",
    createdBy: "Andi Wijaya",
    createdAt: "2026-06-02T10:00:00Z"
  },
  {
    id: "in_002",
    agendaNumber: "002/A-SM/VI/2026",
    letterNumber: "FIN-99/BANK-MDR/2026",
    letterDate: "2026-06-10",
    receivedDate: "2026-06-12",
    sender: "Sandiaga Uno, M.B.A.",
    senderInstitution: "PT Bank Mandiri (Persero) Tbk",
    subject: "Penawaran Pembiayaan Ekspansi Kredit Corporate",
    category: "Keuangan",
    urgency: "Biasa",
    attachmentName: "Katalog_Kredit.xlsx",
    status: "Baru",
    createdBy: "Andi Wijaya",
    createdAt: "2026-06-12T09:12:00Z"
  },
  {
    id: "in_003",
    agendaNumber: "003/A-SM/VI/2026",
    letterNumber: "SRT/LEG/V/204",
    letterDate: "2026-06-14",
    receivedDate: "2026-06-15",
    sender: "Prof. Dr. Mahfud MD",
    senderInstitution: "Kadin Indonesia",
    subject: "Undangan Rapat Evaluasi Aturan Pajak Perusahaan",
    category: "Legal",
    urgency: "Sangat Rahasia",
    attachmentName: "Undangan_Rapat.docx",
    status: "Selesai",
    createdBy: "Andi Wijaya",
    createdAt: "2026-06-15T08:30:00Z"
  }
];

export const seedLettersOut: LetterOut[] = [
  {
    id: "out_001",
    letterNumber: "FORSDIG/2026/06/0001",
    letterDate: "2026-06-15",
    recipient: "Ibu Sri Mulyani, S.E., M.Sc.",
    recipientInstitution: "Kementerian Keuangan RI",
    subject: "Surat Penawaran Jasa Sistem ERP Digitalisasi Office",
    content: "Dengan hormat,\n\nSehubungan dengan upaya modernisasi tata kelola administrasi pemerintahan, kami dari PT FORSDIG TEKNOLOGI INDONESIA bermaksud untuk menawarkan solusi Sistem ERP FORSDIG OFFICE.\n\nSistem e-Office yang kami kembangkan dirancang khusus untuk memotong waktu pemrosesan agenda surat masuk, disposisi instan, dan penandatanganan digital berbasis QR verifikasi secara otomatis. Kami siap mendemonstrasikan sistem ini di hadapan tim IT Kementerian.\n\nHormat kami,\nPT FORSDIG TEKNOLOGI INDONESIA",
    status: "Terkirim",
    signatureEnabled: true,
    verificationCode: "DOC-20260615-001",
    signatory: "Ir. Joko Sutrisno, M.T.",
    draftBy: "Andi Wijaya",
    createdAt: "2026-06-15T07:45:00Z",
    approvalHistory: [
      { role: "Staff", user: "Budi Pratama", action: "Draft Surat Keluar", timestamp: "2026-06-15T06:00:00Z" },
      { role: "Manager", user: "Dewi Lestari, S.E.", action: "Review & Setujui", note: "Format teks sudah rapi, silakan ke Direktur", timestamp: "2026-06-15T07:00:00Z" },
      { role: "Direktur", user: "Ir. Joko Sutrisno, M.T.", action: "Tanda Tangan & Approve", note: "Sangat baik, kirim segera hari ini", timestamp: "2026-06-15T07:45:00Z" }
    ]
  },
  {
    id: "out_002",
    letterNumber: "FORSDIG/2026/06/0002",
    letterDate: "2026-06-15",
    recipient: "PT Maju Mundur Sentosa",
    recipientInstitution: "Direktur Pengadaan",
    subject: "Surat Perjanjian Kerja Sama Kemitraan Strategis Cloud",
    content: "Dengan hormat,\n\nSebagai kelanjutan dari nota kesepahaman (MoU) yang ditandatangani bulan lalu, melalui surat ini kami menyampaikan draf final hak dan kewajiban masing-masing pihak dalam penyediaan layanan cloud computing.\n\nFORSDIG bertindak sebagai integrator sistem dan penjamin SLA (Service Level Agreement) infrastruktur.\n\nAtas perhatian kawan-kawan, kami mengucapkan terima kasih.",
    status: "Review",
    signatureEnabled: false,
    verificationCode: "DOC-20260615-002",
    signatory: "Ir. Joko Sutrisno, M.T.",
    draftBy: "Budi Pratama",
    createdAt: "2026-06-15T08:00:00Z",
    approvalHistory: [
      { role: "Staff", user: "Budi Pratama", action: "Draft Surat Keluar", timestamp: "2026-06-15T08:00:00Z" }
    ]
  }
];

export const seedDispositions: Disposition[] = [
  {
    id: "disp_001",
    letterId: "in_001",
    letterSubject: "Himbauan Vaksinasi Booster Karyawan Swasta Tahap II",
    notes: "Tolong koordinasikan dengan divisi Personalia/HRD segera untuk jadwalkan pelaksanaan.",
    priority: "Mendesak",
    targetRole: "Manager",
    senderId: "user_dir",
    senderName: "Ir. Joko Sutrisno, M.T.",
    status: "Terkirim",
    createdAt: "2026-06-15T05:45:00Z"
  }
];

export const seedMemos: Memo[] = [
  {
    id: "memo_001",
    memoNumber: "MEMO-01/IT/FORSDIG/VI/2026",
    senderId: "user_mng",
    senderName: "Dewi Lestari, S.E.",
    recipientRole: "Staff",
    subject: "Pembaruan Patch Keamanan Sistem e-Office Intranet",
    content: "Diberitahukan kepada seluruh tim operasional IT dan administrasi bahwa pemeliharaan server database Firestore akan dilakukan malam ini pukul 22:00 WIB. Harap simpan draf pekerjaan Anda sebelum jam tersebut.",
    status: "Terkirim",
    createdAt: "2026-06-15T04:20:00Z"
  }
];

export const seedMeetings: Meeting[] = [
  {
    id: "meet_001",
    title: "Rapat Koordinasi Evaluasi Aplikasi FORSDIG Office",
    date: "2026-06-15",
    time: "09:00 - 11:30 WIB",
    attendees: "Ir. Joko Sutrisno, M.T., Dewi Lestari, S.E., Andi Wijaya, Budi Pratama",
    agenda: "Keamanan database, validasi tanda tangan elektronik QR, integrasi draf asisten AI.",
    results: "1. Modul AI Generator diintegrasikan ke asisten backend.\n2. Alur approval 4-step divalidasi.\n3. Desain UI disepakati menggunakan warna biru korporat profesional.",
    actions: "- Budi Pratama memperbarui format nomor surat otomatis.\n- Andi Wijaya memastikan rule keamanan terdeploy di cloud run.",
    status: "Selesai",
    createdAt: "2026-06-15T02:00:00Z"
  }
];

export const seedAuditLogs: AuditLog[] = [
  {
    id: "audit_001",
    userId: "user_adm",
    userEmail: "payrayadev@gmail.com",
    activity: "Login berhasil ke sistem administrasi FORSDIG Office",
    actionType: "Login",
    ipAddress: "192.168.1.100",
    timestamp: "2026-06-15T05:10:00Z"
  },
  {
    id: "audit_002",
    userId: "user_dir",
    userEmail: "joko.sutrisno@forsdig.com",
    activity: "Memberikan disposisi 'Mendesak' untuk surat agenda Kemenkes",
    actionType: "Approval",
    ipAddress: "192.168.1.18",
    timestamp: "2026-06-15T05:46:00Z"
  }
];
