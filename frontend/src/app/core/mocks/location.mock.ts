// Lokasi-lokasi di kampus UII untuk dropdown dan peta
export interface CampusLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description?: string;
}

// Koordinat pusat kampus UII Yogyakarta (Kampus Terpadu Jl. Kaliurang)
export const UII_CENTER = {
  lat: -7.68402735479403,
  lng: 110.41371304295868
};

// Lokasi-lokasi di kampus UII
export const MOCK_LOCATIONS: CampusLocation[] = [
  {
    id: 'fti',
    name: 'Gedung FTI (Fakultas Teknologi Industri)',
    lat: -7.686369,
    lng: 110.410806,
    description: 'Gedung Fakultas Teknologi Industri'
  },
  {
    id: 'fh',
    name: 'Gedung Fakultas Hukum',
    lat: -7.689302,
    lng: 110.412969,
    description: 'Gedung Fakultas Hukum'
  },
  {
    id: 'fiai',
    name: 'Gedung FIAI',
    lat: -7.688265,
    lng: 110.414749,
    description: 'Fakultas Ilmu Agama Islam'
  },
  {
    id: 'fpsb',
    name: 'Gedung FPSB',
    lat: -7.687150,
    lng: 110.414422,
    description: 'Fakultas Psikologi dan Ilmu Sosial Budaya'
  },
  {
    id: 'perpus',
    name: 'Perpustakaan UII',
    lat: -7.688298,
    lng: 110.415142,
    description: 'Perpustakaan Pusat UII'
  },
  {
    id: 'masjid',
    name: 'Masjid Ulil Albab',
    lat: -7.687475,
    lng: 110.415268,
    description: 'Masjid Kampus UII'
  },
  {
    id: 'rektorat',
    name: 'Gedung Rektorat',
    lat: -7.687939,
    lng: 110.413624,
    description: 'Gedung Rektorat UII'
  },
  {
    id: 'gku',
    name: 'Gedung Kuliah Umum (GKU)',
    lat: -7.688357,
    lng: 110.413558,
    description: 'Gedung Kuliah Umum'
  },
  {
    id: 'auditorium',
    name: 'Auditorium KH. Abdurrahman Wahid',
    lat: -7.687475,
    lng: 110.415268,
    description: 'Auditorium Kampus'
  },
  {
    id: 'kantin',
    name: 'Kantin FTI',
    lat: -7.687475,
    lng: 110.411443,
    description: 'Kantin FTI'
  },
  {
    id: 'parkir-motor',
    name: 'Parkiran Motor FTI',
    lat: -7.686937,
    lng: 110.411773,
    description: 'Area Parkir Motor'
  },
  {
    id: 'parkir-mobil',
    name: 'Parkiran Mobil FTI',
    lat: -7.686968,
    lng: 110.410962,
    description: 'Area Parkir Mobil'
  },
  {
    id: 'sport-center',
    name: 'GOR UII',
    lat: -7.686763,
    lng: 110.409404,
    description: 'Gedung Olahraga'
  },
  {
    id: 'asrama',
    name: 'Asrama Mahasiswa',
    lat: -7.690400,
    lng: 110.413203,
    description: 'Asrama Mahasiswa UII'
  },
  {
    id: 'lainnya',
    name: 'Lokasi Lainnya',
    lat: -7.687528,
    lng: 110.412678,
    description: 'Lokasi lain di sekitar kampus'
  }
];

// Get location by ID
export function getLocationById(id: string): CampusLocation | undefined {
  return MOCK_LOCATIONS.find(loc => loc.id === id);
}
