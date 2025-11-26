// Lokasi-lokasi di kampus UII untuk dropdown dan peta
export interface CampusLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description?: string;
}

// Koordinat pusat kampus UII Yogyakarta
export const UII_CENTER = {
  lat: -7.6875,
  lng: 110.4095
};

// Lokasi-lokasi di kampus UII
export const MOCK_LOCATIONS: CampusLocation[] = [
  {
    id: 'fti',
    name: 'Gedung FTI (Fakultas Teknologi Industri)',
    lat: -7.6872,
    lng: 110.4098,
    description: 'Gedung Fakultas Teknologi Industri'
  },
  {
    id: 'fh',
    name: 'Gedung Fakultas Hukum',
    lat: -7.6880,
    lng: 110.4085,
    description: 'Gedung Fakultas Hukum'
  },
  {
    id: 'fe',
    name: 'Gedung Fakultas Ekonomi',
    lat: -7.6878,
    lng: 110.4102,
    description: 'Gedung Fakultas Ekonomi dan Bisnis'
  },
  {
    id: 'fiai',
    name: 'Gedung FIAI',
    lat: -7.6868,
    lng: 110.4088,
    description: 'Fakultas Ilmu Agama Islam'
  },
  {
    id: 'fpsb',
    name: 'Gedung FPSB',
    lat: -7.6885,
    lng: 110.4092,
    description: 'Fakultas Psikologi dan Ilmu Sosial Budaya'
  },
  {
    id: 'perpus',
    name: 'Perpustakaan Pusat',
    lat: -7.6870,
    lng: 110.4090,
    description: 'Perpustakaan Pusat UII'
  },
  {
    id: 'masjid',
    name: 'Masjid Ulil Albab',
    lat: -7.6865,
    lng: 110.4095,
    description: 'Masjid Kampus UII'
  },
  {
    id: 'rektorat',
    name: 'Gedung Rektorat',
    lat: -7.6882,
    lng: 110.4078,
    description: 'Gedung Rektorat UII'
  },
  {
    id: 'gku',
    name: 'Gedung Kuliah Umum (GKU)',
    lat: -7.6875,
    lng: 110.4085,
    description: 'Gedung Kuliah Umum'
  },
  {
    id: 'auditorium',
    name: 'Auditorium KH. Abdurrahman Wahid',
    lat: -7.6888,
    lng: 110.4100,
    description: 'Auditorium Kampus'
  },
  {
    id: 'kantin',
    name: 'Kantin Pusat',
    lat: -7.6873,
    lng: 110.4082,
    description: 'Kantin Pusat Kampus'
  },
  {
    id: 'parkir-motor',
    name: 'Parkiran Motor',
    lat: -7.6890,
    lng: 110.4095,
    description: 'Area Parkir Motor'
  },
  {
    id: 'parkir-mobil',
    name: 'Parkiran Mobil',
    lat: -7.6892,
    lng: 110.4088,
    description: 'Area Parkir Mobil'
  },
  {
    id: 'sport-center',
    name: 'Sport Center',
    lat: -7.6860,
    lng: 110.4080,
    description: 'Gedung Olahraga'
  },
  {
    id: 'asrama',
    name: 'Asrama Mahasiswa',
    lat: -7.6855,
    lng: 110.4075,
    description: 'Asrama Mahasiswa UII'
  },
  {
    id: 'lainnya',
    name: 'Lokasi Lainnya',
    lat: -7.6875,
    lng: 110.4095,
    description: 'Lokasi lain di sekitar kampus'
  }
];

// Get location by ID
export function getLocationById(id: string): CampusLocation | undefined {
  return MOCK_LOCATIONS.find(loc => loc.id === id);
}
