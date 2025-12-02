import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Notification {
  id: number;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent {
  activeTab: 'semua' | 'belum-dibaca' = 'semua';
  
  notifications: Notification[] = [
    {
      id: 1,
      title: "Kecocokan Ditemukan!",
      message: "Seseorang baru saja melaporkan temuan barang yang mirip dengan laporan \"Dompet Kulit Coklat\" Anda. Cek kecocokannya sekarang.",
      timestamp: "10 November 2025 16:57 WIB",
      isRead: false
    },
    {
      id: 2,
      title: "Barang Anda Ditemukan!",
      message: "Seseorang baru saja melaporkan temuan barang Anda dari scan QRCode. Hubungi penemu sekarang!",
      timestamp: "09 November 2025 11:05 WIB",
      isRead: false
    },
    {
      id: 3,
      title: "Kecocokan Ditemukan!",
      message: "Seseorang baru saja melaporkan temuan barang yang mirip dengan laporan \"Dompet Kulit Coklat\" Anda. Cek kecocokannya sekarang.",
      timestamp: "08 November 2025 11:05 WIB",
      isRead: true
    }
  ];

  getFilteredNotifications(): Notification[] {
    if (this.activeTab === 'belum-dibaca') {
      return this.notifications.filter(n => !n.isRead);
    }
    return this.notifications;
  }

  openNotification(notification: Notification): void {
    // Handle notification click
    console.log('Notification clicked:', notification);
    // Mark as read
    notification.isRead = true;
  }
}