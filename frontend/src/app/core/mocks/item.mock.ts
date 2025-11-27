import { Item, Category, UrgencyLevel, StorageLocation } from '../models/item.model';
import { getMockUserById } from './user.mock';
import { getLocationById, CampusLocation } from './location.mock';

// Base item data tanpa reporter info (akan di-populate dari user.mock dan location.mock)
interface BaseItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'lost' | 'found' | 'claimed';
  imageUrl: string;
  date: string;
  time: string;
  locationId: string; // Reference ke location.mock
  reporterId: string;
  createdAt: Date;
  // Lost specific
  reward?: boolean;
  urgency?: UrgencyLevel;
  // Found specific
  storageLocation?: StorageLocation;
  entrustedTo?: string;
  willingToDeliver?: boolean;
}

// Raw items data - hanya dengan reporterId dan locationId
const RAW_ITEMS: BaseItem[] = [
  // ============ MAHASISWA - 3 Laporan ============
  {
    id: 'item-1',
    title: 'Tas Ransel Navy',
    description: 'Kehilangan tas ransel warna navy merk Eiger di Perpustakaan Pusat lantai 2. Di dalam ada laptop dan buku catatan.',
    category: 'bags',
    status: 'lost',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
    date: '20 Nov',
    time: '10:30 AM',
    locationId: 'perpus',
    reporterId: 'user-mahasiswa',
    createdAt: new Date('2024-11-20'),
    reward: true,
    urgency: 'very-important'
  },
  {
    id: 'item-2',
    title: 'Airpods Pro',
    description: 'Ditemukan Airpods Pro dengan case hitam di meja belajar Gedung FTI Lt. 3. Masih menyala dan ada suara musik.',
    category: 'electronics',
    status: 'found',
    imageUrl: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400',
    date: '22 Nov',
    time: '02:15 PM',
    locationId: 'fti',
    reporterId: 'user-mahasiswa',
    createdAt: new Date('2024-11-22'),
    storageLocation: 'with-me',
    willingToDeliver: true
  },
  {
    id: 'item-3',
    title: 'Kunci Motor Honda',
    description: 'Kehilangan kunci motor Honda Beat dengan gantungan kunci doraemon di area parkir motor FTI.',
    category: 'keys',
    status: 'lost',
    imageUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=400',
    date: '24 Nov',
    time: '04:00 PM',
    locationId: 'parkir-motor',
    reporterId: 'user-mahasiswa',
    createdAt: new Date('2024-11-24'),
    urgency: 'important'
  },

  // ============ STAFF - 3 Laporan ============
  {
    id: 'item-4',
    title: 'Dompet Kulit Hitam',
    description: 'Ditemukan dompet kulit hitam berisi KTP dan beberapa kartu ATM di depan Gedung FTI. Hubungi saya untuk klaim.',
    category: 'wallet',
    status: 'found',
    imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400',
    date: '19 Nov',
    time: '09:00 AM',
    locationId: 'fti',
    reporterId: 'user-staff',
    createdAt: new Date('2024-11-19'),
    storageLocation: 'entrusted',
    entrustedTo: 'Security Gedung FTI a/n Pak Hendra'
  },
  {
    id: 'item-5',
    title: 'Laptop Asus ROG',
    description: 'Ditemukan laptop Asus ROG di Gedung FTI setelah jam kuliah. Ada sticker UII di cover. Silakan ambil di ruang dosen.',
    category: 'electronics',
    status: 'found',
    imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400',
    date: '21 Nov',
    time: '05:30 PM',
    locationId: 'fti',
    reporterId: 'user-staff',
    createdAt: new Date('2024-11-21'),
    storageLocation: 'with-me',
    willingToDeliver: false
  },
  {
    id: 'item-6',
    title: 'Jaket Almamater UII',
    description: 'Ditemukan jaket almamater UII ukuran L tertinggal di GKU. Sudah diklaim oleh pemilik.',
    category: 'clothing',
    status: 'claimed',
    imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400',
    date: '23 Nov',
    time: '11:00 AM',
    locationId: 'gku',
    reporterId: 'user-staff',
    createdAt: new Date('2024-11-23')
  },

  // ============ UMUM - 3 Laporan ============
  {
    id: 'item-7',
    title: 'iPhone 14 Pro Silver',
    description: 'Kehilangan iPhone 14 Pro warna silver dengan case bening di area Masjid Ulil Albab setelah sholat Jumat.',
    category: 'phone',
    status: 'lost',
    imageUrl: 'https://images.unsplash.com/photo-1632661674596-df8be59a8056?w=400',
    date: '18 Nov',
    time: '01:30 PM',
    locationId: 'masjid',
    reporterId: 'user-umum',
    createdAt: new Date('2024-11-18'),
    reward: true,
    urgency: 'very-important'
  },
  {
    id: 'item-8',
    title: 'KTM dan Kartu ATM',
    description: 'Ditemukan KTM atas nama mahasiswa Teknik Informatika beserta kartu ATM BRI di toilet Gedung Rektorat.',
    category: 'documents',
    status: 'found',
    imageUrl: 'https://images.unsplash.com/photo-1616077168712-fc6c788db4af?w=400',
    date: '25 Nov',
    time: '03:45 PM',
    locationId: 'rektorat',
    reporterId: 'user-umum',
    createdAt: new Date('2024-11-25'),
    storageLocation: 'entrusted',
    entrustedTo: 'Resepsionis Rektorat'
  },
  {
    id: 'item-9',
    title: 'Payung Lipat Biru',
    description: 'Kehilangan payung lipat warna biru merk Nagoya di Kantin FTI. Tolong hubungi jika menemukan.',
    category: 'others',
    status: 'lost',
    imageUrl: 'https://images.unsplash.com/photo-1592928307985-2f8d5f3c7eaf?w=400',
    date: '26 Nov',
    time: '12:00 PM',
    locationId: 'kantin',
    reporterId: 'user-umum',
    createdAt: new Date('2024-11-26'),
    urgency: 'normal'
  }
];

// Populate reporter info dari user.mock dan location dari location.mock
function populateItemData(baseItem: BaseItem): Item {
  const user = getMockUserById(baseItem.reporterId);
  const location = getLocationById(baseItem.locationId);
  
  return {
    id: baseItem.id,
    title: baseItem.title,
    description: baseItem.description,
    category: baseItem.category,
    status: baseItem.status,
    imageUrl: baseItem.imageUrl,
    date: baseItem.date,
    time: baseItem.time,
    location: location ? {
      name: location.name,
      lat: location.lat,
      lng: location.lng
    } : {
      name: 'Lokasi tidak diketahui',
      lat: -7.6875,
      lng: 110.4095
    },
    reporterId: baseItem.reporterId,
    reporterName: user?.name ?? 'Unknown',
    reporterBadge: user?.badge ?? 'gray',
    reporterPhone: user?.phone ?? '',
    // Lost specific fields
    reward: baseItem.reward,
    urgency: baseItem.urgency,
    // Found specific fields
    storageLocation: baseItem.storageLocation,
    willingToDeliver: baseItem.willingToDeliver,
    createdAt: baseItem.createdAt
  } as Item;
}

// Export MOCK_ITEMS dengan data lengkap dari user.mock dan location.mock
export const MOCK_ITEMS: Item[] = RAW_ITEMS.map(populateItemData);

// Categories untuk filter
export const MOCK_CATEGORIES: Category[] = [
  { id: 'all', label: 'Semua', icon: 'ph-squares-four' },
  { id: 'bags', label: 'Tas', icon: 'ph-bag' },
  { id: 'wallet', label: 'Dompet', icon: 'ph-wallet' },
  { id: 'phone', label: 'HP', icon: 'ph-device-mobile' },
  { id: 'electronics', label: 'Elektronik', icon: 'ph-laptop' },
  { id: 'documents', label: 'Dokumen', icon: 'ph-file-text' },
  { id: 'keys', label: 'Kunci', icon: 'ph-key' },
  { id: 'clothing', label: 'Pakaian', icon: 'ph-t-shirt' },
  { id: 'others', label: 'Lainnya', icon: 'ph-dots-three' }
];
