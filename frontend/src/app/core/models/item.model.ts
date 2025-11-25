// Item status
export type ItemStatus = 'lost' | 'found' | 'claimed';

// Item category
export type ItemCategory = 'bags' | 'wallet' | 'phone' | 'electronics' | 'documents' | 'keys' | 'clothing' | 'others';

// Main Item interface
export interface Item {
  id: string;
  title: string;
  description: string;
  category: ItemCategory;
  status: ItemStatus;
  imageUrl: string;
  date: string;        // Tanggal hilang/ditemukan
  time: string;        // Jam hilang/ditemukan
  location: string;    // Lokasi hilang/ditemukan
  contactName: string;
  contactPhone?: string;
  createdAt: Date;
}

// Category untuk filter
export interface Category {
  id: ItemCategory | 'all';
  label: string;
  icon: string;
}
