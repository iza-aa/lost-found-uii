import { Component, OnInit, AfterViewInit, OnDestroy, PLATFORM_ID, Inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import type * as LeafletTypes from 'leaflet';
import { Item, ItemCategory, ItemStatus, UrgencyLevel, StorageLocation, AlternativeContact, ReportStatus, User } from '../../core/models';
import { MOCK_CATEGORIES, MOCK_LOCATIONS, MOCK_ITEMS, UII_CENTER, CampusLocation, MOCK_USERS } from '../../core/mocks';
import { AuthService } from '../../core/services/auth.service';

// Leaflet types only - actual import is dynamic
type LeafletModule = typeof LeafletTypes;
let L: LeafletModule;

@Component({
  selector: 'app-post-item',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './post-item.component.html',
  styleUrl: './post-item.component.css'
})
export class PostItemComponent implements OnInit, AfterViewInit, OnDestroy {
  private isBrowser: boolean;
  private map: LeafletTypes.Map | null = null;
  private marker: LeafletTypes.Marker | null = null;

  // QR Scan mode - when user scans a QR code and reports found item
  isQrScanMode = signal(false);
  qrOwner = signal<User | null>(null);

  // Steps: Lost=7 steps (includes suggestions), Found=6 steps (no suggestions), QR=5 steps (no status selection)
  currentStep = signal(1);
  get totalSteps(): number {
    if (this.isQrScanMode()) return 5; // QR mode: Image, Detail, Category, Location, Info
    return this.formData.status === 'found' ? 6 : 7;
  }
  get stepsArray(): number[] {
    return Array.from({ length: this.totalSteps }, (_, i) => i + 1);
  }
  isSubmitting = signal(false);
  isSuccess = signal(false);
  isCheckingSuggestions = signal(false);

  // Suggestions
  similarItems = signal<Item[]>([]);
  selectedSuggestion = signal<Item | null>(null);

  // Custom location
  customLocationName = '';
  
  // Warning modal for found items
  showWarningModal = signal(false);
  warningAccepted = signal(false);

  // Form Data
  formData = {
    status: '' as ItemStatus | '',
    imageUrl: '',
    imagePreview: '',
    title: '',
    description: '',
    category: '' as ItemCategory | '',
    location: null as CampusLocation | null,
    date: '',
    time: '',
    // Lost specific
    reward: false,
    urgency: 'normal' as UrgencyLevel,
    exposePhone: true,              // NEW: mau ekspos no WA?
    alternativeContact: {           // NEW: kontak alternatif jika tidak ekspos phone
      instagram: '',
      telegram: '',
      line: '',
      other: ''
    } as AlternativeContact,
    // Found specific
    storageLocation: 'with-me' as StorageLocation,
    entrustedTo: '',
    willingToDeliver: false,        // DEPRECATED
    willingToCod: false             // NEW: bersedia COD di tengah/kampus
  };

  // Data
  categories = MOCK_CATEGORIES.filter(c => c.id !== 'all') as Array<{id: ItemCategory; label: string; icon: string}>;
  locations = MOCK_LOCATIONS;
  
  // Urgency options
  urgencyOptions: { value: UrgencyLevel; label: string; icon: string; color: string }[] = [
    { value: 'normal', label: 'Biasa', icon: 'ph-circle', color: 'gray' },
    { value: 'important', label: 'Penting', icon: 'ph-warning', color: 'yellow' },
    { value: 'very-important', label: 'Sangat Penting', icon: 'ph-warning-octagon', color: 'red' }
  ];
  
  // Storage location options
  storageOptions: { value: StorageLocation; label: string; icon: string; description: string }[] = [
    { value: 'with-me', label: 'Saya Bawa', icon: 'ph-hand-grabbing', description: 'Barang ada di tangan saya' },
    { value: 'entrusted', label: 'Dititipkan', icon: 'ph-user-check', description: 'Barang dititipkan ke orang lain' }
  ];

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.formData.date = this.getTodayDate();
    this.formData.time = this.getCurrentTime();
    
    // Check if this is a QR scan mode
    const isQr = this.route.snapshot.queryParamMap.get('qr');
    const qrData = this.route.snapshot.queryParamMap.get('qrData');
    
    if (isQr === 'true' && qrData) {
      this.initQrScanMode(qrData);
    }
  }

  // Initialize QR Scan mode
  private initQrScanMode(qrData: string): void {
    try {
      const decoded = atob(qrData);
      const userData = JSON.parse(decoded);
      
      if (userData && userData.name && userData.phone) {
        const qrUser: User = {
          id: userData.id || 'qr-user',
          name: userData.name,
          email: '',
          phone: userData.phone,
          badge: userData.badge || 'gray',
          role: userData.badge === 'gold' ? 'staff' : userData.badge === 'blue' ? 'student' : 'public',
          avatar: userData.avatar,
          faculty: userData.faculty,
          studentId: userData.studentId,
          employeeId: userData.employeeId
        };
        
        this.qrOwner.set(qrUser);
        this.isQrScanMode.set(true);
        this.formData.status = 'found'; // QR scan is always "found" item
        this.warningAccepted.set(true); // Auto-accept warning for QR mode
      }
    } catch {
      // Invalid QR data, redirect to normal post-item
      console.error('Invalid QR data');
    }
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.destroyMap();
  }

  private destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    if (this.marker) {
      this.marker = null;
    }
  }

  // Step Navigation
  nextStep(): void {
    if (this.canProceed()) {
      // For QR mode: submit after step 5
      if (this.isQrScanMode() && this.currentStep() === 5) {
        this.submitForm();
        return;
      }
      
      // For Found items: submit after step 6 (no suggestions step)
      if (this.formData.status === 'found' && !this.isQrScanMode() && this.currentStep() === 6) {
        this.submitForm();
        return;
      }
      
      if (this.currentStep() < this.totalSteps) {
        // Destroy map before leaving map step
        const mapStep = this.isQrScanMode() ? 4 : 5;
        if (this.currentStep() === mapStep) {
          this.destroyMap();
        }
        
        this.currentStep.update(v => v + 1);
        
        // Init map on map step
        const nextMapStep = this.isQrScanMode() ? 4 : 5;
        if (this.currentStep() === nextMapStep && this.isBrowser) {
          setTimeout(() => this.initMap(), 100);
        }
        
        // Step 7: Check for similar items (only for Lost items, non-QR mode)
        if (this.currentStep() === 7 && this.formData.status === 'lost' && !this.isQrScanMode()) {
          this.checkSimilarItems();
        }
      }
    }
  }

  prevStep(): void {
    // In QR mode, step 1 cannot go back
    if (this.isQrScanMode() && this.currentStep() === 1) {
      return;
    }
    
    if (this.currentStep() > 1) {
      // Destroy map before leaving map step
      const mapStep = this.isQrScanMode() ? 4 : 5;
      if (this.currentStep() === mapStep) {
        this.destroyMap();
      }
      
      this.currentStep.update(v => v - 1);
      
      // Re-init map when going back to map step
      if (this.currentStep() === mapStep && this.isBrowser) {
        setTimeout(() => this.initMap(), 100);
      }
    }
  }

  goToStep(step: number): void {
    if (step <= this.currentStep() && step >= 1) {
      // Destroy map if leaving map step
      const mapStep = this.isQrScanMode() ? 4 : 5;
      if (this.currentStep() === mapStep && step !== mapStep) {
        this.destroyMap();
      }
      
      this.currentStep.set(step);
      
      // Init map when going to map step
      if (step === mapStep && this.isBrowser) {
        setTimeout(() => this.initMap(), 100);
      }
    }
  }

  canProceed(): boolean {
    // QR Scan mode has different steps
    if (this.isQrScanMode()) {
      switch (this.currentStep()) {
        case 1: // Image
          return true;
        case 2: // Title + Description
          return this.formData.title.trim().length >= 3 && 
                 this.formData.description.trim().length >= 10;
        case 3: // Category
          return this.formData.category !== '';
        case 4: // Location
          if (this.isCustomLocation()) {
            return this.formData.location !== null && this.customLocationName.trim().length >= 3;
          }
          return this.formData.location !== null;
        case 5: // Additional Info
          return true;
        default:
          return false;
      }
    }
    
    // Normal mode
    switch (this.currentStep()) {
      case 1:
        return this.formData.status !== '';
      case 2:
        return true;
      case 3:
        return this.formData.title.trim().length >= 3 && 
               this.formData.description.trim().length >= 10;
      case 4:
        return this.formData.category !== '';
      case 5:
        // If custom location, require name to be filled
        if (this.isCustomLocation()) {
          return this.formData.location !== null && this.customLocationName.trim().length >= 3;
        }
        return this.formData.location !== null;
      case 6:
        // FOUND: Must accept warning first, then if 'entrusted', require entrustedTo
        if (this.formData.status === 'found') {
          if (!this.warningAccepted()) return false;
          if (this.formData.storageLocation === 'entrusted') {
            return this.formData.entrustedTo.trim().length >= 3;
          }
          return true;
        }
        // LOST: If not exposing phone, require at least one alternative contact
        if (this.formData.status === 'lost' && !this.formData.exposePhone) {
          const alt = this.formData.alternativeContact;
          return !!(alt.instagram || alt.telegram || alt.line || alt.other);
        }
        return true;
      case 7:
        return true; // Can always proceed from suggestions
      default:
        return false;
    }
  }

  // Check if current location is custom (not from predefined list)
  isCustomLocation(): boolean {
    return this.formData.location?.id === 'custom';
  }

  // Update custom location name
  updateCustomLocationName(): void {
    if (this.formData.location && this.formData.location.id === 'custom') {
      this.formData.location = {
        ...this.formData.location,
        name: this.customLocationName.trim() || 'Lokasi Custom',
        description: `Koordinat: ${this.formData.location.lat.toFixed(6)}, ${this.formData.location.lng.toFixed(6)}`
      };
    }
  }
  // Step 1: Status
  selectStatus(status: ItemStatus): void {
    this.formData.status = status;
  }

  // Step 2: Image
  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        this.formData.imagePreview = e.target?.result as string;
        this.formData.imageUrl = e.target?.result as string;
      };
      
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.formData.imageUrl = '';
    this.formData.imagePreview = '';
  }

  // Step 4: Category
  selectCategory(categoryId: ItemCategory): void {
    this.formData.category = categoryId;
  }

  getCategoryIcon(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.icon || 'ph-package';
  }

  getCategoryLabel(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.label || categoryId;
  }

  // Step 5: Map
  private async initMap(): Promise<void> {
    if (!this.isBrowser || this.map) return;

    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    // Dynamic import of Leaflet (browser only)
    L = await import('leaflet');

    this.map = L.map('map').setView([UII_CENTER.lat, UII_CENTER.lng], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    // Add markers for campus locations
    this.locations.forEach(loc => {
      if (loc.id !== 'lainnya') {
        const circleMarker = L.circleMarker([loc.lat, loc.lng], {
          radius: 10,
          fillColor: '#003479',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(this.map!);

        circleMarker.bindPopup(`<b>${loc.name}</b>`);
        
        circleMarker.on('click', () => {
          this.selectLocation(loc);
        });
      }
    });

    // Click on map
    this.map.on('click', (e: LeafletTypes.LeafletMouseEvent) => {
      // DEBUG: Log coordinates for easy copying
      console.log(`📍 Koordinat: { lat: ${e.latlng.lat}, lng: ${e.latlng.lng} }`);
      
      // Reset custom location name when clicking new custom point
      this.customLocationName = '';
      
      const customLocation: CampusLocation = {
        id: 'custom',
        name: 'Lokasi Custom (isi nama lokasi)',
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        description: `Koordinat: ${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`
      };
      this.selectLocation(customLocation);
    });

    // Restore marker if location was already selected
    if (this.formData.location) {
      this.restoreMarker(this.formData.location);
    }
  }

  private restoreMarker(location: CampusLocation): void {
    if (!this.map || !L) return;

    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="width:32px;height:32px;background:#FDBF0F;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
               <i class="ph-fill ph-map-pin" style="color:#003479;font-size:16px;"></i>
             </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    this.marker = L.marker([location.lat, location.lng], { icon: customIcon }).addTo(this.map);
    this.marker.bindPopup(`<b>${location.name}</b>`);
    this.map.setView([location.lat, location.lng], 17);
  }

  selectLocation(location: CampusLocation): void {
    this.formData.location = location;
    
    // Reset custom name if selecting from predefined list
    if (location.id !== 'custom') {
      this.customLocationName = '';
    }
    
    if (this.map && L) {
      if (this.marker) {
        this.map.removeLayer(this.marker);
      }

      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="width:32px;height:32px;background:#FDBF0F;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
                 <i class="ph-fill ph-map-pin" style="color:#003479;font-size:16px;"></i>
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      this.marker = L.marker([location.lat, location.lng], { icon: customIcon }).addTo(this.map);
      this.marker.bindPopup(`<b>${location.name}</b>`).openPopup();
      
      this.map.setView([location.lat, location.lng], 17);
    }
  }

  selectLocationFromDropdown(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const location = this.locations.find(l => l.id === select.value);
    if (location) {
      // Reset custom location name when selecting from dropdown
      this.customLocationName = '';
      this.selectLocation(location);
    }
  }

  // Step 6: Suggestions
  checkSimilarItems(): void {
    this.isCheckingSuggestions.set(true);
    this.selectedSuggestion.set(null);

    // Simulate API call delay
    setTimeout(() => {
      const similar = this.findSimilarItems();
      this.similarItems.set(similar);
      this.isCheckingSuggestions.set(false);
    }, 1000);
  }

  private findSimilarItems(): Item[] {
    const { title, description, category } = this.formData;
    const searchTerms = `${title} ${description}`.toLowerCase().split(/\s+/);
    
    // Only search for found items (to match against lost reports)
    const targetStatus = 'found';
    
    return MOCK_ITEMS
      .filter(item => {
        // Filter by opposite status
        if (item.status !== targetStatus) return false;
        
        // Filter by same category (higher priority)
        const sameCategory = item.category === category;
        
        // Check for keyword matches in title and description
        const itemText = `${item.title} ${item.description}`.toLowerCase();
        const matchScore = searchTerms.filter(term => 
          term.length > 2 && itemText.includes(term)
        ).length;
        
        // Return if same category OR has keyword matches
        return sameCategory || matchScore >= 2;
      })
      .slice(0, 5); // Limit to 5 suggestions
  }

  selectSuggestion(item: Item): void {
    this.selectedSuggestion.set(item);
  }

  confirmSuggestion(): void {
    // Navigate to the item detail (would be implemented later)
    const item = this.selectedSuggestion();
    if (item) {
      this.router.navigate(['/item', item.id]);
    }
  }

  skipSuggestions(): void {
    // Continue to submit the form
    this.submitForm();
  }

  // Submit
  async submitForm(): Promise<void> {
    if (!this.canProceed()) return;

    this.isSubmitting.set(true);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const user = this.authService.getCurrentUser();
    
    const newItem: Partial<Item> = {
      id: `item_${Date.now()}`,
      title: this.formData.title,
      description: this.formData.description,
      category: this.formData.category as ItemCategory,
      status: this.formData.status as ItemStatus,
      reportStatus: 'active' as ReportStatus,  // NEW: all new reports start as active
      imageUrl: this.formData.imageUrl,
      date: this.formatDate(this.formData.date),
      time: this.formData.time,
      location: this.formData.location ? {
        name: this.formData.location.name,
        lat: this.formData.location.lat,
        lng: this.formData.location.lng
      } : undefined,
      reporterId: user?.id,
      reporterName: user?.name,
      reporterBadge: user?.badge,
      reporterPhone: user?.phone,
      createdAt: new Date()
    };
    
    // Add QR scan specific fields
    if (this.isQrScanMode() && this.qrOwner()) {
      const owner = this.qrOwner()!;
      newItem.isScannedByQr = true;
      newItem.scannedQrOwnerId = owner.id;
      newItem.scannedQrOwnerName = owner.name;
      newItem.scannedQrOwnerPhone = owner.phone;
    }
    
    // Add status-specific fields
    if (this.formData.status === 'lost') {
      newItem.reward = this.formData.reward;
      newItem.urgency = this.formData.urgency;
      newItem.exposePhone = this.formData.exposePhone;
      newItem.willingToCod = this.formData.willingToCod;
      // Add alternative contact if phone is not exposed
      if (!this.formData.exposePhone) {
        newItem.alternativeContact = this.formData.alternativeContact;
      }
    } else if (this.formData.status === 'found') {
      newItem.storageLocation = this.formData.storageLocation;
      if (this.formData.storageLocation === 'entrusted') {
        newItem.entrustedTo = this.formData.entrustedTo;
      }
      newItem.willingToCod = this.formData.willingToCod;  // Changed from willingToDeliver
    }

    console.log('New item created:', newItem);

    this.isSubmitting.set(false);
    this.isSuccess.set(true);
  }

  // Helpers
  private getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  private getCurrentTime(): string {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
    return date.toLocaleDateString('id-ID', options);
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  createAnother(): void {
    this.formData = {
      status: '',
      imageUrl: '',
      imagePreview: '',
      title: '',
      description: '',
      category: '',
      location: null,
      date: this.getTodayDate(),
      time: this.getCurrentTime(),
      reward: false,
      urgency: 'normal',
      exposePhone: true,
      alternativeContact: {
        instagram: '',
        telegram: '',
        line: '',
        other: ''
      },
      storageLocation: 'with-me',
      entrustedTo: '',
      willingToDeliver: false,
      willingToCod: false
    };
    this.customLocationName = '';
    this.currentStep.set(1);
    this.isSuccess.set(false);
    this.similarItems.set([]);
    this.selectedSuggestion.set(null);
    this.warningAccepted.set(false);
    this.showWarningModal.set(false);
    
    if (this.marker && this.map) {
      this.map.removeLayer(this.marker);
      this.marker = null;
    }
  }

  getStepTitle(): string {
    // QR Scan mode titles
    if (this.isQrScanMode()) {
      const qrTitles = [
        'Masukkan foto barang',
        'Masukkan nama dan ciri-ciri barang',
        'Pilih kategori barang',
        'Pilih lokasi ditemukan',
        'Informasi tambahan penemuan'
      ];
      return qrTitles[this.currentStep() - 1] || '';
    }
    
    const titles = [
      'Kamu kehilangan atau menemukan barang?',
      'Kamu punya bukti foto?',
      'Masukkan nama dan ciri-ciri barang',
      'Pilih kategori barang',
      'Pilih lokasi kejadian',
      this.formData.status === 'lost' ? 'Informasi tambahan kehilangan' : 'Informasi tambahan penemuan',
      'Apakah ini barang kamu?'
    ];
    return titles[this.currentStep() - 1] || '';
  }

  getStepSubtitle(): string {
    // QR Scan mode subtitles
    if (this.isQrScanMode()) {
      const qrSubtitles = [
        'Agar pemilik lebih mengenal barangnya',
        'Berikan detail agar mudah dikenali',
        'Kategori membantu pencarian lebih cepat',
        'Tandai di peta tempat barang ditemukan',
        'Beritahu dimana barang disimpan'
      ];
      return qrSubtitles[this.currentStep() - 1] || '';
    }
    
    const subtitles = [
      'Pilih jenis laporan yang ingin kamu buat',
      'Foto membantu barang lebih mudah dikenali (opsional)',
      'Berikan detail agar mudah ditemukan',
      'Kategori membantu pencarian lebih cepat',
      'Tandai di peta tempat barang hilang/ditemukan',
      this.formData.status === 'lost' 
        ? 'Atur tingkat urgensi dan preferensi kontak' 
        : 'Beritahu dimana barang disimpan',
      'Kami menemukan barang serupa, cek dulu sebelum lapor'
    ];
    return subtitles[this.currentStep() - 1] || '';
  }
  
  // Toggle reward
  toggleReward(): void {
    this.formData.reward = !this.formData.reward;
  }
  
  // Set urgency level
  setUrgency(level: UrgencyLevel): void {
    this.formData.urgency = level;
  }
  
  // Set storage location
  setStorageLocation(location: StorageLocation): void {
    this.formData.storageLocation = location;
  }
  
  // Toggle willing to deliver (DEPRECATED)
  toggleWillingToDeliver(): void {
    this.formData.willingToDeliver = !this.formData.willingToDeliver;
  }
  
  // Toggle willing to COD
  toggleWillingToCod(): void {
    this.formData.willingToCod = !this.formData.willingToCod;
  }
  
  // Toggle expose phone
  toggleExposePhone(): void {
    this.formData.exposePhone = !this.formData.exposePhone;
  }
  
  // Warning modal methods for found items
  openWarningModal(): void {
    this.showWarningModal.set(true);
  }
  
  closeWarningModal(): void {
    this.showWarningModal.set(false);
  }
  
  acceptWarning(): void {
    this.warningAccepted.set(true);
    this.showWarningModal.set(false);
  }
}
