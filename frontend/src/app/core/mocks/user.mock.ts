import { User } from '../models/user.model';

// Helper function to generate QR data for a user
export function generateUserQRData(user: User): string {
  const userData = {
    id: user.id,
    name: user.name,
    phone: user.phone,
    badge: user.badge,
    faculty: user.faculty,
    studentId: user.studentId,
    employeeId: user.employeeId,
    avatar: user.avatar
  };
  // Use btoa directly without encodeURIComponent for shorter QR data
  return btoa(JSON.stringify(userData));
}

// 3 Demo Users: Mahasiswa, Staff, Umum
// Email alternatif: demo@students.uii.ac.id, demo@uii.ac.id, demo@gmail.com
export const MOCK_USERS: User[] = [
  // Demo Mahasiswa (email: demo@students.uii.ac.id)
  {
    id: 'user-mahasiswa',
    name: 'Ahmad Fauzi',
    email: 'demo@students.uii.ac.id',
    phone: '081234567890',
    avatar: 'https://i.pravatar.cc/150?img=1',
    faculty: 'Fakultas Teknologi Industri',
    studentId: '20523001',
    role: 'student',
    badge: 'blue'
  },
  // Demo Staff (email: demo@uii.ac.id)
  {
    id: 'user-staff',
    name: 'Dr. Budi Santoso',
    email: 'demo@uii.ac.id',
    phone: '081298765432',
    avatar: 'https://i.pravatar.cc/150?img=12',
    faculty: 'Fakultas Teknologi Industri',
    employeeId: '19850012',
    role: 'staff',
    badge: 'gold'
  },
  // Demo Umum (email: demo@gmail.com)
  {
    id: 'user-umum',
    name: 'Siti Rahayu',
    email: 'demo@gmail.com',
    phone: '081345678901',
    avatar: 'https://i.pravatar.cc/150?img=5',
    role: 'public',
    badge: 'gray'
  }
];

// Get user by ID
export function getMockUserById(id: string): User | undefined {
  return MOCK_USERS.find(user => user.id === id);
}

// Get user by email
export function getMockUserByEmail(email: string): User | undefined {
  return MOCK_USERS.find(user => user.email.toLowerCase() === email.toLowerCase());
}

// Add user to mock (for dynamically created/registered users)
export function addMockUser(user: User): void {
  const existing = MOCK_USERS.find(u => u.id === user.id);
  if (!existing) {
    MOCK_USERS.push(user);
  }
}

// Get QR URL for a user
export function getUserQRUrl(user: User, baseUrl: string): string {
  const qrData = generateUserQRData(user);
  return `${baseUrl}/u/${qrData}`;
}

