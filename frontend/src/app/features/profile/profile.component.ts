import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Item, User } from '../../core/models';
import { MOCK_ITEMS } from '../../core/mocks';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { UserBadgeComponent } from '../../shared/components/user-badge/user-badge.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent, UserBadgeComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
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

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserItems();
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
