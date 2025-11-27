import { Component, OnInit, signal, computed, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Item, User } from '../../core/models';
import { MOCK_ITEMS, generateUserQRData } from '../../core/mocks';
import { StatusBadgeComponent, UserBadgeComponent, ConfirmModalComponent, QrDisplayComponent } from '../../shared/components';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent, UserBadgeComponent, ConfirmModalComponent, QrDisplayComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  currentUser = this.authService.currentUser;
  
  // User's items
  userItems = signal<Item[]>([]);
  selectedTab = signal<'all' | 'lost' | 'found' | 'claimed'>('all');
  
  // Filtered items based on selected tab
  filteredItems = computed(() => {
    const items = this.userItems();
    const tab = this.selectedTab();
    
    if (tab === 'all') return items;
    if (tab === 'claimed') return items.filter(i => i.status === 'claimed');
    return items.filter(i => i.status === tab);
  });

  // Settings
  notificationsEnabled = signal(true);

  // Modal states
  showLogoutModal = signal(false);
  showEditProfileModal = signal(false);
  showQRModal = signal(false);

  // QR Code URL
  qrCodeUrl = signal('');
  private isBrowser: boolean;

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.loadUserItems();
    this.generateQRUrl();
  }

  private generateQRUrl(): void {
    const user = this.currentUser();
    if (user && this.isBrowser) {
      // Use helper function from user.mock for consistency
      const encoded = generateUserQRData(user);
      const baseUrl = window.location.origin;
      this.qrCodeUrl.set(`${baseUrl}/u/${encoded}`);
    }
  }

  private loadUserItems(): void {
    const user = this.currentUser();
    if (user) {
      // Filter items reported by current user
      const items = MOCK_ITEMS.filter(item => item.reporterId === user.id);
      this.userItems.set(items);
    }
  }

  setTab(tab: 'all' | 'lost' | 'found' | 'claimed'): void {
    this.selectedTab.set(tab);
  }

  getTabCount(tab: 'all' | 'lost' | 'found' | 'claimed'): number {
    const items = this.userItems();
    if (tab === 'all') return items.length;
    if (tab === 'claimed') return items.filter(i => i.status === 'claimed').length;
    return items.filter(i => i.status === tab).length;
  }

  navigateToItem(item: Item): void {
    this.router.navigate(['/item', item.id], { queryParams: { from: 'profile' } });
  }

  toggleNotifications(): void {
    this.notificationsEnabled.update(v => !v);
  }

  // Logout
  openLogoutModal(): void {
    this.showLogoutModal.set(true);
  }

  closeLogoutModal(): void {
    this.showLogoutModal.set(false);
  }

  confirmLogout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  // Edit Profile
  openEditProfile(): void {
    this.showEditProfileModal.set(true);
  }

  closeEditProfile(): void {
    this.showEditProfileModal.set(false);
  }

  // QR Code
  openQRModal(): void {
    this.showQRModal.set(true);
  }

  closeQRModal(): void {
    this.showQRModal.set(false);
  }

  // Get category icon
  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      bags: 'ph-backpack',
      wallet: 'ph-wallet',
      phone: 'ph-device-mobile',
      electronics: 'ph-laptop',
      documents: 'ph-file-text',
      keys: 'ph-key',
      clothing: 'ph-t-shirt',
      others: 'ph-package'
    };
    return icons[category] || 'ph-package';
  }

  // Get location name
  getLocationName(item: Item): string {
    return typeof item.location === 'string' ? item.location : item.location.name;
  }

  // Get badge label
  getBadgeLabel(): string {
    const badge = this.currentUser()?.badge;
    switch (badge) {
      case 'gold': return 'Staff UII';
      case 'blue': return 'Mahasiswa UII';
      default: return 'Pengguna Umum';
    }
  }

  // Get role label
  getRoleLabel(): string {
    const role = this.currentUser()?.role;
    switch (role) {
      case 'student': return 'Mahasiswa';
      case 'staff': return 'Staff';
      default: return 'Umum';
    }
  }
}
