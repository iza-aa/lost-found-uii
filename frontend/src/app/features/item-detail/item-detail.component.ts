import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import type * as LeafletTypes from 'leaflet';
import { Item, ReportStatus } from '../../core/models';
import { MOCK_ITEMS } from '../../core/mocks';
import { UserBadgeComponent } from '../../shared/components/user-badge/user-badge.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { CubeLoaderComponent } from '../../shared/components/cube-loader/cube-loader.component';
import { AuthService } from '../../core/services/auth.service';

type LeafletModule = typeof LeafletTypes;
let L: LeafletModule;

@Component({
  selector: 'app-item-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, UserBadgeComponent, StatusBadgeComponent, CubeLoaderComponent],
  templateUrl: './item-detail.component.html',
  styleUrl: './item-detail.component.css'
})
export class ItemDetailComponent implements OnInit, OnDestroy {
  private isBrowser: boolean;
  private desktopMap: LeafletTypes.Map | null = null;
  private mobileMap: LeafletTypes.Map | null = null;

  item = signal<Item | null>(null);
  isLoading = signal(true);
  notFound = signal(false);
  showContactModal = signal(false);
  currentUser = this.authService.currentUser;
  
  // Verification form for found items (when someone claims it's theirs)
  showVerificationModal = signal(false);
  verificationForm = {
    description: '',      // Required: ciri-ciri barang (not required for QR verification)
    photoUrl: '',         // Optional: foto bukti (not needed for QR verification)
    photoPreview: '',
    additionalContact: '' // Optional: IG, email, dll
  };
  isSubmittingVerification = signal(false);
  verificationSuccess = signal(false);
  
  // QR Verification
  isCheckingQrOwnership = signal(false);
  isQrOwnerVerified = signal(false);
  showQrVerificationModal = signal(false);
  
  // Owner actions
  showDeleteConfirm = signal(false);
  showCompleteConfirm = signal(false);
  
  private fromPage: string | null = null;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    // Check where user came from
    this.fromPage = this.route.snapshot.queryParamMap.get('from');
    
    const itemId = this.route.snapshot.paramMap.get('id');
    if (itemId) {
      this.loadItem(itemId);
    } else {
      this.notFound.set(true);
      this.isLoading.set(false);
    }
  }

  ngOnDestroy(): void {
    if (this.desktopMap) {
      this.desktopMap.remove();
      this.desktopMap = null;
    }
    if (this.mobileMap) {
      this.mobileMap.remove();
      this.mobileMap = null;
    }
  }

  private loadItem(id: string): void {
    // Simulate API call
    setTimeout(() => {
      const foundItem = MOCK_ITEMS.find(item => item.id === id);
      if (foundItem) {
        this.item.set(foundItem);
        this.isLoading.set(false);
        
        // Init map after item loaded
        if (this.isBrowser && this.hasCoordinates(foundItem)) {
          setTimeout(() => this.initMaps(foundItem), 100);
        }
      } else {
        this.notFound.set(true);
        this.isLoading.set(false);
      }
    }, 500);
  }

  private hasCoordinates(item: Item): boolean {
    return typeof item.location === 'object' && 'lat' in item.location;
  }

  private async initMaps(item: Item): Promise<void> {
    if (!this.isBrowser) return;
    if (typeof item.location === 'string') return;

    L = await import('leaflet');

    // Init desktop map
    const desktopMapEl = document.getElementById('detail-map');
    if (desktopMapEl && !this.desktopMap) {
      this.desktopMap = this.createMap('detail-map', item);
    }

    // Init mobile map
    const mobileMapEl = document.getElementById('detail-map-mobile');
    if (mobileMapEl && !this.mobileMap) {
      this.mobileMap = this.createMap('detail-map-mobile', item);
    }
  }

  private createMap(elementId: string, item: Item): LeafletTypes.Map | null {
    if (typeof item.location === 'string') return null;

    const map = L.map(elementId, {
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false
    }).setView([item.location.lat, item.location.lng], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    // Add marker
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="width:32px;height:32px;background:#FDBF0F;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
               <i class="ph-fill ph-map-pin" style="color:#003479;font-size:16px;"></i>
             </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    L.marker([item.location.lat, item.location.lng], { icon: customIcon })
      .addTo(map)
      .bindPopup(`<b>${item.location.name}</b>`);

    return map;
  }

  getLocationName(): string {
    const item = this.item();
    if (!item) return '';
    return typeof item.location === 'string' ? item.location : item.location.name;
  }

  hasMapLocation(): boolean {
    const item = this.item();
    if (!item) return false;
    return typeof item.location === 'object' && 'lat' in item.location;
  }

  getMapCoordinates(): string {
    const item = this.item();
    if (!item || typeof item.location === 'string') return '';
    return `${item.location.lat},${item.location.lng}`;
  }

  getCategoryIcon(): string {
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
    return icons[this.item()?.category || 'others'] || 'ph-package';
  }

  getCategoryLabel(): string {
    const labels: Record<string, string> = {
      bags: 'Tas',
      wallet: 'Dompet',
      phone: 'Handphone',
      electronics: 'Elektronik',
      documents: 'Dokumen',
      keys: 'Kunci',
      clothing: 'Pakaian',
      others: 'Lainnya'
    };
    return labels[this.item()?.category || 'others'] || 'Lainnya';
  }

  openContact(): void {
    this.showContactModal.set(true);
  }

  closeContact(): void {
    this.showContactModal.set(false);
  }

  callReporter(): void {
    const phone = this.item()?.reporterPhone;
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    }
  }

  whatsappReporter(): void {
    const phone = this.item()?.reporterPhone;
    const item = this.item();
    if (phone && item) {
      const message = encodeURIComponent(
        `Halo, saya melihat laporan "${item.title}" di Lost & Found UII. Apakah barang ini masih tersedia?`
      );
      // Remove leading 0 and add 62 for Indonesian numbers
      const waNumber = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
      window.open(`https://wa.me/${waNumber}?text=${message}`, '_blank');
    }
  }

  isOwnItem(): boolean {
    const item = this.item();
    const user = this.currentUser();
    return !!(item && user && item.reporterId === user.id);
  }

  goBack(): void {
    // Navigate back based on where user came from
    if (this.fromPage === 'radar') {
      this.router.navigate(['/radar']);
    } else if (this.fromPage === 'search') {
      this.router.navigate(['/search']);
    } else if (this.fromPage === 'profile') {
      this.router.navigate(['/profile']);
    } else {
      this.router.navigate(['/']);
    }
  }

  shareItem(): void {
    const item = this.item();
    if (!item) return;

    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: `${item.status === 'lost' ? 'Kehilangan' : 'Ditemukan'}: ${item.title}`,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link berhasil disalin!');
    }
  }

  // =====================
  // VERIFICATION METHODS (for Found items)
  // =====================
  openVerificationModal(): void {
    this.showVerificationModal.set(true);
  }

  closeVerificationModal(): void {
    this.showVerificationModal.set(false);
    this.resetVerificationForm();
  }

  resetVerificationForm(): void {
    this.verificationForm = {
      description: '',
      photoUrl: '',
      photoPreview: '',
      additionalContact: ''
    };
    this.verificationSuccess.set(false);
  }

  onVerificationPhotoSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.verificationForm.photoPreview = e.target?.result as string;
        this.verificationForm.photoUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeVerificationPhoto(): void {
    this.verificationForm.photoUrl = '';
    this.verificationForm.photoPreview = '';
  }

  canSubmitVerification(): boolean {
    // For QR-scanned items, no description needed since ownership is verified by QR
    const item = this.item();
    if (item?.isScannedByQr && this.isQrOwnerVerified()) {
      return true; // Can submit with just additional contact
    }
    return this.verificationForm.description.trim().length >= 10;
  }

  submitVerification(): void {
    if (!this.canSubmitVerification()) return;

    this.isSubmittingVerification.set(true);

    // Simulate API call - in real app this would send to backend
    // Backend would then use Meta WhatsApp API to send message to finder
    setTimeout(() => {
      const user = this.currentUser();
      const item = this.item();
      const isQrVerified = item?.isScannedByQr && this.isQrOwnerVerified();

      console.log('Verification submitted:', {
        itemId: item?.id,
        claimerId: user?.id,
        claimerName: user?.name,
        claimerPhone: user?.phone,
        isQrVerified: isQrVerified,
        description: isQrVerified ? '(QR Verified Owner)' : this.verificationForm.description,
        photoUrl: this.verificationForm.photoUrl,
        additionalContact: this.verificationForm.additionalContact
      });

      // In real implementation:
      // - Backend receives this data
      // - Backend sends WhatsApp message to the finder (item.reporterPhone)
      // - For QR verified: Message format is different
      //   "NIM xxx nama yyy adalah pemilik barang (berdasarkan QR sudah diverifikasi sistem) kontak: zzz"
      // - For non-QR: 
      //   "NIM xxx nama yyy mengaku sebagai pemilik dan mengirim bukti..."
      // - Finder's phone number is never exposed to the claimer

      this.isSubmittingVerification.set(false);
      this.verificationSuccess.set(true);
    }, 1500);
  }

  // =====================
  // QR VERIFICATION METHODS
  // =====================
  
  // Check if current user is the QR owner for this item
  verifyQrOwnership(): void {
    this.isCheckingQrOwnership.set(true);
    
    // Simulate checking if current user matches the QR owner
    setTimeout(() => {
      const user = this.currentUser();
      const item = this.item();
      
      if (user && item?.isScannedByQr) {
        // Check if user ID or phone matches the scanned QR owner
        const isOwner = user.id === item.scannedQrOwnerId || 
                        user.phone === item.scannedQrOwnerPhone;
        
        this.isQrOwnerVerified.set(isOwner);
        
        if (isOwner) {
          // User is verified as owner, show simplified verification modal
          this.showQrVerificationModal.set(true);
        } else {
          // User is not the owner based on QR
          alert('QR tidak cocok dengan akun Anda. Hubungi admin jika ini adalah barang Anda.');
        }
      }
      
      this.isCheckingQrOwnership.set(false);
    }, 1500);
  }

  closeQrVerificationModal(): void {
    this.showQrVerificationModal.set(false);
  }

  submitQrVerification(): void {
    this.isSubmittingVerification.set(true);
    
    setTimeout(() => {
      const user = this.currentUser();
      const item = this.item();
      
      console.log('QR Verification submitted:', {
        itemId: item?.id,
        ownerId: user?.id,
        ownerName: user?.name,
        ownerPhone: user?.phone,
        ownerStudentId: user?.studentId,
        ownerEmployeeId: user?.employeeId,
        isQrVerified: true,
        additionalContact: this.verificationForm.additionalContact
      });

      // Message to finder:
      // "NIM xxx nama yyy adalah pemilik barang (berdasarkan QR sudah diverifikasi sistem)"
      // "Kontak yang bisa dihubungi: zzz"
      
      this.isSubmittingVerification.set(false);
      this.verificationSuccess.set(true);
      this.showQrVerificationModal.set(false);
    }, 1500);
  }

  // =====================
  // OWNER ACTION METHODS
  // =====================
  
  // Edit item
  editItem(): void {
    const item = this.item();
    if (item) {
      this.router.navigate(['/post'], { queryParams: { edit: item.id } });
    }
  }

  // Delete item
  openDeleteConfirm(): void {
    this.showDeleteConfirm.set(true);
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm.set(false);
  }

  confirmDelete(): void {
    const item = this.item();
    if (!item) return;

    // Simulate API call
    console.log('Deleting item:', item.id);
    
    // In real implementation, call API to delete
    // Then navigate back to home
    this.router.navigate(['/']);
  }

  // Complete/Resolve item
  openCompleteConfirm(): void {
    this.showCompleteConfirm.set(true);
  }

  closeCompleteConfirm(): void {
    this.showCompleteConfirm.set(false);
  }

  confirmComplete(): void {
    const item = this.item();
    if (!item) return;

    // Simulate API call
    const newStatus: ReportStatus = item.status === 'found' ? 'claimed' : 'resolved';
    console.log('Completing item:', item.id, 'New status:', newStatus);
    
    // Update item status
    this.item.update(current => current ? { ...current, reportStatus: newStatus } : null);
    this.showCompleteConfirm.set(false);
  }

  // Get report status label
  getReportStatusLabel(): string {
    const item = this.item();
    if (!item) return '';
    
    switch (item.reportStatus) {
      case 'claimed':
        return 'Diklaim';
      case 'resolved':
        return 'Selesai';
      default:
        return 'Aktif';
    }
  }

  getReportStatusColor(): string {
    const item = this.item();
    if (!item) return 'gray';
    
    switch (item.reportStatus) {
      case 'claimed':
        return 'purple';
      case 'resolved':
        return 'green';
      default:
        return 'blue';
    }
  }

  // Check if item has alternative contact
  hasAlternativeContact(): boolean {
    const item = this.item();
    if (!item?.alternativeContact) return false;
    const alt = item.alternativeContact;
    return !!(alt.instagram || alt.telegram || alt.line || alt.other);
  }
}
