import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';

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
    private apiService: ApiService,
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

    // Call API untuk login
    this.apiService.login({ email: this.email, password: this.password }).subscribe({
      next: (response) => {
        // Sync user ke AuthService
        this.authService.setUserFromApi(response.user);
        
        this.isLoading = false;
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (error: Error) => {
        this.errorMessage = error.message || 'Login gagal, silakan coba lagi.';
        this.isLoading = false;
      }
    });
  }
}
