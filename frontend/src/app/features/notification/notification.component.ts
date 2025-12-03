import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService, Notification } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

// Internal notification format for template
interface DisplayNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  refType: string;
  refId: string;
}

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent implements OnInit {
  notifications: DisplayNotification[] = [];
  isLoading = signal(true);
  activeTab: 'semua' | 'belum-dibaca' = 'semua';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth']);
      return;
    }
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.isLoading.set(true);
    this.apiService.getNotifications().subscribe({
      next: (notifications) => {
        // Ensure notifications is an array
        const notifs = Array.isArray(notifications) ? notifications : [];
        this.notifications = notifs.map(n => this.mapToDisplay(n));
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load notifications:', error);
        this.notifications = [];
        this.isLoading.set(false);
      }
    });
  }

  private mapToDisplay(n: Notification): DisplayNotification {
    return {
      id: n.id,
      title: n.title,
      message: n.body,
      timestamp: this.formatTime(n.created_at),
      isRead: n.is_read,
      refType: n.ref_type,
      refId: n.ref_id
    };
  }

  getFilteredNotifications(): DisplayNotification[] {
    if (this.activeTab === 'belum-dibaca') {
      return this.notifications.filter(n => !n.isRead);
    }
    return this.notifications;
  }

  hasUnread(): boolean {
    return this.notifications.some(n => !n.isRead);
  }

  markAllAsRead(): void {
    // Get IDs of unread notifications
    const unreadIds = this.notifications.filter(n => !n.isRead).map(n => n.id);
    
    // Mark all as read locally first for instant UI feedback
    this.notifications = this.notifications.map(n => ({ ...n, isRead: true }));
    
    // Then call API for each unread notification
    unreadIds.forEach(id => {
      this.apiService.markNotificationAsRead(id).subscribe();
    });
  }

  openNotification(notification: DisplayNotification): void {
    // Mark as read
    if (!notification.isRead) {
      notification.isRead = true;
      this.apiService.markNotificationAsRead(notification.id).subscribe();
    }
    
    // Navigate based on ref_type
    this.navigateToRef(notification);
  }

  private navigateToRef(notification: DisplayNotification): void {
    // Based on ref_type, navigate to appropriate page
    switch (notification.refType) {
      case 'CLAIM_NEW':
      case 'CLAIM_ANSWERED':
      case 'CLAIM_APPROVED':
      case 'CLAIM_REJECTED':
        // Navigate to item detail to see/manage claim
        // The refId is the claim ID, we need to get the item from it
        // For now, we can navigate to a generic claims page or show a modal
        // Since we don't have a direct claim page, let's just mark it read
        break;
      case 'ASSET_FOUND':
      case 'ITEM_MATCH':
        // Navigate to item detail
        if (notification.refId) {
          this.router.navigate(['/item', notification.refId]);
        }
        break;
      default:
        // Just mark as read, no navigation
        break;
    }
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    if (days < 7) return `${days} hari lalu`;
    
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  // Get icon based on notification type
  getNotificationIcon(refType: string): string {
    switch (refType) {
      case 'CLAIM_NEW':
        return 'ph-user-plus';
      case 'CLAIM_ANSWERED':
        return 'ph-chat-circle-text';
      case 'CLAIM_APPROVED':
        return 'ph-check-circle';
      case 'CLAIM_REJECTED':
        return 'ph-x-circle';
      case 'ASSET_FOUND':
      case 'ITEM_MATCH':
        return 'ph-magnifying-glass';
      default:
        return 'ph-bell';
    }
  }

  // Get icon color based on notification type
  getIconColor(refType: string, isRead: boolean): string {
    if (isRead) return 'text-gray-400';
    
    switch (refType) {
      case 'CLAIM_APPROVED':
        return 'text-green-600';
      case 'CLAIM_REJECTED':
        return 'text-red-600';
      case 'CLAIM_NEW':
      case 'CLAIM_ANSWERED':
        return 'text-blue-600';
      default:
        return 'text-gray-900';
    }
  }
}