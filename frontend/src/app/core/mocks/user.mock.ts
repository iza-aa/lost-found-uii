import { User } from '../models/user.model';

// Mock users dengan badge system
export const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Ahmad Fauzi',
    email: 'ahmad.fauzi@students.uii.ac.id',
    phone: '081234567890',
    avatar: 'https://i.pravatar.cc/150?img=1',
    faculty: 'Fakultas Teknologi Industri',
    studentId: '20523001',
    role: 'student',
    badge: 'blue'
  },
  {
    id: '2',
    name: 'Dr. Budi Santoso',
    email: 'budi.santoso@uii.ac.id',
    phone: '081298765432',
    avatar: 'https://i.pravatar.cc/150?img=12',
    faculty: 'Fakultas Teknologi Industri',
    employeeId: '19850012',
    role: 'staff',
    badge: 'gold'
  },
  {
    id: '3',
    name: 'Siti Aminah',
    email: 'siti.aminah@students.uii.ac.id',
    phone: '082112345678',
    avatar: 'https://i.pravatar.cc/150?img=5',
    faculty: 'Fakultas Ekonomi',
    studentId: '20523002',
    role: 'student',
    badge: 'blue'
  },
  {
    id: '4',
    name: 'Rizky Pratama',
    email: 'rizky.pratama@students.uii.ac.id',
    phone: '085678901234',
    avatar: 'https://i.pravatar.cc/150?img=3',
    faculty: 'Fakultas Teknologi Industri',
    studentId: '20523003',
    role: 'student',
    badge: 'blue'
  },
  {
    id: '5',
    name: 'Rina Wulandari',
    email: 'rina.w@uii.ac.id',
    phone: '089012345678',
    avatar: 'https://i.pravatar.cc/150?img=9',
    faculty: 'Fakultas Hukum',
    employeeId: '19900034',
    role: 'staff',
    badge: 'gold'
  },
  {
    id: '6',
    name: 'John Doe',
    email: 'johndoe@gmail.com',
    phone: '081345678901',
    avatar: 'https://i.pravatar.cc/150?img=8',
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

