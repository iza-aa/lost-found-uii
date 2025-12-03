import { Component, OnInit, signal, computed, PLATFORM_ID, Inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ApiService, ItemResponse } from '../../core/services/api.service';
import { Item, User } from '../../core/models';
import { generateUserQRData } from '../../core/mocks';
import { StatusBadgeComponent, UserBadgeComponent, ConfirmModalComponent, QrDisplayComponent } from '../../shared/components';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StatusBadgeComponent, UserBadgeComponent, ConfirmModalComponent, QrDisplayComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  @ViewChild('avatarInput') avatarInput!: ElementRef<HTMLInputElement>;
  
  currentUser = this.authService.currentUser;
  
  // User's items from API
  userItems = signal<Item[]>([]);
  isLoadingItems = signal(false);
  selectedTab = signal<'all' | 'lost' | 'found' | 'completed'>('all');
  
  // Filtered items based on selected tab
  filteredItems = computed(() => {
    const items = this.userItems();
    const tab = this.selectedTab();
    
    if (tab === 'all') return items;
    if (tab === 'completed') return items.filter(i => i.reportStatus === 'claimed' || i.reportStatus === 'resolved');
    return items.filter(i => i.status === tab);
  });

  // Settings
  notificationsEnabled = signal(true);

  // Modal states
  showLogoutModal = signal(false);
  showEditProfileModal = signal(false);
  showQRModal = signal(false);
  showChangePasswordModal = signal(false);
  showHelpModal = signal(false);

  // Edit profile form
  editName = '';
  editPhone = '';
  editAvatarPreview = '';
  editAvatarFile: File | null = null;
  isSavingProfile = signal(false);

  // Change password form
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  isChangingPassword = signal(false);
  passwordError = signal('');

  // QR Code URL
  qrCodeUrl = signal('');
  private isBrowser: boolean;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
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
      const encoded = generateUserQRData(user);
      const baseUrl = window.location.origin;
      this.qrCodeUrl.set(`${baseUrl}/u/${encoded}`);
    }
  }

  private loadUserItems(): void {
    const user = this.currentUser();
    if (!user) return;
    
    this.isLoadingItems.set(true);
    
    this.apiService.getMyItems().subscribe({
      next: (apiItems) => {
        // Ensure apiItems is an array
        const items = Array.isArray(apiItems) ? apiItems : [];
        const mappedItems = this.mapApiItemsToFrontend(items);
        this.userItems.set(mappedItems);
        this.isLoadingItems.set(false);
      },
      error: (err) => {
        console.error('Failed to load items:', err);
        this.isLoadingItems.set(false);
      }
    });
  }

  private mapApiItemsToFrontend(apiItems: ItemResponse[]): Item[] {
    // Defensive check - ensure apiItems is actually an array
    if (!Array.isArray(apiItems)) {
      console.warn('mapApiItemsToFrontend: Expected array, got:', typeof apiItems);
      return [];
    }
    return apiItems.map(apiItem => ({
      id: apiItem.id,
      title: apiItem.title,
      description: apiItem.description || '',
      category: 'others' as any,
      status: apiItem.type === 'FOUND' ? 'found' : 'lost',
      reportStatus: apiItem.status === 'OPEN' ? 'active' : (apiItem.status === 'CLAIMED' ? 'claimed' : 'resolved') as any,
      imageUrl: this.apiService.getStaticFileUrl(apiItem.image_url || ''),
      date: new Date(apiItem.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
      location: { name: apiItem.location_name || 'Lokasi tidak diketahui', lat: 0, lng: 0 },
      reporterId: '',
      reporterName: '',
      reporterBadge: 'gray' as any,
      createdAt: new Date(apiItem.created_at),
    })) as Item[];
  }

  setTab(tab: 'all' | 'lost' | 'found' | 'completed'): void {
    this.selectedTab.set(tab);
  }

  getTabCount(tab: 'all' | 'lost' | 'found' | 'completed'): number {
    const items = this.userItems();
    if (tab === 'all') return items.length;
    if (tab === 'completed') return items.filter(i => i.reportStatus === 'claimed' || i.reportStatus === 'resolved').length;
    return items.filter(i => i.status === tab).length;
  }

  navigateToItem(item: Item): void {
    const route = item.status === 'found' ? '/found' : '/item';
    this.router.navigate([route, item.id], { queryParams: { from: 'profile' } });
  }

  toggleNotifications(): void {
    this.notificationsEnabled.update(v => !v);
  }

  // =============== LOGOUT ===============
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

  // =============== EDIT PROFILE ===============
  openEditProfile(): void {
    const user = this.currentUser();
    this.editName = user?.name || '';
    this.editPhone = user?.phone || '';
    this.editAvatarPreview = user?.avatar || '';
    this.editAvatarFile = null;
    this.showEditProfileModal.set(true);
  }

  closeEditProfile(): void {
    this.showEditProfileModal.set(false);
  }

  triggerAvatarUpload(): void {
    this.avatarInput?.nativeElement?.click();
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.editAvatarFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.editAvatarPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  saveProfile(): void {
    this.isSavingProfile.set(true);
    
    // If avatar changed, upload first
    if (this.editAvatarFile) {
      this.apiService.uploadImage(this.editAvatarFile).subscribe({
        next: (res) => {
          this.updateProfileData(res.url);
        },
        error: (err) => {
          console.error('Failed to upload avatar:', err);
          this.updateProfileData();
        }
      });
    } else {
      this.updateProfileData();
    }
  }

  private updateProfileData(avatarUrl?: string): void {
    const updates: any = {
      name: this.editName,
      phone: this.editPhone
    };
    
    if (avatarUrl) {
      updates.avatar = this.apiService.getStaticFileUrl(avatarUrl);
    }

    // Update via API
    this.apiService.updateProfile(updates).subscribe({
      next: () => {
        // Update local user
        this.authService.updateProfile(updates);
        this.isSavingProfile.set(false);
        this.closeEditProfile();
        // Regenerate QR with new data
        this.generateQRUrl();
      },
      error: (err) => {
        console.error('Failed to update profile:', err);
        // Still update locally even if API fails
        this.authService.updateProfile(updates);
        this.isSavingProfile.set(false);
        this.closeEditProfile();
        this.generateQRUrl();
      }
    });
  }

  // =============== CHANGE PASSWORD ===============
  openChangePasswordModal(): void {
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.passwordError.set('');
    this.showChangePasswordModal.set(true);
  }

  closeChangePasswordModal(): void {
    this.showChangePasswordModal.set(false);
  }

  changePassword(): void {
    // Validation
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.passwordError.set('Semua field harus diisi');
      return;
    }
    
    if (this.newPassword.length < 6) {
      this.passwordError.set('Password baru minimal 6 karakter');
      return;
    }
    
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError.set('Konfirmasi password tidak cocok');
      return;
    }

    this.isChangingPassword.set(true);
    this.passwordError.set('');

    this.apiService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.isChangingPassword.set(false);
        this.closeChangePasswordModal();
        alert('Password berhasil diubah!');
      },
      error: (err) => {
        this.isChangingPassword.set(false);
        this.passwordError.set(err.error?.error || 'Gagal mengubah password');
      }
    });
  }

  // =============== HELP ===============
  openHelpModal(): void {
    this.showHelpModal.set(true);
  }

  closeHelpModal(): void {
    this.showHelpModal.set(false);
  }

  // =============== QR CODE ===============
  openQRModal(): void {
    this.showQRModal.set(true);
  }

  closeQRModal(): void {
    this.showQRModal.set(false);
  }

  // =============== HELPERS ===============
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

  getLocationName(item: Item): string {
    return typeof item.location === 'string' ? item.location : item.location.name;
  }

  getBadgeLabel(): string {
    const badge = this.currentUser()?.badge;
    switch (badge) {
      case 'gold': return 'Staff UII';
      case 'blue': return 'Mahasiswa UII';
      default: return 'Pengguna Umum';
    }
  }

  getRoleLabel(): string {
    const role = this.currentUser()?.role;
    switch (role) {
      case 'student': return 'Mahasiswa';
      case 'staff': return 'Staff';
      default: return 'Umum';
    }
  }
}
