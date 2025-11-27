import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserBadge } from '../../../core/models';

type UserRole = 'student' | 'staff' | 'public';
type RegisterMethod = 'email' | 'whatsapp';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  // Steps
  currentStep = signal(1);
  totalSteps = 3;

  // Form data
  selectedRole: UserRole | '' = '';
  registerMethod: RegisterMethod = 'email';
  
  formData = {
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    faculty: '',
    studentId: '',
    employeeId: ''
  };

  // UI State
  isLoading = signal(false);
  isSuccess = signal(false);
  errorMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  // Role options
  roleOptions: { value: UserRole; label: string; icon: string; color: string; description: string; badge: UserBadge }[] = [
    { 
      value: 'student', 
      label: 'Mahasiswa', 
      icon: 'ph-student', 
      color: 'blue',
      description: 'Mahasiswa aktif UII',
      badge: 'blue'
    },
    { 
      value: 'staff', 
      label: 'Staff/Dosen', 
      icon: 'ph-seal-check', 
      color: 'yellow',
      description: 'Pegawai atau dosen UII',
      badge: 'gold'
    },
    { 
      value: 'public', 
      label: 'Umum', 
      icon: 'ph-user', 
      color: 'gray',
      description: 'Pengunjung atau alumni',
      badge: 'gray'
    }
  ];

  // Faculty options
  facultyOptions = [
    'Fakultas Teknologi Industri',
    'Fakultas Teknik Sipil dan Perencanaan',
    'Fakultas Ekonomi dan Bisnis',
    'Fakultas Hukum',
    'Fakultas Ilmu Agama Islam',
    'Fakultas Kedokteran',
    'Fakultas Matematika dan Ilmu Pengetahuan Alam',
    'Fakultas Psikologi dan Ilmu Sosial Budaya',
    'Pascasarjana'
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // Step navigation
  nextStep(): void {
    if (this.canProceed()) {
      this.errorMessage = '';
      if (this.currentStep() < this.totalSteps) {
        this.currentStep.update(v => v + 1);
      }
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.errorMessage = '';
      this.currentStep.update(v => v - 1);
    }
  }

  canProceed(): boolean {
    switch (this.currentStep()) {
      case 1:
        return this.selectedRole !== '';
      case 2:
        return this.validateStep2();
      case 3:
        return this.validateStep3();
      default:
        return false;
    }
  }

  // Step 1: Select role
  selectRole(role: UserRole): void {
    this.selectedRole = role;
    // Reset form when role changes
    this.formData.email = '';
    this.formData.phone = '';
    this.registerMethod = role === 'public' ? 'email' : 'email';
  }

  // Step 2 validation
  validateStep2(): boolean {
    this.errorMessage = '';

    if (!this.formData.name.trim()) {
      this.errorMessage = 'Nama lengkap harus diisi';
      return false;
    }

    if (this.formData.name.trim().length < 3) {
      this.errorMessage = 'Nama minimal 3 karakter';
      return false;
    }

    // Validate based on role
    if (this.selectedRole === 'student') {
      if (!this.formData.email) {
        this.errorMessage = 'Email UII harus diisi';
        return false;
      }
      if (!this.formData.email.endsWith('@students.uii.ac.id')) {
        this.errorMessage = 'Gunakan email @students.uii.ac.id';
        return false;
      }
      if (!this.formData.studentId) {
        this.errorMessage = 'NIM harus diisi';
        return false;
      }
      if (!this.formData.faculty) {
        this.errorMessage = 'Pilih fakultas';
        return false;
      }
      if (!this.formData.phone || this.formData.phone.length < 10) {
        this.errorMessage = 'Nomor HP harus diisi (minimal 10 digit)';
        return false;
      }
    } else if (this.selectedRole === 'staff') {
      if (!this.formData.email) {
        this.errorMessage = 'Email UII harus diisi';
        return false;
      }
      if (!this.formData.email.endsWith('@uii.ac.id')) {
        this.errorMessage = 'Gunakan email @uii.ac.id';
        return false;
      }
      if (!this.formData.employeeId) {
        this.errorMessage = 'NIP/NIK harus diisi';
        return false;
      }
      if (!this.formData.faculty) {
        this.errorMessage = 'Pilih fakultas/unit';
        return false;
      }
      if (!this.formData.phone || this.formData.phone.length < 10) {
        this.errorMessage = 'Nomor HP harus diisi (minimal 10 digit)';
        return false;
      }
    } else if (this.selectedRole === 'public') {
      if (this.registerMethod === 'email') {
        if (!this.formData.email) {
          this.errorMessage = 'Email harus diisi';
          return false;
        }
        if (!this.formData.email.includes('@')) {
          this.errorMessage = 'Format email tidak valid';
          return false;
        }
        // Tidak boleh pakai email UII untuk public
        if (this.formData.email.endsWith('@students.uii.ac.id') || this.formData.email.endsWith('@uii.ac.id')) {
          this.errorMessage = 'Email UII tidak bisa digunakan untuk akun umum. Pilih Mahasiswa atau Staff.';
          return false;
        }
      } else {
        if (!this.formData.phone) {
          this.errorMessage = 'Nomor WhatsApp harus diisi';
          return false;
        }
        if (this.formData.phone.length < 10) {
          this.errorMessage = 'Nomor WhatsApp tidak valid';
          return false;
        }
      }
    }

    return true;
  }

  // Step 3 validation
  validateStep3(): boolean {
    this.errorMessage = '';

    if (!this.formData.password) {
      this.errorMessage = 'Password harus diisi';
      return false;
    }

    if (this.formData.password.length < 6) {
      this.errorMessage = 'Password minimal 6 karakter';
      return false;
    }

    if (this.formData.password !== this.formData.confirmPassword) {
      this.errorMessage = 'Password tidak cocok';
      return false;
    }

    // Phone is required for public user with email registration (phone for student/staff already validated in step 2)
    if (this.selectedRole === 'public' && this.registerMethod === 'email') {
      if (!this.formData.phone) {
        this.errorMessage = 'Nomor HP harus diisi untuk verifikasi';
        return false;
      }
    }

    return true;
  }

  // Auto-extract NIM/NIP from email
  onEmailChange(): void {
    if (this.selectedRole === 'student' && this.formData.email.includes('@students.uii.ac.id')) {
      // Extract NIM from email (e.g., 21523273@students.uii.ac.id -> 21523273)
      const nim = this.formData.email.split('@')[0];
      if (/^\d+$/.test(nim)) {
        this.formData.studentId = nim;
      }
    } else if (this.selectedRole === 'staff' && this.formData.email.includes('@uii.ac.id')) {
      // Extract potential NIP from email if it starts with numbers
      const emailPrefix = this.formData.email.split('@')[0];
      if (/^\d+$/.test(emailPrefix)) {
        this.formData.employeeId = emailPrefix;
      }
    }
  }

  // Get email domain hint based on role
  getEmailPlaceholder(): string {
    switch (this.selectedRole) {
      case 'student': return 'nim@students.uii.ac.id';
      case 'staff': return 'nama@uii.ac.id';
      case 'public': return 'email@gmail.com';
      default: return 'email@example.com';
    }
  }

  // Get email domain suffix for display
  getEmailDomain(): string {
    switch (this.selectedRole) {
      case 'student': return '@students.uii.ac.id';
      case 'staff': return '@uii.ac.id';
      default: return '';
    }
  }

  // Toggle password visibility
  togglePassword(field: 'password' | 'confirm'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  // Get badge for selected role
  getSelectedBadge(): UserBadge {
    const role = this.roleOptions.find(r => r.value === this.selectedRole);
    return role?.badge || 'gray';
  }

  // Submit registration
  async onSubmit(): Promise<void> {
    if (!this.canProceed()) return;

    this.isLoading.set(true);
    this.errorMessage = '';

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    // For demo, register the user
    const result = this.authService.register({
      name: this.formData.name,
      email: this.formData.email || `${this.formData.phone}@whatsapp.user`,
      phone: this.formData.phone,
      password: this.formData.password,
      role: this.selectedRole as UserRole,
      badge: this.getSelectedBadge(),
      faculty: this.formData.faculty,
      studentId: this.formData.studentId,
      employeeId: this.formData.employeeId
    });

    this.isLoading.set(false);

    if (result.success) {
      this.isSuccess.set(true);
    } else {
      this.errorMessage = result.message || 'Registrasi gagal';
    }
  }

  // Go to login
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  // Go to home after success
  goToHome(): void {
    this.router.navigate(['/']);
  }

  // Get step title
  getStepTitle(): string {
    const titles = [
      'Pilih jenis akun',
      'Lengkapi data diri',
      'Buat password'
    ];
    return titles[this.currentStep() - 1];
  }

  // Get step subtitle
  getStepSubtitle(): string {
    const subtitles = [
      'Tentukan jenis akun yang sesuai dengan status kamu',
      this.selectedRole === 'public' 
        ? 'Masukkan data yang akan ditampilkan di profil' 
        : 'Gunakan email UII resmi untuk verifikasi',
      'Password untuk mengamankan akun kamu'
    ];
    return subtitles[this.currentStep() - 1];
  }
}
