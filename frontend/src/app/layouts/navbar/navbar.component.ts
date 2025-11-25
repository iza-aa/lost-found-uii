import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule], 
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  notificationCount = 3; // TODO: Ambil dari service nanti

  openQRScanner() {
    // TODO: Implementasi QR Scanner
    console.log('Open QR Scanner');
  }

  openNotifications() {
    // TODO: Implementasi Notification panel
    console.log('Open Notifications');
  }
}