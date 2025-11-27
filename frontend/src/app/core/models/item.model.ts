import { UserBadge } from './user.model';

// Item status
export type ItemStatus = 'lost' | 'found' | 'claimed';

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

// Main Item interface
export interface Item {
  id: string;
  title: string;
  description: string;
  category: ItemCategory;
  status: ItemStatus;
  imageUrl?: string;
  date: string;        // Tanggal hilang/ditemukan
  time?: string;       // Jam hilang/ditemukan
  location: ItemLocation | string;  // Support both formats
  
  // Reporter info
  reporterId: string;
  reporterName: string;
  reporterBadge: UserBadge;
  reporterPhone?: string;
  
  // Lost item specific fields
  reward?: boolean;           // Tawarkan imbalan?
  urgency?: UrgencyLevel;     // Tingkat urgensi
  
  // Found item specific fields
  storageLocation?: StorageLocation;  // Barang disimpan di mana
  entrustedTo?: string;               // Dititipkan ke siapa (jika storageLocation = 'entrusted')
  willingToDeliver?: boolean;         // Bersedia diantar?
  
  createdAt: Date;
  updatedAt?: Date;
}

// Category untuk filter
export interface Category {
  id: ItemCategory | 'all';
  label: string;
  icon: string;
}
