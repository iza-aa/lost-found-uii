import { UserBadge } from './user.model';

// Item status - updated with resolved status
export type ItemStatus = 'lost' | 'found';

// Report status - active, claimed (for found items), resolved (for lost items)
export type ReportStatus = 'active' | 'claimed' | 'resolved';

// Item category
export type ItemCategory = 'bags' | 'wallet' | 'phone' | 'electronics' | 'documents' | 'keys' | 'clothing' | 'others';

// Urgency level untuk barang hilang
export type UrgencyLevel = 'normal' | 'important' | 'very-important';

// Storage location untuk barang ditemukan
export type StorageLocation = 'with-me' | 'entrusted';

// Location dengan koordinat untuk Leaflet
export interface ItemLocation {
  lat: number;
  lng: number;
  name: string;
}

// Alternative contact for user who doesn't want to expose phone
export type AlternativeContactType = 'instagram' | 'telegram' | 'line' | 'whatsapp_other' | 'email' | 'other';

// Single contact entry
export interface ContactEntry {
  type: AlternativeContactType;
  value: string;
}

export interface AlternativeContact {
  // New: Array of contacts
  contacts?: ContactEntry[];
  // Legacy single contact - for backward compatibility
  type?: AlternativeContactType;      // Dropdown selected type
  value?: string;                     // The contact value (username, number, etc)
  // Legacy fields - for backward compatibility
  instagram?: string;
  telegram?: string;
  line?: string;
  other?: string;
}

// Claimant status for verification flow
export type ClaimantStatus = 'pending' | 'approved' | 'rejected';

// Verification question for lost items and found items
export interface VerificationQuestion {
  id: string;
  question: string;
  answer?: string;        // The correct answer (only for found items, stored by finder)
  isRequired: boolean;
}

// Answer to verification question
export interface VerificationAnswer {
  questionId: string;
  question: string;
  answer: string;
}

// Claimant/Pemohon interface - untuk orang yang mengklaim barang (Found items)
export interface Claimant {
  id: string;                         // Unique ID for this claim
  claimerId: string;                  // User ID of the person claiming
  claimerName: string;                // Name of the claimant
  claimerBadge: UserBadge;           // Badge of the claimant
  claimerPhone?: string;              // Phone number (revealed after approval)
  description: string;                // Description/proof of ownership
  photoUrl?: string;                  // Photo evidence
  additionalContact?: AlternativeContact;  // Alternative contact info
  status: ClaimantStatus;             // pending | approved | rejected
  isQrVerified?: boolean;             // True if verified via QR scan
  rejectionReason?: string;           // Reason for rejection (if rejected)
  createdAt: Date;
  updatedAt?: Date;
}

// Finder interface - untuk orang yang mengaku menemukan barang (Lost items)
export interface Finder {
  id: string;                         // Unique ID for this finder claim
  finderId: string;                   // User ID of the person who found
  finderName: string;                 // Name of the finder
  finderBadge: UserBadge;            // Badge of the finder
  finderPhone?: string;               // Phone number (revealed after approval)
  answers: VerificationAnswer[];      // Answers to verification questions
  photoUrl?: string;                  // Photo evidence (optional)
  additionalContact?: AlternativeContact;  // Alternative contact info
  status: ClaimantStatus;             // pending | approved | rejected
  rejectionReason?: string;           // Reason for rejection (if rejected)
  createdAt: Date;
  updatedAt?: Date;
}

// Main Item interface
export interface Item {
  id: string;
  title: string;
  description: string;
  category: ItemCategory;
  status: ItemStatus;
  reportStatus: ReportStatus;     // NEW: Track if report is active/claimed/resolved
  imageUrl?: string;
  date: string;        // Tanggal hilang/ditemukan
  time?: string;       // Jam hilang/ditemukan
  location: ItemLocation | string;  // Support both formats

  // Reporter info
  reporterId: string;
  reporterName: string;
  reporterBadge: UserBadge;
  reporterPhone?: string;

  // Privacy & Contact settings (NEW)
  exposePhone?: boolean;                  // Mau ekspos no WA? (for lost items)
  alternativeContact?: AlternativeContact; // Kontak alternatif jika tidak ekspos phone
  willingToCod?: boolean;                 // Bersedia COD di tengah/kampus dengan pengawasan

  // Lost item specific fields
  reward?: boolean;           // Tawarkan imbalan?
  urgency?: UrgencyLevel;     // Tingkat urgensi
  verificationQuestions?: VerificationQuestion[];  // Pertanyaan verifikasi untuk penemu

  // Found item specific fields
  storageLocation?: StorageLocation;  // Barang disimpan di mana
  entrustedTo?: string;               // Dititipkan ke siapa (jika storageLocation = 'entrusted')
  willingToDeliver?: boolean;         // DEPRECATED: replaced by willingToCod

  // QR Scan specific fields (NEW)
  isScannedByQr?: boolean;            // Item was reported via QR scan
  scannedQrOwnerId?: string;          // User ID of the QR owner (claimed owner)
  scannedQrOwnerName?: string;        // Name of the QR owner
  scannedQrOwnerPhone?: string;       // Phone of the QR owner (private, not exposed)

  // Claimants/Pemohon (NEW) - List of people claiming this item
  claimants?: Claimant[];             // Array of claimants for found items

  // Finders (NEW) - List of people who claim to have found this lost item
  finders?: Finder[];                 // Array of finders for lost items

  createdAt: Date;
  updatedAt?: Date;
}

// Category untuk filter
export interface Category {
  id: ItemCategory | 'all';
  label: string;
  icon: string;
}
