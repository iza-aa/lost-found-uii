import { Item, Category } from '../models/item.model';

// Dummy items data
export const MOCK_ITEMS: Item[] = [
  {
    id: '1',
    title: 'Duffle Bag',
    description: 'Brown colored duffle bag found at the ground. Message me if you are the owner.',
    category: 'bags',
    status: 'found',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
    date: '05 Sep',
    time: '07:55 PM',
    location: 'College Ground',
    contactName: 'Ahmad Fauzi',
    contactPhone: '081234567890',
    createdAt: new Date('2024-09-05')
  },
  {
    id: '2',
    title: 'Dompet Hitam',
    description: 'Dompet kulit warna hitam berisi KTM dan beberapa kartu. Ditemukan di kantin FTI.',
    category: 'wallet',
    status: 'found',
    imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400',
    date: '10 Sep',
    time: '12:30 PM',
    location: 'Kantin FTI',
    contactName: 'Budi Santoso',
    contactPhone: '081298765432',
    createdAt: new Date('2024-09-10')
  },
  {
    id: '3',
    title: 'iPhone 13 Pro',
    description: 'Kehilangan iPhone 13 Pro warna silver di area parkir. Ada case bening.',
    category: 'phone',
    status: 'lost',
    imageUrl: 'https://images.unsplash.com/photo-1632661674596-df8be59a8056?w=400',
    date: '12 Sep',
    time: '03:00 PM',
    location: 'Parkiran Rektorat',
    contactName: 'Siti Aminah',
    contactPhone: '082112345678',
    createdAt: new Date('2024-09-12')
  },
  {
    id: '4',
    title: 'Kunci Motor Honda',
    description: 'Ditemukan kunci motor Honda dengan gantungan kuning di depan Masjid Ulil Albab.',
    category: 'keys',
    status: 'found',
    imageUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=400',
    date: '14 Sep',
    time: '08:15 AM',
    location: 'Masjid Ulil Albab',
    contactName: 'Rizky Pratama',
    contactPhone: '085678901234',
    createdAt: new Date('2024-09-14')
  },
  {
    id: '5',
    title: 'Laptop Asus ROG',
    description: 'Kehilangan laptop Asus ROG di Lab Komputer. Ada sticker anime di cover.',
    category: 'electronics',
    status: 'lost',
    imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400',
    date: '15 Sep',
    time: '04:45 PM',
    location: 'Lab Komputer FTI',
    contactName: 'Dimas Aditya',
    contactPhone: '087654321098',
    createdAt: new Date('2024-09-15')
  },
  {
    id: '6',
    title: 'Jaket Almamater UII',
    description: 'Ditemukan jaket almamater UII ukuran L di Gedung Kuliah Umum.',
    category: 'clothing',
    status: 'claimed',
    imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400',
    date: '16 Sep',
    time: '10:00 AM',
    location: 'Gedung Kuliah Umum',
    contactName: 'Rina Wulandari',
    contactPhone: '089012345678',
    createdAt: new Date('2024-09-16')
  },
  {
    id: '7',
    title: 'Airpods Pro',
    description: 'Kehilangan Airpods Pro dengan case hitam di Perpustakaan Pusat.',
    category: 'electronics',
    status: 'lost',
    imageUrl: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400',
    date: '18 Sep',
    time: '02:30 PM',
    location: 'Perpustakaan Pusat',
    contactName: 'Andi Wijaya',
    contactPhone: '081345678901',
    createdAt: new Date('2024-09-18')
  },
  {
    id: '8',
    title: 'KTM dan KTP',
    description: 'Ditemukan KTM atas nama mahasiswa Teknik Informatika beserta KTP di toilet FTI.',
    category: 'documents',
    status: 'found',
    imageUrl: 'https://images.unsplash.com/photo-1616077168712-fc6c788db4af?w=400',
    date: '20 Sep',
    time: '11:20 AM',
    location: 'Toilet FTI Lt. 2',
    contactName: 'Maya Sari',
    contactPhone: '082234567890',
    createdAt: new Date('2024-09-20')
  },
  {
  id: '9',
  title: 'Payung Hitam',
  description: 'Ditemukan payung hitam di dekat parkiran sepeda FTI. Belum ada yang mengaku.',
  category: 'others',
  status: 'found',
  imageUrl: 'https://images.unsplash.com/photo-1592928307985-2f8d5f3c7eaf?w=400',
  date: '21 Sep',
  time: '08:45 AM',
  location: 'Parkiran Sepeda FTI',
  contactName: 'Rizky Ahmad',
  contactPhone: '081234567891',
  createdAt: new Date('2024-09-21')
},
{
  id: '10',
  title: 'Dompet Cokelat',
  description: 'Dompet cokelat berisi beberapa kartu mahasiswa ditemukan di kantin FTI.',
  category: 'others',
  status: 'found',
  imageUrl: 'https://images.unsplash.com/photo-1600180758895-f8f0f31b8c5b?w=400',
  date: '22 Sep',
  time: '01:30 PM',
  location: 'Kantin FTI Lt. 1',
  contactName: 'Nina Putri',
  contactPhone: '082345678912',
  createdAt: new Date('2024-09-22')
},

  
];

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
