import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule], 
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  private authService = inject(AuthService);
  
  // Reactive signals from AuthService
  currentUser = this.authService.currentUser;
  isAuthenticated = this.authService.isAuthenticated;
  
  notificationCount = 3; // TODO: Ambil dari service nanti
  showUserMenu = false;

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
    // TODO: Implementasi QR Scanner
    console.log('Open QR Scanner');
  }

  openNotifications(): void {
    // TODO: Implementasi Notification panel
    console.log('Open Notifications');
  }
}