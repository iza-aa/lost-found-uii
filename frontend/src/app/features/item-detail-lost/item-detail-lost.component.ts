import { Component, OnInit, OnDestroy, AfterViewChecked, signal, computed, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, ItemResponse, ClaimResponse, ClaimRequest, AnswerClaimRequest, Category } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CubeLoaderComponent } from '../../shared/components/cube-loader/cube-loader.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { UserBadgeComponent } from '../../shared/components/user-badge/user-badge.component';
import { ContactButtonsComponent } from '../../shared/components/contact-buttons/contact-buttons.component';
import { DeleteConfirmModalComponent } from '../../shared/components/delete-confirm-modal/delete-confirm-modal.component';
import { FinderClaimModalComponent, FinderClaimData } from './components/finder-claim-modal/finder-claim-modal.component';
import { OwnerAnswerModalComponent, AnswerData } from './components/owner-answer-modal/owner-answer-modal.component';
import * as L from 'leaflet';

@Component({
  selector: 'app-item-detail-lost',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    CubeLoaderComponent,
    StatusBadgeComponent,
    UserBadgeComponent,
    ContactButtonsComponent,
    FinderClaimModalComponent,
    OwnerAnswerModalComponent,
    DeleteConfirmModalComponent
  ],
  templateUrl: './item-detail-lost.component.html',
  styleUrl: './item-detail-lost.component.css'
})
export class ItemDetailLostComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild(FinderClaimModalComponent) finderModal!: FinderClaimModalComponent;
  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;
  
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  // Map
  private map: L.Map | null = null;
  private mapInitialized = false;

  // State
  item = signal<ItemResponse | null>(null);
  isLoading = signal(true);
  notFound = signal(false);
  currentUser = this.authService.currentUser;

  // Claims state
  claims = signal<ClaimResponse[]>([]);
  myClaim = signal<ClaimResponse | null>(null);

  // Modal states
  showFinderModal = signal(false);
  showAnswerModal = signal(false);
  showDeleteModal = signal(false);
  showEditTitleModal = signal(false);
  isDeleting = signal(false);
  selectedClaim = signal<ClaimResponse | null>(null);

  // Edit states
  isEditingDescription = signal(false);
  editDescriptionText = '';  // Regular property for ngModel
  isUploadingImage = signal(false);
  isSavingDescription = signal(false);
  isSavingTitle = signal(false);
  editTitleText = '';
  editCategoryId = '';
  categories = signal<Category[]>([]);

  // Helper to get full image URL
  getImageUrl(path: string | undefined): string {
    return this.apiService.getStaticFileUrl(path || '');
  }

  // Computed
  isOwner = computed(() => {
    const item = this.item();
    const user = this.currentUser();
    if (!item || !user) return false;
    return item.owner?.id === user.id;
  });

  pendingClaims = computed(() => this.claims().filter(c => c.status === 'PENDING'));
  approvedClaim = computed(() => this.claims().find(c => c.status === 'APPROVED') || null);

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
        
        const user = this.currentUser();
        if (!user) return;

        // Owner loads all claims
        if (item.owner?.id === user.id) {
          this.loadClaims(id);
        } else {
          // Non-owner loads their own claim
          this.loadMyClaim(id);
        }
      },
      error: () => {
        this.notFound.set(true);
        this.isLoading.set(false);
      }
    });
  }

  loadClaims(itemId: string): void {
    this.apiService.getClaims(itemId).subscribe({
      next: (claims) => this.claims.set(claims || []),
      error: () => {}
    });
  }

  loadMyClaim(itemId: string): void {
    this.apiService.getMyClaim(itemId).subscribe({
      next: (claim) => this.myClaim.set(claim),
      error: () => {}
    });
  }

  // ========== FINDER ACTIONS ==========
  
  openFinderModal(): void {
    this.showFinderModal.set(true);
  }

  closeFinderModal(): void {
    this.showFinderModal.set(false);
    if (this.finderModal) {
      this.finderModal.reset();
    }
  }

  onFinderSubmit(data: FinderClaimData): void {
    const item = this.item();
    if (!item) return;

    // Map contacts to API format
    type PlatformType = 'WHATSAPP' | 'INSTAGRAM' | 'TELEGRAM' | 'LINE' | 'EMAIL' | 'OTHER';
    const contactsForApi = data.contacts.map(c => ({
      platform: c.type.toUpperCase() as PlatformType,
      value: c.value
    }));

    const request: ClaimRequest = {
      questions: data.questions.map(q => ({ question: q })),
      show_phone: data.showPhone,
      contacts: contactsForApi,
      note: ''
    };

    this.apiService.submitClaim(item.id, request).subscribe({
      next: (claim) => {
        this.myClaim.set(claim);
        this.closeFinderModal();
      },
      error: (err) => {
        alert('Gagal: ' + (err.error?.error || 'Unknown error'));
      }
    });
  }

  // Finder approves/rejects owner's answers
  approveOwnerAnswers(): void {
    const claim = this.myClaim();
    if (!claim) return;

    this.apiService.decideClaim(claim.id, { status: 'APPROVED' }).subscribe({
      next: () => {
        const item = this.item();
        if (item) this.loadItem(item.id);
      },
      error: (err) => alert('Gagal: ' + (err.error?.error || 'Unknown error'))
    });
  }

  rejectOwnerAnswers(): void {
    const claim = this.myClaim();
    if (!claim) return;

    this.apiService.decideClaim(claim.id, { status: 'REJECTED' }).subscribe({
      next: () => {
        const item = this.item();
        if (item) this.loadItem(item.id);
      },
      error: (err) => alert('Gagal: ' + (err.error?.error || 'Unknown error'))
    });
  }

  // ========== OWNER ACTIONS ==========

  openAnswerModal(claim: ClaimResponse): void {
    this.selectedClaim.set(claim);
    this.showAnswerModal.set(true);
  }

  closeAnswerModal(): void {
    this.showAnswerModal.set(false);
    this.selectedClaim.set(null);
  }

  onAnswerSubmit(answers: AnswerData[]): void {
    const claim = this.selectedClaim();
    if (!claim) return;

    const request: AnswerClaimRequest = {
      answers: answers.map(a => ({
        question_id: a.questionId,
        answer: a.answer
      }))
    };

    this.apiService.answerClaim(claim.id, request).subscribe({
      next: () => {
        this.closeAnswerModal();
        const item = this.item();
        if (item) this.loadClaims(item.id);
      },
      error: (err) => alert('Gagal: ' + (err.error?.error || 'Unknown error'))
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
        alert('Gagal: ' + (err.error?.error || 'Unknown error'));
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'PENDING': 'Menunggu Jawaban',
      'PENDING_APPROVAL': 'Menunggu Verifikasi',
      'APPROVED': 'Disetujui',
      'REJECTED': 'Ditolak'
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'PENDING_APPROVAL': 'bg-blue-100 text-blue-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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

  // Format phone number for WhatsApp (Indonesian format)
  getWhatsAppUrl(phone: string | undefined): string {
    if (!phone) return '#';
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    // If starts with 0, replace with 62 (Indonesia code)
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    }
    // If doesn't start with country code, assume Indonesia
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

  // ========== URGENCY HELPERS ==========

  getUrgencyClass(urgency: string): string {
    const classes: Record<string, string> = {
      'NORMAL': 'inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-full',
      'HIGH': 'inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-sm font-medium rounded-full',
      'CRITICAL': 'inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-medium rounded-full',
    };
    return classes[urgency] || classes['NORMAL'];
  }

  getUrgencyIcon(urgency: string): string {
    const icons: Record<string, string> = {
      'NORMAL': 'ph ph-circle',
      'HIGH': 'ph-fill ph-warning',
      'CRITICAL': 'ph-fill ph-warning-circle',
    };
    return icons[urgency] || icons['NORMAL'];
  }

  getUrgencyLabel(urgency: string): string {
    const labels: Record<string, string> = {
      'NORMAL': 'Biasa',
      'HIGH': 'Penting',
      'CRITICAL': 'Sangat Penting',
    };
    return labels[urgency] || labels['NORMAL'];
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

  private initMap(lat: number, lng: number, locationName?: string): void {
    const mapElement = document.getElementById('detail-map');
    if (!mapElement || this.mapInitialized) return;

    this.mapInitialized = true;

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

    // Custom marker
    const customIcon = L.divIcon({
      html: '<div class="w-8 h-8 bg-red-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center"><i class="ph-fill ph-map-pin text-white text-sm"></i></div>',
      className: 'custom-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(this.map);
    
    if (locationName) {
      marker.bindPopup(`<b>${locationName}</b>`).openPopup();
    }
  }

  // ========== EDIT METHODS ==========

  // Image Edit
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
        // Update item with new image
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

  // Description Edit
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

  // Title & Category Edit
  openEditTitleModal(): void {
    const itemData = this.item();
    if (!itemData) return;
    this.editTitleText = itemData.title || '';
    
    // Load categories first, then set selected category
    if (this.categories().length === 0) {
      this.apiService.getCategories().subscribe({
        next: (cats) => {
          this.categories.set(cats);
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

    console.log('Saving title:', this.editTitleText);
    console.log('Saving category_id:', this.editCategoryId);

    this.isSavingTitle.set(true);
    this.apiService.updateItem(itemData.id, { 
      title: this.editTitleText,
      category_id: this.editCategoryId 
    }).subscribe({
      next: () => {
        // Reload item to get fresh data with category name
        this.loadItem(itemData.id);
        this.showEditTitleModal.set(false);
        this.isSavingTitle.set(false);
      },
      error: (err) => {
        console.error('Error saving:', err);
        alert('Gagal menyimpan perubahan');
        this.isSavingTitle.set(false);
      }
    });
  }
}
