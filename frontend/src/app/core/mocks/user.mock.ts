import { User } from '../models/user.model';

export const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Ahmad Fauzi',
    email: 'ahmad.fauzi@students.uii.ac.id',
    phone: '081234567890',
    avatar: 'https://i.pravatar.cc/150?img=1',
    faculty: 'Fakultas Teknologi Industri',
    studentId: '20523001'
  },
  {
    id: '2',
    name: 'Siti Aminah',
    email: 'siti.aminah@students.uii.ac.id',
    phone: '082112345678',
    avatar: 'https://i.pravatar.cc/150?img=5',
    faculty: 'Fakultas Ekonomi',
    studentId: '20523002'
  }
];

// Current logged in user (mock)
export const CURRENT_USER: User = MOCK_USERS[0];
