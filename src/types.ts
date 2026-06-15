export type UserRole = "Super Admin" | "Direktur" | "Manager" | "Staff" | "Viewer";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  signatureUrl?: string; // Base64 PNG signature
  createdAt?: string;
}

export interface LetterIn {
  id: string;
  agendaNumber: string;
  letterNumber: string;
  letterDate: string;
  receivedDate: string;
  sender: string;
  senderInstitution: string;
  subject: string;
  category: string; // e.g. Legal, Keuangan, HRD, Memo, dll.
  urgency: "Biasa" | "Penting" | "Rahasia" | "Sangat Rahasia";
  attachmentName?: string;
  attachmentUrl?: string;
  status: "Baru" | "Diproses" | "Didisposisi" | "Selesai";
  createdBy: string;
  createdAt: string;
  dispositions?: Disposition[];
}

export interface LetterOut {
  id: string;
  letterNumber: string;
  letterDate: string;
  recipient: string;
  recipientInstitution: string;
  subject: string;
  content: string;
  status: "Draft" | "Review" | "Approved Manager" | "Approved Direktur" | "Terkirim";
  signatureEnabled: boolean;
  signatureUrl?: string; // Base64 signature image
  signatureType?: "Canvas" | "QR"; // Type of e-signature used
  verificationCode: string; // DOC-YYYYMMDD-XXX
  signatory: string; // Name of person signing
  draftBy: string;
  createdAt: string;
  approvalHistory?: {
    role: UserRole;
    user: string;
    action: string; // Approved, Rejected, Edited, etc.
    note?: string;
    timestamp: string;
  }[];
}

export interface Disposition {
  id: string;
  letterId: string;
  letterSubject: string;
  notes: string;
  priority: "Rendah" | "Sedang" | "Tinggi" | "Mendesak";
  targetRole: string; // e.g., Manager, Supervisor, Staff, dll.
  senderId: string;
  senderName: string;
  status: string; // e.g., Sent, Read, Completed
  createdAt: string;
}

export interface Memo {
  id: string;
  memoNumber: string;
  senderId: string;
  senderName: string;
  recipientRole: string;
  subject: string;
  content: string;
  status: "Draft" | "Terkirim" | "Dibaca";
  createdAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  attendees: string;
  agenda: string;
  results: string;
  actions: string;
  status: "Direncanakan" | "Selesai";
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  activity: string;
  actionType: "Login" | "Logout" | "Tambah Surat" | "Edit Surat" | "Hapus Surat" | "Approval" | "Cetak Surat" | "Simpan Surat";
  ipAddress: string;
  timestamp: string;
}

export interface CompanySetting {
  id: string;
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
  letterNumberFormat: string; // e.g., SPD/YYYY/MM/[SEQ]
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
}
