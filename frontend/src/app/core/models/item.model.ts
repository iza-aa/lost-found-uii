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
export interface AlternativeContact {
  instagram?: string;
  telegram?: string;
  line?: string;
  other?: string;
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
  
  // Found item specific fields
  storageLocation?: StorageLocation;  // Barang disimpan di mana
  entrustedTo?: string;               // Dititipkan ke siapa (jika storageLocation = 'entrusted')
  willingToDeliver?: boolean;         // DEPRECATED: replaced by willingToCod
  
  // QR Scan specific fields (NEW)
  isScannedByQr?: boolean;            // Item was reported via QR scan
  scannedQrOwnerId?: string;          // User ID of the QR owner (claimed owner)
  scannedQrOwnerName?: string;        // Name of the QR owner
  scannedQrOwnerPhone?: string;       // Phone of the QR owner (private, not exposed)
  
  createdAt: Date;
  updatedAt?: Date;
}

// Category untuk filter
export interface Category {
  id: ItemCategory | 'all';
  label: string;
  icon: string;
}
