import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;
  showPassword = false;
  
  private returnUrl = '/';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Get return URL dari query params
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.errorMessage = '';
    
    // Validasi
    if (!this.email) {
      this.errorMessage = 'Email harus diisi';
      return;
    }

    if (!this.email.includes('@')) {
      this.errorMessage = 'Format email tidak valid';
      return;
    }

    if (!this.password) {
      this.errorMessage = 'Password harus diisi';
      return;
    }

    this.isLoading = true;

    // Simulate loading
    setTimeout(() => {
      const result = this.authService.login(this.email, this.password);
      
      if (result.success) {
        this.router.navigateByUrl(this.returnUrl);
      } else {
        this.errorMessage = result.message;
      }
      
      this.isLoading = false;
    }, 1000);
  }

  // Quick login untuk demo
  quickLogin(type: 'student' | 'staff' | 'public'): void {
    const emails = {
      student: 'demo@students.uii.ac.id',
      staff: 'demo@uii.ac.id',
      public: 'demo@gmail.com'
    };
    
    this.email = emails[type];
    this.password = 'demo123';
  }
}
