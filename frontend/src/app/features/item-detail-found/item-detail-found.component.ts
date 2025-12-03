import { Component, OnInit, OnDestroy, AfterViewChecked, signal, computed, inject, ViewChild, ElementRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, ItemResponse, Category } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CubeLoaderComponent } from '../../shared/components/cube-loader/cube-loader.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { UserBadgeComponent } from '../../shared/components/user-badge/user-badge.component';
import { DeleteConfirmModalComponent } from '../../shared/components/delete-confirm-modal/delete-confirm-modal.component';
import { OwnerClaimModalComponent, OwnerClaimData } from './components/owner-claim-modal/owner-claim-modal.component';
import { FinderReviewModalComponent } from './components/finder-review-modal/finder-review-modal.component';
import { UserBadge } from '../../core/models/user.model';

// Leaflet will be dynamically imported only in browser

// API interface for claim on found items
export interface FoundItemClaim {
  id: string;
  item_id: string;
  owner_id: string;
  owner?: {
    id: string;
    name: string;
    phone?: string;
    role: string;
  };
  answers: { question: string; answer: string }[];
  contacts?: { platform: string; value: string }[];
  show_phone: boolean;
  status: string; // PENDING, APPROVED, REJECTED
  created_at: string;
}

@Component({
  selector: 'app-item-detail-found',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    CubeLoaderComponent,
    StatusBadgeComponent,
    UserBadgeComponent,
    OwnerClaimModalComponent,
    FinderReviewModalComponent,
    DeleteConfirmModalComponent
  ],
  templateUrl: './item-detail-found.component.html',
  styleUrl: './item-detail-found.component.css'
})
export class ItemDetailFoundComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;
  
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);

  // Map
  private map: any = null;
  private mapInitialized = false;

  // State
  item = signal<ItemResponse | null>(null);
  isLoading = signal(true);
  notFound = signal(false);
  currentUser = this.authService.currentUser;

  // Claims state (for found items, people claim they're the owner)
  claims = signal<FoundItemClaim[]>([]);
  myClaim = signal<FoundItemClaim | null>(null);

  // Modal states
  showOwnerClaimModal = signal(false);
  showFinderReviewModal = signal(false);
  showDeleteModal = signal(false);
  showEditTitleModal = signal(false);
  isDeleting = signal(false);
  selectedClaim = signal<FoundItemClaim | null>(null);

  // Edit states
  isEditingDescription = signal(false);
  editDescriptionText = '';
  isUploadingImage = signal(false);
  isSavingDescription = signal(false);
  isSavingTitle = signal(false);
  editTitleText = '';
  editCategoryId = '';

  // QR Verification states
  isVerifyingQR = signal(false);
  qrVerifyResult = signal<{ match: boolean; message: string } | null>(null);
  categories = signal<Category[]>([]);

  // Helper to get full image URL
  getImageUrl(path: string | undefined): string {
    return this.apiService.getStaticFileUrl(path || '');
  }

  // Computed - is current user the finder (post author)?
  isFinder = computed(() => {
    const item = this.item();
    const user = this.currentUser();
    if (!item || !user) return false;
    return item.finder?.id === user.id;
  });

  pendingClaims = computed(() => this.claims().filter(c => c.status === 'PENDING'));
  approvedClaim = computed(() => this.claims().find(c => c.status === 'APPROVED') || null);
  
  // Computed - does this item have an attached QR code?
  hasAttachedQR = computed(() => {
    const item = this.item();
    return item?.attached_qr ? true : false;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadItem(id);
    }
  }

  loadItem(id: string): void {
    this.isLoading.set(true);
    this.apiService.getItemById(id).subscribe({
      next: (item) => {
        this.item.set(item);
        this.isLoading.set(false);
        
        const currentUser = this.authService.currentUser();
        if (currentUser) {
          // If user is the finder, load all claims for review
          if (item.finder?.id === currentUser.id) {
            this.loadClaims(id);
          } else {
            // Otherwise, load user's own claim (if any)
            this.loadMyClaim(id);
          }
        }
      },
      error: () => {
        this.notFound.set(true);
        this.isLoading.set(false);
      }
    });
  }

  // Map backend claim response to FoundItemClaim format
  // Backend sends: finder (claimer), questions (with answers)
  // Frontend expects: owner (claimer), answers
  private mapClaimToFoundItemClaim(claim: any): FoundItemClaim {
    // Ensure questions is an array
    const questions = Array.isArray(claim.questions) ? claim.questions : [];
    return {
      id: claim.id,
      item_id: claim.item_id,
      owner_id: claim.finder_id, // In FOUND items, the claimer is the potential owner
      owner: claim.finder ? {
        id: claim.finder.id,
        name: claim.finder.name,
        phone: claim.finder.phone,
        role: claim.finder.role
      } : undefined,
      // Map questions (which contain answers) to answers array
      answers: questions.map((q: any) => ({
        question: q.question,
        answer: q.answer || ''
      })),
      contacts: claim.contacts,
      show_phone: claim.show_phone,
      status: claim.status,
      created_at: claim.created_at
    };
  }

  loadClaims(itemId: string): void {
    this.apiService.getClaims(itemId).subscribe({
      next: (claims: any) => {
        // Ensure claims is an array
        const claimsArray = Array.isArray(claims) ? claims : [];
        const mapped = claimsArray.map(c => this.mapClaimToFoundItemClaim(c));
        this.claims.set(mapped);
      },
      error: () => {}
    });
  }

  loadMyClaim(itemId: string): void {
    this.apiService.getMyClaim(itemId).subscribe({
      next: (claim: any) => {
        if (claim) {
          this.myClaim.set(this.mapClaimToFoundItemClaim(claim));
        }
      },
      error: () => {}
    });
  }

  // ========== OWNER ACTIONS (potential owner claims the item) ==========
  
  openOwnerClaimModal(): void {
    this.showOwnerClaimModal.set(true);
  }

  closeOwnerClaimModal(): void {
    this.showOwnerClaimModal.set(false);
  }

  // ========== QR VERIFICATION ==========
  
  verifyQR(): void {
    const item = this.item();
    if (!item) return;

    this.isVerifyingQR.set(true);
    this.qrVerifyResult.set(null);

    this.apiService.verifyQR(item.id).subscribe({
      next: (result) => {
        this.qrVerifyResult.set(result);
        this.isVerifyingQR.set(false);
        
        if (result.match) {
          // QR matched! Reload item to get updated status
          setTimeout(() => {
            this.loadItem(item.id);
          }, 1500);
        }
      },
      error: (err) => {
        this.qrVerifyResult.set({ 
          match: false, 
          message: err.error?.error || 'Gagal memverifikasi QR'
        });
        this.isVerifyingQR.set(false);
      }
    });
  }

  onOwnerClaimSubmit(data: OwnerClaimData): void {
    const item = this.item();
    if (!item || !item.verifications) return;

    // Map contacts to API format
    type PlatformType = 'WHATSAPP' | 'INSTAGRAM' | 'TELEGRAM' | 'LINE' | 'EMAIL' | 'OTHER';
    const contactsArray = Array.isArray(data.contacts) ? data.contacts : [];
    const answersArray = Array.isArray(data.answers) ? data.answers : [];
    const verificationsArray = Array.isArray(item.verifications) ? item.verifications : [];
    
    const contactsForApi = contactsArray.map(c => ({
      platform: c.type.toUpperCase() as PlatformType,
      value: c.value
    }));

    // For found items, the "claim" contains answers to verification questions
    const request = {
      answers: answersArray.map((ans, i) => ({
        question: verificationsArray[i]?.question || '',
        answer: ans
      })),
      show_phone: data.showPhone,
      contacts: contactsForApi
    };

    this.apiService.submitClaim(item.id, request as any).subscribe({
      next: (claim: any) => {
        this.myClaim.set(this.mapClaimToFoundItemClaim(claim));
        this.closeOwnerClaimModal();
      },
      error: (err) => {
        alert('Gagal: ' + (err.error?.error || err.message || 'Unknown error'));
      }
    });
  }

  // ========== FINDER ACTIONS (review owner's answers) ==========

  openFinderReviewModal(claim: FoundItemClaim): void {
    this.selectedClaim.set(claim);
    this.showFinderReviewModal.set(true);
  }

  closeFinderReviewModal(): void {
    this.showFinderReviewModal.set(false);
    this.selectedClaim.set(null);
  }

  approveOwnerClaim(claim: FoundItemClaim): void {
    this.apiService.decideClaim(claim.id, { status: 'APPROVED' }).subscribe({
      next: () => {
        const item = this.item();
        if (item) this.loadItem(item.id);
      },
      error: (err) => alert('Gagal: ' + (err.error?.error || err.message || 'Unknown error'))
    });
  }

  rejectOwnerClaim(claim: FoundItemClaim): void {
    this.apiService.decideClaim(claim.id, { status: 'REJECTED' }).subscribe({
      next: () => {
        const item = this.item();
        if (item) this.loadItem(item.id);
      },
      error: (err) => alert('Gagal: ' + (err.error?.error || err.message || 'Unknown error'))
    });
  }

  // ========== DELETE ACTIONS ==========

  goBack(): void {
    this.router.navigate(['/']);
  }

  openDeleteModal(): void {
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
  }

  confirmDelete(): void {
    const item = this.item();
    if (!item) return;

    this.isDeleting.set(true);
    this.apiService.deleteItem(item.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isDeleting.set(false);
        this.showDeleteModal.set(false);
        alert('Gagal: ' + (err.error?.error || err.message || 'Unknown error'));
      }
    });
  }

  // ========== STATUS HELPERS ==========

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'PENDING': 'Menunggu Verifikasi',
      'APPROVED': 'Disetujui',
      'REJECTED': 'Ditolak'
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  // Convert role from backend to badge type
  roleToBadge(role: string): UserBadge {
    const mapping: Record<string, UserBadge> = {
      // Backend role values
      'STAFF': 'gold',
      'STUDENT': 'blue',
      'PUBLIC': 'gray',
      // Alternative role values that might come from backend
      'DOSEN': 'gold',
      'STAFF_DOSEN': 'gold',
      'MAHASISWA': 'blue'
    };
    return mapping[role] || 'gray';
  }

  // ========== CONTACT HELPERS ==========

  getContactUrl(contact: { platform: string; value: string }): string {
    const urls: Record<string, (v: string) => string> = {
      'INSTAGRAM': (v) => `https://instagram.com/${v.replace('@', '')}`,
      'TELEGRAM': (v) => `https://t.me/${v.replace('@', '')}`,
      'TWITTER': (v) => `https://twitter.com/${v.replace('@', '')}`,
      'LINE': (v) => `https://line.me/ti/p/${v}`,
      'EMAIL': (v) => `mailto:${v}`,
      'WHATSAPP': (v) => this.getWhatsAppUrl(v),
    };
    return urls[contact.platform]?.(contact.value) || '#';
  }

  getWhatsAppUrl(phone: string | undefined): string {
    if (!phone) return '#';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    }
    if (!cleaned.startsWith('62') && cleaned.length <= 12) {
      cleaned = '62' + cleaned;
    }
    return `https://wa.me/${cleaned}`;
  }

  getContactIcon(platform: string): string {
    const icons: Record<string, string> = {
      'INSTAGRAM': 'ph-fill ph-instagram-logo text-lg',
      'TELEGRAM': 'ph-fill ph-telegram-logo text-lg',
      'TWITTER': 'ph-fill ph-twitter-logo text-lg',
      'LINE': 'ph-fill ph-chat-circle text-lg',
      'EMAIL': 'ph-fill ph-envelope text-lg',
      'WHATSAPP': 'ph-fill ph-whatsapp-logo text-lg',
    };
    return icons[platform] || 'ph ph-link text-lg';
  }

  getContactStyle(platform: string): string {
    const styles: Record<string, string> = {
      'INSTAGRAM': 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600',
      'TELEGRAM': 'bg-blue-500 text-white hover:bg-blue-600',
      'TWITTER': 'bg-sky-500 text-white hover:bg-sky-600',
      'LINE': 'bg-green-500 text-white hover:bg-green-600',
      'EMAIL': 'bg-gray-500 text-white hover:bg-gray-600',
      'WHATSAPP': 'bg-green-500 text-white hover:bg-green-600',
    };
    return styles[platform] || 'bg-gray-500 text-white hover:bg-gray-600';
  }

  // ========== STORAGE/COD HELPERS ==========

  getStorageLabel(method: string | undefined): string {
    const labels: Record<string, string> = {
      'BRING_BY_FINDER': 'Dibawa Penemu',
      'HANDED_TO_SECURITY': 'Dititipkan ke Satpam'
    };
    return labels[method || ''] || 'Tidak diketahui';
  }

  getStorageIcon(method: string | undefined): string {
    const icons: Record<string, string> = {
      'BRING_BY_FINDER': 'ph ph-hand-grabbing',
      'HANDED_TO_SECURITY': 'ph ph-shield-check'
    };
    return icons[method || ''] || 'ph ph-package';
  }

  formatRole(role: string): string {
    const roleMap: Record<string, string> = {
      'MAHASISWA': 'Mahasiswa',
      'STAFF_DOSEN': 'Staff / Dosen',
      'STAFF': 'Staff',
      'DOSEN': 'Dosen',
      'PUBLIC': 'Publik'
    };
    return roleMap[role] || 'Publik';
  }

  getRoleBadgeClass(role: string): string {
    const baseClass = 'text-xs px-2 py-0.5 rounded-full font-medium w-fit';
    const colorMap: Record<string, string> = {
      'MAHASISWA': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'STAFF_DOSEN': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      'STAFF': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      'DOSEN': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      'PUBLIC': 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
    };
    return `${baseClass} ${colorMap[role] || colorMap['PUBLIC']}`;
  }

  // ========== MAP HELPERS ==========

  ngAfterViewChecked(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const itemData = this.item();
    if (itemData?.location_latitude && itemData?.location_longitude && !this.mapInitialized) {
      this.initMap(itemData.location_latitude, itemData.location_longitude, itemData.location_name);
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private async initMap(lat: number, lng: number, locationName?: string): Promise<void> {
    const mapElement = document.getElementById('detail-map');
    if (!mapElement || this.mapInitialized) return;

    this.mapInitialized = true;

    // Dynamic import Leaflet only in browser - handle ESM default export
    const leafletModule = await import('leaflet');
    const L = (leafletModule as any).default || leafletModule;

    this.map = L.map('detail-map', {
      center: [lat, lng],
      zoom: 17,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);

    const customIcon = L.divIcon({
      html: '<div class="w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center"><i class="ph-fill ph-map-pin text-white text-sm"></i></div>',
      className: 'custom-marker',
      iconSize: [32, 32] as [number, number],
      iconAnchor: [16, 32] as [number, number]
    });

    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(this.map);
    
    if (locationName) {
      marker.bindPopup(`<b>${locationName}</b>`).openPopup();
    }
  }

  // ========== EDIT METHODS ==========

  triggerImageUpload(): void {
    this.imageInput?.nativeElement?.click();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const itemData = this.item();
    if (!itemData) return;

    this.isUploadingImage.set(true);

    this.apiService.uploadFile(file).subscribe({
      next: (res: { url: string }) => {
        this.apiService.updateItem(itemData.id, { image_url: res.url }).subscribe({
          next: () => {
            this.item.update(item => item ? { ...item, image_url: res.url } : null);
            this.isUploadingImage.set(false);
          },
          error: () => {
            alert('Gagal menyimpan gambar');
            this.isUploadingImage.set(false);
          }
        });
      },
      error: () => {
        alert('Gagal mengupload gambar');
        this.isUploadingImage.set(false);
      }
    });
  }

  startEditDescription(): void {
    const itemData = this.item();
    this.editDescriptionText = itemData?.description || '';
    this.isEditingDescription.set(true);
  }

  cancelEditDescription(): void {
    this.isEditingDescription.set(false);
  }

  saveDescription(): void {
    const itemData = this.item();
    if (!itemData) return;

    this.isSavingDescription.set(true);
    this.apiService.updateItem(itemData.id, { description: this.editDescriptionText }).subscribe({
      next: () => {
        this.item.update(item => item ? { ...item, description: this.editDescriptionText } : null);
        this.isEditingDescription.set(false);
        this.isSavingDescription.set(false);
      },
      error: () => {
        alert('Gagal menyimpan deskripsi');
        this.isSavingDescription.set(false);
      }
    });
  }

  openEditTitleModal(): void {
    const itemData = this.item();
    if (!itemData) return;
    this.editTitleText = itemData.title || '';
    
    // Load categories first, then set selected category
    if (this.categories().length === 0) {
      this.apiService.getCategories().subscribe({
        next: (cats) => {
          // Ensure cats is an array
          const categories = Array.isArray(cats) ? cats : [];
          this.categories.set(categories);
          // Set category ID after categories are loaded
          this.editCategoryId = itemData.category_id || '';
          console.log('Categories loaded:', cats);
          console.log('Current category_id:', itemData.category_id);
          console.log('Edit category_id set to:', this.editCategoryId);
          this.showEditTitleModal.set(true);
        },
        error: () => {
          console.error('Failed to load categories');
          this.editCategoryId = itemData.category_id || '';
          this.showEditTitleModal.set(true);
        }
      });
    } else {
      this.editCategoryId = itemData.category_id || '';
      console.log('Categories already loaded:', this.categories());
      console.log('Current category_id:', itemData.category_id);
      console.log('Edit category_id set to:', this.editCategoryId);
      this.showEditTitleModal.set(true);
    }
  }

  closeEditTitleModal(): void {
    this.showEditTitleModal.set(false);
  }

  saveTitle(): void {
    const itemData = this.item();
    if (!itemData) return;

    this.isSavingTitle.set(true);
    this.apiService.updateItem(itemData.id, { 
      title: this.editTitleText,
      category_id: this.editCategoryId 
    }).subscribe({
      next: () => {
        this.loadItem(itemData.id);
        this.showEditTitleModal.set(false);
        this.isSavingTitle.set(false);
      },
      error: () => {
        alert('Gagal menyimpan perubahan');
        this.isSavingTitle.set(false);
      }
    });
  }
}
