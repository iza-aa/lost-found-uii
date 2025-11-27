import { Component, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { QrScannerComponent } from '../../shared/components';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule, QrScannerComponent], 
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  // Reactive signals from AuthService
  currentUser = this.authService.currentUser;
  isAuthenticated = this.authService.isAuthenticated;
  
  notificationCount = 3; // TODO: Ambil dari service nanti
  showUserMenu = false;
  showQRScanner = signal(false);

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  logout(): void {
    this.authService.logout();
    this.showUserMenu = false;
  }

  openQRScanner(): void {
    this.showQRScanner.set(true);
  }

  closeQRScanner(): void {
    this.showQRScanner.set(false);
  }

  onQRScanSuccess(result: string): void {
    this.showQRScanner.set(false);
    
    // Check if it's a valid URL from our app
    if (result.includes('/u/')) {
      // Extract userId and navigate
      const userId = result.split('/u/').pop();
      if (userId) {
        this.router.navigate(['/u', userId]);
      }
    } else {
      // Try to open as URL or show error
      try {
        const url = new URL(result);
        window.open(url.href, '_blank');
      } catch {
        alert('QR Code tidak valid');
      }
    }
  }

  onQRScanError(error: string): void {
    console.error('QR Scan error:', error);
  }
}