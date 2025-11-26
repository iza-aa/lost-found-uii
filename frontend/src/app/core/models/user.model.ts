// Badge types untuk trust level
export type UserBadge = 'gold' | 'blue' | 'gray';

// Role types
export type UserRole = 'staff' | 'student' | 'public';

// Main User interface
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  
  // Badge & Role system
  role: UserRole;
  badge: UserBadge;
  
  // UII specific
  faculty?: string;
  studentId?: string;  // NIM (untuk mahasiswa)
  employeeId?: string; // NIP (untuk staff)
}

// Helper function untuk menentukan badge dari email
export function getBadgeFromEmail(email: string): { role: UserRole; badge: UserBadge } {
  if (email.endsWith('@uii.ac.id')) {
    return { role: 'staff', badge: 'gold' };
  }
  if (email.endsWith('@students.uii.ac.id')) {
    return { role: 'student', badge: 'blue' };
  }
  return { role: 'public', badge: 'gray' };
}

// Badge display info
export interface BadgeInfo {
  badge: UserBadge;
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

export const BADGE_CONFIG: Record<UserBadge, BadgeInfo> = {
  gold: {
    badge: 'gold',
    label: 'Staff UII',
    color: 'text-yellow-700 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    icon: 'ph-fill ph-seal-check'
  },
  blue: {
    badge: 'blue',
    label: 'Mahasiswa UII',
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: 'ph-fill ph-student'
  },
  gray: {
    badge: 'gray',
    label: 'Umum',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-700',
    icon: 'ph ph-user'
  }
};
