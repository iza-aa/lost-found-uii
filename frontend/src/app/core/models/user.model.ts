export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  faculty?: string;
  studentId?: string;  // NIM
}
