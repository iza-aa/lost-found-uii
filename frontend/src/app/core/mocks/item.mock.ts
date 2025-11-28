import { Item, Category, UrgencyLevel, StorageLocation, ReportStatus, AlternativeContact, Claimant, Finder, VerificationQuestion } from '../models/item.model';
import { getMockUserById } from './user.mock';
import { getLocationById, CampusLocation } from './location.mock';

// Base item data tanpa reporter info (akan di-populate dari user.mock dan location.mock)
interface BaseItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'lost' | 'found';
  reportStatus: ReportStatus;
  imageUrl: string;
  date: string;
  time: string;
  locationId: string; // Reference ke location.mock
  reporterId: string;
  createdAt: Date;
  // Privacy & Contact
  exposePhone?: boolean;
  alternativeContact?: AlternativeContact;
  willingToCod?: boolean;
  // Lost specific
  reward?: boolean;
  urgency?: UrgencyLevel;
  verificationQuestions?: VerificationQuestion[];
  // Found specific
  storageLocation?: StorageLocation;
  entrustedTo?: string;
  willingToDeliver?: boolean; // DEPRECATED
  // QR Scan specific
  isScannedByQr?: boolean;
  scannedQrOwnerId?: string;
  scannedQrOwnerName?: string;
  scannedQrOwnerPhone?: string;
  // Claimants (for found items)
  claimants?: Claimant[];
  // Finders (for lost items)
  finders?: Finder[];
}

// Raw items data - hanya dengan reporterId dan locationId
const RAW_ITEMS: BaseItem[] = [
  // ============ MAHASISWA - 3 Laporan ============
  
  // CASE 1: LOST - Ada verification questions, ada 2 finders (1 pending, 1 rejected)
  // Login sebagai: mahasiswa (owner) → lihat daftar penemu
  // Login sebagai: staff → sudah submit finder (pending)
  // Login sebagai: umum → sudah submit finder (rejected)
  // Login sebagai: lain → tombol "Saya Menemukan Barang Ini"
  {
    id: 'item-1',
    title: 'Tas Ransel Navy',
    description: 'Kehilangan tas ransel warna navy merk Eiger di Perpustakaan Pusat lantai 2. Di dalam ada laptop dan buku catatan.',
    category: 'bags',
    status: 'lost',
    reportStatus: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
    date: '20 Nov',
    time: '10:30 AM',
    locationId: 'perpus',
    reporterId: 'user-mahasiswa',
    createdAt: new Date('2024-11-20'),
    reward: true,
    urgency: 'very-important',
    exposePhone: true,
    willingToCod: true,
    // Verification questions for finders
    verificationQuestions: [
      { id: 'q1', question: 'Apa merk laptop yang ada di dalam tas?', isRequired: true },
      { id: 'q2', question: 'Apa warna buku catatan di dalam tas?', isRequired: true },
      { id: 'q3', question: 'Apakah ada gantungan kunci di tas? Jika ya, bentuknya apa?', isRequired: false }
    ],
    // Sample finders for testing
    finders: [
      {
        id: 'finder-1',
        finderId: 'user-staff',
        finderName: 'Budi Santoso',
        finderBadge: 'blue',
        finderPhone: '081234567890',
        answers: [
          { questionId: 'q1', question: 'Apa merk laptop yang ada di dalam tas?', answer: 'Laptop Lenovo ThinkPad warna hitam' },
          { questionId: 'q2', question: 'Apa warna buku catatan di dalam tas?', answer: 'Buku catatan warna merah dengan stiker kucing' },
          { questionId: 'q3', question: 'Apakah ada gantungan kunci di tas? Jika ya, bentuknya apa?', answer: 'Ada, gantungan kunci berbentuk miniatur Eiffel' }
        ],
        photoUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
        status: 'pending',
        createdAt: new Date('2024-11-21')
      },
      {
        id: 'finder-2',
        finderId: 'user-umum',
        finderName: 'Reza Fahlevi',
        finderBadge: 'gray',
        finderPhone: '089876543210',
        answers: [
          { questionId: 'q1', question: 'Apa merk laptop yang ada di dalam tas?', answer: 'Laptop HP' },
          { questionId: 'q2', question: 'Apa warna buku catatan di dalam tas?', answer: 'Warna biru' }
        ],
        status: 'rejected',
        rejectionReason: 'Jawaban tidak sesuai dengan ciri-ciri barang',
        createdAt: new Date('2024-11-21')
      }
    ]
  },
  
  // CASE 2: FOUND - Ada 2 claimants (keduanya pending)
  // Login sebagai: mahasiswa (owner) → lihat daftar pemohon
  // Login sebagai: staff → sudah submit claim (pending)
  // Login sebagai: umum → lihat tombol "Klaim Barang Ini" (belum submit)
  {
    id: 'item-2',
    title: 'Airpods Pro',
    description: 'Ditemukan Airpods Pro dengan case hitam di meja belajar Gedung FTI Lt. 3. Masih menyala dan ada suara musik.',
    category: 'electronics',
    status: 'found',
    reportStatus: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400',
    date: '22 Nov',
    time: '02:15 PM',
    locationId: 'fti',
    reporterId: 'user-mahasiswa',
    createdAt: new Date('2024-11-22'),
    storageLocation: 'with-me',
    willingToCod: true,
    exposePhone: true,
    // Sample claimants for testing
    claimants: [
      {
        id: 'claim-1',
        claimerId: 'user-staff',
        claimerName: 'Budi Santoso',
        claimerBadge: 'blue',
        claimerPhone: '087654321098',
        description: 'Airpods saya warna hitam, ada goresan kecil di bagian case sebelah kiri. Saya kehilangannya saat kuliah jam 1 siang.',
        photoUrl: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=200',
        additionalContact: { instagram: 'budisantoso_' },
        status: 'pending',
        isQrVerified: false,
        createdAt: new Date('2024-11-23T10:30:00')
      }
    ]
  },
  
  // CASE 3: LOST - Tanpa verification questions, pakai kontak alternatif (Instagram & Telegram)
  // Langsung tampil kontak alternatif tanpa verifikasi
  {
    id: 'item-3',
    title: 'Kunci Motor Honda',
    description: 'Kehilangan kunci motor Honda Beat dengan gantungan kunci doraemon di area parkir motor FTI.',
    category: 'keys',
    status: 'lost',
    reportStatus: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=400',
    date: '24 Nov',
    time: '04:00 PM',
    locationId: 'parkir-motor',
    reporterId: 'user-mahasiswa',
    createdAt: new Date('2024-11-24'),
    urgency: 'important',
    exposePhone: false,
    alternativeContact: {
      contacts: [
        { type: 'instagram', value: 'ahmadfahmi_' },
        { type: 'telegram', value: 'ahmadfahmi' }
      ]
    }
  },

  // ============ STAFF - 3 Laporan ============
  
  // CASE 4: FOUND - Ada claimants (1 pending, 1 rejected)
  // Barang dititipkan ke security
  // Login sebagai: staff (owner) → lihat daftar pemohon
  // Login sebagai: mahasiswa → sudah submit claim (pending)
  // Login sebagai: umum → sudah submit claim (rejected)
  {
    id: 'item-4',
    title: 'Dompet Kulit Hitam',
    description: 'Ditemukan dompet kulit hitam berisi KTP dan beberapa kartu ATM di depan Gedung FTI. Hubungi saya untuk klaim.',
    category: 'wallet',
    status: 'found',
    reportStatus: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400',
    date: '19 Nov',
    time: '09:00 AM',
    locationId: 'fti',
    reporterId: 'user-staff',
    createdAt: new Date('2024-11-19'),
    storageLocation: 'entrusted',
    entrustedTo: 'Security Gedung FTI a/n Pak Hendra',
    willingToCod: false,
    exposePhone: true,
    // Sample claimants - 1 pending, 1 rejected
    claimants: [
      {
        id: 'claim-4-1',
        claimerId: 'user-mahasiswa',
        claimerName: 'Ahmad Fauzi',
        claimerBadge: 'blue',
        claimerPhone: '081234567890',
        description: 'Dompet saya warna hitam, isinya ada KTP nama Ahmad Fauzi, kartu ATM BCA dan BRI, serta foto keluarga.',
        additionalContact: { instagram: 'ahmadfahmi_' },
        status: 'pending',
        isQrVerified: false,
        createdAt: new Date('2024-11-20T09:00:00')
      },
      {
        id: 'claim-4-2',
        claimerId: 'user-umum',
        claimerName: 'Reza Fahlevi',
        claimerBadge: 'gray',
        claimerPhone: '081345678901',
        description: 'Dompet hitam merk Gucci ada kartu mahasiswa.',
        status: 'rejected',
        isQrVerified: false,
        rejectionReason: 'Merk tidak sesuai, dompet ini bukan Gucci',
        createdAt: new Date('2024-11-19T15:00:00'),
        updatedAt: new Date('2024-11-19T16:00:00')
      }
    ]
  },
  
  // CASE 5: FOUND - Penemu tidak ekspos WA, pakai multiple kontak alternatif (grid)
  // Ada 1 claimant yang sudah APPROVED
  // Login sebagai: staff (owner) → lihat claimant yang sudah approved
  // Login sebagai: mahasiswa → sudah approved, lihat kontak penemu (grid)
  {
    id: 'item-5',
    title: 'Laptop Asus ROG',
    description: 'Ditemukan laptop Asus ROG di Gedung FTI setelah jam kuliah. Ada sticker UII di cover. Silakan ambil di ruang dosen.',
    category: 'electronics',
    status: 'found',
    reportStatus: 'claimed',
    imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400',
    date: '21 Nov',
    time: '05:30 PM',
    locationId: 'fti',
    reporterId: 'user-staff',
    createdAt: new Date('2024-11-21'),
    storageLocation: 'with-me',
    willingToCod: true,
    // Penemu tidak mau ekspos WA, pakai multiple kontak alternatif
    exposePhone: false,
    alternativeContact: {
      contacts: [
        { type: 'instagram', value: 'budisantoso_dosen' },
        { type: 'telegram', value: 'budisantoso' },
        { type: 'email', value: 'budi.santoso@uii.ac.id' }
      ]
    },
    // 1 claimant yang sudah approved
    claimants: [
      {
        id: 'claim-5-1',
        claimerId: 'user-mahasiswa',
        claimerName: 'Ahmad Fauzi',
        claimerBadge: 'blue',
        claimerPhone: '081234567890',
        description: 'Laptop ROG Strix G15 dengan stiker UII dan stiker anime di bagian belakang. Serial number G513QR-xxx',
        photoUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=200',
        additionalContact: { instagram: 'ahmadfahmi_' },
        status: 'approved',
        isQrVerified: false,
        createdAt: new Date('2024-11-22T09:00:00'),
        updatedAt: new Date('2024-11-22T10:00:00')
      }
    ]
  },
  
  // CASE 6: FOUND - Status sudah claimed (selesai)
  // Tidak ada claimants array karena sudah selesai manual
  {
    id: 'item-6',
    title: 'Jaket Almamater UII',
    description: 'Ditemukan jaket almamater UII ukuran L tertinggal di GKU. Sudah diklaim oleh pemilik.',
    category: 'clothing',
    status: 'found',
    reportStatus: 'claimed',  // Already claimed
    imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400',
    date: '23 Nov',
    time: '11:00 AM',
    locationId: 'gku',
    reporterId: 'user-staff',
    createdAt: new Date('2024-11-23'),
    storageLocation: 'with-me',
    willingToCod: false,
    exposePhone: true
  },

  // ============ UMUM - 3 Laporan ============
  
  // CASE 7: LOST - Status sudah resolved (sudah ketemu)
  // Ada 1 finder yang approved
  {
    id: 'item-7',
    title: 'iPhone 14 Pro Silver',
    description: 'Kehilangan iPhone 14 Pro warna silver dengan case bening di area Masjid Ulil Albab setelah sholat Jumat.',
    category: 'phone',
    status: 'lost',
    reportStatus: 'resolved',  // Already found
    imageUrl: 'https://images.unsplash.com/photo-1632661674596-df8be59a8056?w=400',
    date: '18 Nov',
    time: '01:30 PM',
    locationId: 'masjid',
    reporterId: 'user-umum',
    createdAt: new Date('2024-11-18'),
    reward: true,
    urgency: 'very-important',
    exposePhone: true,
    verificationQuestions: [
      { id: 'q1', question: 'Apa wallpaper lockscreen HP ini?', isRequired: true },
      { id: 'q2', question: 'Apa password/PIN HP (4 digit)?', isRequired: true }
    ],
    finders: [
      {
        id: 'finder-7-1',
        finderId: 'user-staff',
        finderName: 'Budi Santoso',
        finderBadge: 'blue',
        finderPhone: '081234567890',
        answers: [
          { questionId: 'q1', question: 'Apa wallpaper lockscreen HP ini?', answer: 'Foto kucing oren lucu' },
          { questionId: 'q2', question: 'Apa password/PIN HP (4 digit)?', answer: '1234' }
        ],
        photoUrl: 'https://images.unsplash.com/photo-1632661674596-df8be59a8056?w=200',
        status: 'approved',
        createdAt: new Date('2024-11-19T10:00:00'),
        updatedAt: new Date('2024-11-19T11:00:00')
      }
    ]
  },
  
  // CASE 8: FOUND - Barang dititipkan, belum ada claimant
  // Login sebagai siapapun (bukan owner) → tombol "Klaim Barang Ini"
  {
    id: 'item-8',
    title: 'KTM dan Kartu ATM',
    description: 'Ditemukan KTM atas nama mahasiswa Teknik Informatika beserta kartu ATM BRI di toilet Gedung Rektorat.',
    category: 'documents',
    status: 'found',
    reportStatus: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1616077168712-fc6c788db4af?w=400',
    date: '25 Nov',
    time: '03:45 PM',
    locationId: 'rektorat',
    reporterId: 'user-umum',
    createdAt: new Date('2024-11-25'),
    storageLocation: 'entrusted',
    entrustedTo: 'Resepsionis Rektorat',
    willingToCod: true,
    exposePhone: true
    // Belum ada claimants
  },
  
  // CASE 9: LOST - Ada verification questions, belum ada finder
  // Login sebagai: umum (owner) → lihat "Belum ada yang menemukan"
  // Login sebagai: lain → tombol "Saya Menemukan Barang Ini"
  {
    id: 'item-9',
    title: 'Payung Lipat Biru',
    description: 'Kehilangan payung lipat warna biru merk Nagoya di Kantin FTI. Tolong hubungi jika menemukan.',
    category: 'others',
    status: 'lost',
    reportStatus: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1592928307985-2f8d5f3c7eaf?w=400',
    date: '26 Nov',
    time: '12:00 PM',
    locationId: 'kantin',
    reporterId: 'user-umum',
    createdAt: new Date('2024-11-26'),
    urgency: 'normal',
    exposePhone: false,
    alternativeContact: {
      contacts: [
        { type: 'instagram', value: 'reza_fahlevi' },
        { type: 'email', value: 'reza@email.com' }
      ]
    },
    verificationQuestions: [
      { id: 'q1', question: 'Apa merk payung ini?', isRequired: true },
      { id: 'q2', question: 'Apakah ada kerusakan di payung? Jelaskan jika ada.', isRequired: false }
    ]
    // Belum ada finders
  },

  // ============ QR SCAN ITEM - Ditemukan via QR ============
  
  // CASE 10: FOUND via QR - Claimant terverifikasi QR (approved)
  // Login sebagai: staff (finder/reporter) → lihat claimant approved via QR
  // Login sebagai: mahasiswa (owner QR) → sudah approved, lihat kontak penemu
  {
    id: 'item-10',
    title: 'Dompet Leather Coach',
    description: 'Menemukan dompet leather merk Coach warna coklat di depan Masjid Ulil Albab setelah sholat Dzuhur. Dompet ini sudah dipindai melalui QR Code yang tertempel di dompet.',
    category: 'wallet',
    status: 'found',
    reportStatus: 'claimed',
    imageUrl: 'https://images.unsplash.com/photo-1553835973-dec43bfddbeb?w=400',
    date: '27 Nov',
    time: '01:00 PM',
    locationId: 'masjid',
    reporterId: 'user-staff', // Staff yang melaporkan
    createdAt: new Date('2024-11-27'),
    storageLocation: 'entrusted',
    entrustedTo: 'Security Masjid Ulil Albab',
    willingToCod: false,
    exposePhone: true,
    // QR Scan specific - pemilik teridentifikasi dari QR
    isScannedByQr: true,
    scannedQrOwnerId: 'user-mahasiswa',
    scannedQrOwnerName: 'Ahmad Fauzi',
    scannedQrOwnerPhone: '081234567890',
    // QR-verified claimant
    claimants: [
      {
        id: 'claim-qr-1',
        claimerId: 'user-mahasiswa',
        claimerName: 'Ahmad Fauzi',
        claimerBadge: 'blue',
        claimerPhone: '081234567890',
        description: '(QR Verified Owner)',
        additionalContact: { instagram: 'ahmadfahmi_' },
        status: 'approved',
        isQrVerified: true,
        createdAt: new Date('2024-11-27T14:00:00'),
        updatedAt: new Date('2024-11-27T14:30:00')
      }
    ]
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
    reportStatus: baseItem.reportStatus,
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
    // Privacy & Contact
    exposePhone: baseItem.exposePhone,
    alternativeContact: baseItem.alternativeContact,
    willingToCod: baseItem.willingToCod,
    // Lost specific fields
    reward: baseItem.reward,
    urgency: baseItem.urgency,
    verificationQuestions: baseItem.verificationQuestions,  // Added!
    // Found specific fields
    storageLocation: baseItem.storageLocation,
    entrustedTo: baseItem.entrustedTo,
    // QR Scan specific fields
    isScannedByQr: baseItem.isScannedByQr,
    scannedQrOwnerId: baseItem.scannedQrOwnerId,
    scannedQrOwnerName: baseItem.scannedQrOwnerName,
    scannedQrOwnerPhone: baseItem.scannedQrOwnerPhone,
    // Claimants (for Found items)
    claimants: baseItem.claimants,
    // Finders (for Lost items)
    finders: baseItem.finders,  // Added!
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
