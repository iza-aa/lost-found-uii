import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject, signal, computed } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import type * as LeafletTypes from 'leaflet';
import { Item, ReportStatus, Claimant, ClaimantStatus, Finder, VerificationAnswer } from '../../core/models';
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
  
  // Claimants/Pemohon - for Finder to manage claimants
  showClaimantsModal = signal(false);
  selectedClaimant = signal<Claimant | null>(null);
  showClaimantDetailModal = signal(false);
  showRejectReasonModal = signal(false);
  rejectReason = '';
  
  // For Claimer - check their own claim status
  userClaimStatus = computed(() => {
    const item = this.item();
    const user = this.currentUser();
    if (!item?.claimants || !user) return null;
    return item.claimants.find(c => c.claimerId === user.id);
  });

  // =====================
  // FINDERS (for Lost items) - people who claim to have found the item
  // =====================
  showFindersModal = signal(false);
  selectedFinder = signal<Finder | null>(null);
  showFinderDetailModal = signal(false);
  showFinderRejectReasonModal = signal(false);
  finderRejectReason = '';
  
  // Verification form for lost items (when someone claims they found it)
  showFinderVerificationModal = signal(false);
  finderVerificationForm = {
    answers: [] as { questionId: string; question: string; answer: string }[],
    photoUrl: '',
    photoPreview: '',
    additionalContact: ''
  };
  isSubmittingFinderVerification = signal(false);
  finderVerificationSuccess = signal(false);
  
  // For Finder - check their own finder status
  userFinderStatus = computed(() => {
    const item = this.item();
    const user = this.currentUser();
    if (!item?.finders || !user) return null;
    return item.finders.find(f => f.finderId === user.id);
  });
  
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

    // Simulate API call - Submit to claimants/pemohon table
    setTimeout(() => {
      const user = this.currentUser();
      const item = this.item();
      const isQrVerified = item?.isScannedByQr && this.isQrOwnerVerified();

      // Create new claimant entry
      const newClaimant: Claimant = {
        id: `claim-${Date.now()}`,
        claimerId: user?.id || '',
        claimerName: user?.name || '',
        claimerBadge: user?.badge || 'gray',
        claimerPhone: user?.phone,
        description: isQrVerified ? '(QR Verified Owner)' : this.verificationForm.description,
        photoUrl: this.verificationForm.photoUrl || undefined,
        additionalContact: this.verificationForm.additionalContact ? 
          { other: this.verificationForm.additionalContact } : undefined,
        status: 'pending',
        isQrVerified: isQrVerified,
        createdAt: new Date()
      };

      console.log('Claim submitted to Pemohon table:', newClaimant);

      // In real implementation:
      // - Backend receives this data and adds to claimants array
      // - Finder can see the list of claimants on their item detail page
      // - Finder can approve/reject claimants
      // - Approved claimant gets notification and can see finder's contact

      // Update item locally with new claimant
      this.item.update(current => {
        if (!current) return null;
        const claimants = current.claimants || [];
        return { ...current, claimants: [...claimants, newClaimant] };
      });

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
      
      // Create new claimant entry with QR verification
      const newClaimant: Claimant = {
        id: `claim-${Date.now()}`,
        claimerId: user?.id || '',
        claimerName: user?.name || '',
        claimerBadge: user?.badge || 'gray',
        claimerPhone: user?.phone,
        description: '(QR Verified Owner)',
        additionalContact: this.verificationForm.additionalContact ? 
          { other: this.verificationForm.additionalContact } : undefined,
        status: 'pending',
        isQrVerified: true,
        createdAt: new Date()
      };

      console.log('QR Verification submitted to Pemohon table:', newClaimant);

      // Update item locally with new claimant
      this.item.update(current => {
        if (!current) return null;
        const claimants = current.claimants || [];
        return { ...current, claimants: [...claimants, newClaimant] };
      });
      
      this.isSubmittingVerification.set(false);
      this.verificationSuccess.set(true);
      this.showQrVerificationModal.set(false);
    }, 1500);
  }

  // =====================
  // CLAIMANTS MANAGEMENT METHODS (for Finder)
  // =====================
  
  openClaimantsModal(): void {
    this.showClaimantsModal.set(true);
  }

  closeClaimantsModal(): void {
    this.showClaimantsModal.set(false);
  }

  viewClaimantDetail(claimant: Claimant): void {
    this.selectedClaimant.set(claimant);
    this.showClaimantDetailModal.set(true);
  }

  closeClaimantDetailModal(): void {
    this.showClaimantDetailModal.set(false);
    this.selectedClaimant.set(null);
  }

  approveClaimant(claimant: Claimant): void {
    // Update claimant status to approved
    this.item.update(current => {
      if (!current?.claimants) return current;
      const updatedClaimants = current.claimants.map(c => {
        if (c.id === claimant.id) {
          return { ...c, status: 'approved' as ClaimantStatus, updatedAt: new Date() };
        }
        // Optionally reject other pending claims when one is approved
        return c;
      });
      return { ...current, claimants: updatedClaimants, reportStatus: 'claimed' as ReportStatus };
    });

    console.log('Claimant approved:', claimant);
    this.closeClaimantDetailModal();
  }

  openRejectReasonModal(claimant: Claimant): void {
    this.selectedClaimant.set(claimant);
    this.rejectReason = '';
    this.showRejectReasonModal.set(true);
  }

  closeRejectReasonModal(): void {
    this.showRejectReasonModal.set(false);
    this.rejectReason = '';
  }

  rejectClaimant(): void {
    const claimant = this.selectedClaimant();
    if (!claimant) return;

    // Update claimant status to rejected with reason
    this.item.update(current => {
      if (!current?.claimants) return current;
      const updatedClaimants = current.claimants.map(c => {
        if (c.id === claimant.id) {
          return { 
            ...c, 
            status: 'rejected' as ClaimantStatus, 
            rejectionReason: this.rejectReason || 'Bukti tidak cukup',
            updatedAt: new Date() 
          };
        }
        return c;
      });
      return { ...current, claimants: updatedClaimants };
    });

    console.log('Claimant rejected:', claimant, 'Reason:', this.rejectReason);
    this.closeRejectReasonModal();
    this.closeClaimantDetailModal();
  }

  getClaimantStatusLabel(status: ClaimantStatus): string {
    switch (status) {
      case 'pending': return 'Menunggu';
      case 'approved': return 'Disetujui';
      case 'rejected': return 'Ditolak';
      default: return status;
    }
  }

  getClaimantStatusColor(status: ClaimantStatus): string {
    switch (status) {
      case 'pending': return 'yellow';
      case 'approved': return 'green';
      case 'rejected': return 'red';
      default: return 'gray';
    }
  }

  getPendingClaimantsCount(): number {
    const item = this.item();
    if (!item?.claimants) return 0;
    return item.claimants.filter(c => c.status === 'pending').length;
  }

  // =====================
  // FINDER VERIFICATION METHODS (for Lost items - someone claims they found it)
  // =====================
  
  openFinderVerificationModal(): void {
    const item = this.item();
    if (!item?.verificationQuestions) return;
    
    // Initialize answers array from questions
    this.finderVerificationForm.answers = item.verificationQuestions.map(q => ({
      questionId: q.id,
      question: q.question,
      answer: ''
    }));
    this.showFinderVerificationModal.set(true);
  }

  closeFinderVerificationModal(): void {
    this.showFinderVerificationModal.set(false);
    this.resetFinderVerificationForm();
  }

  resetFinderVerificationForm(): void {
    this.finderVerificationForm = {
      answers: [],
      photoUrl: '',
      photoPreview: '',
      additionalContact: ''
    };
    this.finderVerificationSuccess.set(false);
  }

  onFinderPhotoSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.finderVerificationForm.photoPreview = e.target?.result as string;
        this.finderVerificationForm.photoUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeFinderPhoto(): void {
    this.finderVerificationForm.photoUrl = '';
    this.finderVerificationForm.photoPreview = '';
  }

  canSubmitFinderVerification(): boolean {
    const item = this.item();
    if (!item?.verificationQuestions) return false;
    
    // Check that all required questions are answered
    const requiredQuestions = item.verificationQuestions.filter(q => q.isRequired);
    for (const q of requiredQuestions) {
      const answer = this.finderVerificationForm.answers.find(a => a.questionId === q.id);
      if (!answer || answer.answer.trim().length < 3) {
        return false;
      }
    }
    return true;
  }

  submitFinderVerification(): void {
    if (!this.canSubmitFinderVerification()) return;

    this.isSubmittingFinderVerification.set(true);

    // Simulate API call
    setTimeout(() => {
      const user = this.currentUser();
      const item = this.item();

      // Create new finder entry
      const newFinder: Finder = {
        id: `finder-${Date.now()}`,
        finderId: user?.id || '',
        finderName: user?.name || '',
        finderBadge: user?.badge || 'gray',
        finderPhone: user?.phone,
        answers: this.finderVerificationForm.answers as VerificationAnswer[],
        photoUrl: this.finderVerificationForm.photoUrl || undefined,
        additionalContact: this.finderVerificationForm.additionalContact ? 
          { other: this.finderVerificationForm.additionalContact } : undefined,
        status: 'pending',
        createdAt: new Date()
      };

      console.log('Finder submitted:', newFinder);

      // Update item locally with new finder
      this.item.update(current => {
        if (!current) return null;
        const finders = current.finders || [];
        return { ...current, finders: [...finders, newFinder] };
      });

      this.isSubmittingFinderVerification.set(false);
      this.finderVerificationSuccess.set(true);
    }, 1500);
  }

  // =====================
  // FINDERS MANAGEMENT METHODS (for Lost item owner)
  // =====================
  
  openFindersModal(): void {
    this.showFindersModal.set(true);
  }

  closeFindersModal(): void {
    this.showFindersModal.set(false);
  }

  viewFinderDetail(finder: Finder): void {
    this.selectedFinder.set(finder);
    this.showFinderDetailModal.set(true);
  }

  closeFinderDetailModal(): void {
    this.showFinderDetailModal.set(false);
    this.selectedFinder.set(null);
  }

  approveFinder(finder: Finder): void {
    // Update finder status to approved
    this.item.update(current => {
      if (!current?.finders) return current;
      const updatedFinders = current.finders.map(f => {
        if (f.id === finder.id) {
          return { ...f, status: 'approved' as ClaimantStatus, updatedAt: new Date() };
        }
        return f;
      });
      return { ...current, finders: updatedFinders, reportStatus: 'resolved' as ReportStatus };
    });

    console.log('Finder approved:', finder);
    this.closeFinderDetailModal();
  }

  openFinderRejectReasonModal(finder: Finder): void {
    this.selectedFinder.set(finder);
    this.finderRejectReason = '';
    this.showFinderRejectReasonModal.set(true);
  }

  closeFinderRejectReasonModal(): void {
    this.showFinderRejectReasonModal.set(false);
    this.finderRejectReason = '';
  }

  rejectFinder(): void {
    const finder = this.selectedFinder();
    if (!finder) return;

    // Update finder status to rejected with reason
    this.item.update(current => {
      if (!current?.finders) return current;
      const updatedFinders = current.finders.map(f => {
        if (f.id === finder.id) {
          return { 
            ...f, 
            status: 'rejected' as ClaimantStatus, 
            rejectionReason: this.finderRejectReason || 'Jawaban tidak sesuai',
            updatedAt: new Date() 
          };
        }
        return f;
      });
      return { ...current, finders: updatedFinders };
    });

    console.log('Finder rejected:', finder, 'Reason:', this.finderRejectReason);
    this.closeFinderRejectReasonModal();
    this.closeFinderDetailModal();
  }

  getFinderStatusLabel(status: ClaimantStatus): string {
    switch (status) {
      case 'pending': return 'Menunggu Verifikasi';
      case 'approved': return 'Disetujui';
      case 'rejected': return 'Ditolak';
      default: return status;
    }
  }

  getFinderStatusColor(status: ClaimantStatus): string {
    switch (status) {
      case 'pending': return 'yellow';
      case 'approved': return 'green';
      case 'rejected': return 'red';
      default: return 'gray';
    }
  }

  getPendingFindersCount(): number {
    const item = this.item();
    if (!item?.finders) return 0;
    return item.finders.filter(f => f.status === 'pending').length;
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
    // Check new format (contacts array) or legacy format
    return !!(alt.contacts && alt.contacts.length > 0) || !!(alt.instagram || alt.telegram || alt.line || alt.other);
  }
}
