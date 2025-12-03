import { Component, OnInit, AfterViewInit, OnDestroy, PLATFORM_ID, Inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import type * as LeafletTypes from 'leaflet';
import { Item, ItemCategory, ItemStatus, UrgencyLevel, StorageLocation, AlternativeContact, AlternativeContactType, ContactEntry, ReportStatus, User } from '../../core/models';
import { MOCK_CATEGORIES, MOCK_LOCATIONS, MOCK_ITEMS, UII_CENTER, CampusLocation } from '../../core/mocks';
import { AuthService } from '../../core/services/auth.service';
import { ApiService, CreateFoundItemRequest, CreateLostItemRequest, Category, Location as ApiLocation } from '../../core/services/api.service';

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
  attachedQrId = signal<string>(''); // User ID from scanned QR

  // Steps: Both Lost and Found now have 7 steps (includes suggestions), QR=5 steps
  currentStep = signal(1);
  get totalSteps(): number {
    if (this.isQrScanMode()) return 5; // QR mode: Image, Detail, Category, Location, Info
    return 7; // Both Lost and Found now have 7 steps (suggestions step)
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
    alternativeContacts: [] as ContactEntry[],  // NEW: multiple kontak alternatif
    alternativeContact: {           // Legacy - for backward compatibility
      type: undefined as AlternativeContactType | undefined,
      value: '',
      instagram: '',
      telegram: '',
      line: '',
      other: ''
    } as AlternativeContact,
    // Found specific
    storageLocation: 'with-me' as StorageLocation,
    entrustedTo: '',
    willingToDeliver: false,        // DEPRECATED
    willingToCod: false,            // NEW: bersedia COD di tengah/kampus
    // Found specific - Verification Questions (NEW)
    verificationQuestions: [
      { question: '', answer: '' }  // Start with one empty question
    ] as Array<{ question: string; answer: string }>
  };

  // Data - fallback to mock if API fails
  categories = MOCK_CATEGORIES.filter(c => c.id !== 'all') as Array<{ id: ItemCategory; label: string; icon: string }>;
  locations = MOCK_LOCATIONS;
  
  // API Data
  apiCategories: Category[] = [];
  apiLocations: ApiLocation[] = [];
  isLoadingEnums = signal(false);

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

  // Alternative contact options (dropdown)
  alternativeContactOptions: { value: AlternativeContactType; label: string; icon: string }[] = [
    { value: 'instagram', label: 'Instagram', icon: 'ph-instagram-logo' },
    { value: 'telegram', label: 'Telegram', icon: 'ph-telegram-logo' },
    { value: 'line', label: 'LINE', icon: 'ph-chat-circle-text' },
    { value: 'whatsapp_other', label: 'WhatsApp Lain', icon: 'ph-whatsapp-logo' },
    { value: 'email', label: 'Email', icon: 'ph-envelope' },
    { value: 'other', label: 'Lainnya', icon: 'ph-link' }
  ];

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private apiService: ApiService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.formData.date = this.getTodayDate();
    this.formData.time = this.getCurrentTime();

    // Load categories and locations from API
    this.loadEnumerations();

    // Check if this is a QR scan mode
    const isQr = this.route.snapshot.queryParamMap.get('qr');
    const qrData = this.route.snapshot.queryParamMap.get('qrData');

    if (isQr === 'true' && qrData) {
      this.initQrScanMode(qrData);
    }
  }

  // Load categories and locations from API
  private loadEnumerations(): void {
    this.isLoadingEnums.set(true);
    
    // Load categories
    this.apiService.getCategories().subscribe({
      next: (cats) => {
        // Ensure cats is an array
        const categories = Array.isArray(cats) ? cats : [];
        this.apiCategories = categories;
        // Update local categories for UI display
        // Filter out "Buku" (sudah ada Dokumen) dan sort agar "Lainnya" di akhir
        const filteredCats = categories
          .filter(cat => cat.name !== 'Buku')
          .sort((a, b) => {
            if (a.name === 'Lainnya') return 1;
            if (b.name === 'Lainnya') return -1;
            return 0;
          });
        
        this.categories = filteredCats.map(cat => ({
          id: this.mapCategoryNameToId(cat.name) as ItemCategory,
          label: cat.name,
          icon: this.getCategoryIconByName(cat.name)
        }));
        console.log('Categories loaded:', filteredCats);
      },
      error: (err) => console.warn('Failed to load categories, using mock:', err)
    });

    // Load locations
    this.apiService.getLocations().subscribe({
      next: (locs) => {
        // Ensure locs is an array
        this.apiLocations = Array.isArray(locs) ? locs : [];
        console.log('Locations loaded:', locs);
        this.isLoadingEnums.set(false);
      },
      error: (err) => {
        console.warn('Failed to load locations, using mock:', err);
        this.isLoadingEnums.set(false);
      }
    });
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
        
        // Store QR owner's user ID for backend verification
        if (userData.id) {
          this.attachedQrId.set(userData.id);
        }
      }
    } catch {
      // Invalid QR data, redirect to normal post-item
      console.error('Invalid QR data');
    }
  }

  ngAfterViewInit(): void { }

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

      // For Found items: submit after step 7 (now includes suggestions)
      if (this.formData.status === 'found' && !this.isQrScanMode() && this.currentStep() === 7) {
        this.submitForm();
        return;
      }

      if (this.currentStep() < this.totalSteps) {
        // Destroy map before leaving map step
        const mapStep = this.isQrScanMode() ? 4 : 5;
        if (this.currentStep() === mapStep && this.isBrowser) {
          this.destroyMap();
        }

        this.currentStep.update(v => v + 1);

        // Init map on map step
        const nextMapStep = this.isQrScanMode() ? 4 : 5;
        if (this.currentStep() === nextMapStep && this.isBrowser) {
          setTimeout(() => this.initMap(), 100);
        }

        // Step 7: Check for similar items (for both Lost and Found items, non-QR mode)
        if (this.currentStep() === 7 && !this.isQrScanMode()) {
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
        case 2: // Title + Verification Questions (QR mode is always 'found')
          const hasTitle = this.formData.title.trim().length >= 3;
          const hasValidQuestions = this.formData.verificationQuestions.some(
            q => q.question.trim().length > 0 && q.answer.trim().length > 0
          );
          return hasTitle && hasValidQuestions;
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
        if (this.formData.status === 'lost') {
          return this.formData.title.trim().length >= 3 &&
            this.formData.description.trim().length >= 10;
        } else {
          // Found items: Title + Verification Questions (at least 1 valid Q&A)
          const hasTitle = this.formData.title.trim().length >= 3;
          const hasValidQuestions = this.formData.verificationQuestions.some(
            q => q.question.trim().length > 0 && q.answer.trim().length > 0
          );
          return hasTitle && hasValidQuestions;
        }
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
        // Also if not exposing phone, require alternative contact
        if (this.formData.status === 'found') {
          if (!this.warningAccepted()) return false;
          if (this.formData.storageLocation === 'entrusted') {
            if (this.formData.entrustedTo.trim().length < 3) return false;
          }
          // If not exposing phone, require at least one valid alternative contact
          if (!this.formData.exposePhone) {
            const hasValidContact = this.formData.alternativeContacts.some(
              c => c.type && c.value.trim().length > 0
            );
            if (!hasValidContact) return false;
          }
          return true;
        }
        // LOST: If not exposing phone, require at least one valid alternative contact
        if (this.formData.status === 'lost' && !this.formData.exposePhone) {
          const hasValidContact = this.formData.alternativeContacts.some(
            c => c.type && c.value.trim().length > 0
          );
          return hasValidContact;
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

  // Helper: Map category name to frontend ID
  private mapCategoryNameToId(name: string): string {
    const map: Record<string, string> = {
      'Tas': 'bags',
      'Dompet': 'wallet',
      'HP': 'phone',
      'Elektronik': 'electronics',
      'Dokumen': 'documents',
      'Kunci': 'keys',
      'Pakaian': 'clothing',
      'Lainnya': 'others'
    };
    return map[name] || 'others';
  }

  // Helper: Get icon by category name
  private getCategoryIconByName(name: string): string {
    const iconMap: Record<string, string> = {
      'Tas': 'ph-bag',
      'Dompet': 'ph-wallet',
      'HP': 'ph-device-mobile',
      'Elektronik': 'ph-laptop',
      'Dokumen': 'ph-file-text',
      'Kunci': 'ph-key',
      'Pakaian': 'ph-t-shirt',
      'Buku': 'ph-book',
      'Lainnya': 'ph-dots-three-outline'
    };
    return iconMap[name] || 'ph-question';
  }

  // Step 5: Map
  private async initMap(): Promise<void> {
    if (!this.isBrowser || this.map) return;

    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    // Dynamic import of Leaflet (browser only) - handle ESM default export
    const leafletModule = await import('leaflet');
    L = (leafletModule as any).default || leafletModule;

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

    // If status is 'lost', look for 'found' items
    // If status is 'found', look for 'lost' items
    const targetStatus = this.formData.status === 'lost' ? 'found' : 'lost';

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
      const route = item.status === 'found' ? '/found' : '/item';
      this.router.navigate([route, item.id]);
    }
  }

  skipSuggestions(): void {
    // Continue to submit the form
    this.submitForm();
  }

  // Submit
  submitForm(): void {
    if (!this.canProceed()) return;

    this.isSubmitting.set(true);

    if (this.formData.status === 'found') {
      this.submitFoundItem();
    } else if (this.formData.status === 'lost') {
      this.submitLostItem();
    }
  }

  private submitFoundItem(): void {
    // Get location ID - use API location if available, otherwise use mock
    let locationId = '';
    if (this.formData.location) {
      // Check if it's from API locations
      const apiLoc = this.apiLocations.find(l => l.name === this.formData.location?.name);
      if (apiLoc) {
        locationId = apiLoc.id;
      } else {
        // Fallback: use first available API location or empty
        locationId = this.apiLocations.length > 0 ? this.apiLocations[0].id : '';
      }
    }

    // Get category ID
    let categoryId = '';
    const apiCat = this.apiCategories.find(c => 
      c.name.toLowerCase() === this.getCategoryLabel(this.formData.category as string).toLowerCase()
    );
    if (apiCat) {
      categoryId = apiCat.id;
    } else if (this.apiCategories.length > 0) {
      categoryId = this.apiCategories[0].id;
    }

    // Build contacts for found item
    const foundContacts: Array<{ platform: 'WHATSAPP' | 'INSTAGRAM' | 'TELEGRAM' | 'LINE' | 'EMAIL' | 'OTHER'; value: string }> = [];
    for (const contact of this.formData.alternativeContacts) {
      if (contact.value?.trim()) {
        foundContacts.push({ 
          platform: contact.type.toUpperCase() as 'WHATSAPP' | 'INSTAGRAM' | 'TELEGRAM' | 'LINE' | 'EMAIL' | 'OTHER', 
          value: contact.value.trim() 
        });
      }
    }

    const request: CreateFoundItemRequest = {
      title: this.formData.title,
      description: this.formData.description || undefined,
      category_id: categoryId,
      location_id: locationId,
      image_url: this.formData.imageUrl || 'https://placehold.co/400x300?text=No+Image',
      verifications: this.formData.verificationQuestions
        .filter(q => q.question.trim().length > 0 && q.answer.trim().length > 0)
        .map(q => ({ question: q.question, answer: q.answer })),
      date_found: this.formData.date,
      return_method: this.formData.storageLocation === 'entrusted' ? 'HANDED_TO_SECURITY' : 'BRING_BY_FINDER',
      cod: this.formData.willingToCod,
      show_phone: this.formData.exposePhone,
      contacts: foundContacts,
      // Include QR code if scanned
      attached_qr: this.attachedQrId() || undefined
    };

    console.log('Submitting found item:', request);

    this.apiService.reportFoundItem(request).subscribe({
      next: (response) => {
        console.log('Found item created:', response);
        this.isSubmitting.set(false);
        this.isSuccess.set(true);
      },
      error: (error) => {
        console.error('Failed to create found item:', error);
        this.isSubmitting.set(false);
        alert('Gagal membuat laporan: ' + error.message);
      }
    });
  }

  private submitLostItem(): void {
    // Get category ID
    let categoryId = '';
    const apiCat = this.apiCategories.find(c => 
      c.name.toLowerCase() === this.getCategoryLabel(this.formData.category as string).toLowerCase()
    );
    if (apiCat) {
      categoryId = apiCat.id;
    } else if (this.apiCategories.length > 0) {
      categoryId = this.apiCategories[0].id;
    }

    // Map urgency
    const urgencyMap: Record<string, 'NORMAL' | 'HIGH' | 'CRITICAL'> = {
      'normal': 'NORMAL',
      'important': 'HIGH',
      'very-important': 'CRITICAL'
    };

    // Build contacts from alternativeContacts array
    const contacts: Array<{ platform: 'WHATSAPP' | 'INSTAGRAM' | 'TELEGRAM' | 'LINE' | 'EMAIL' | 'OTHER'; value: string }> = [];
    for (const contact of this.formData.alternativeContacts) {
      if (contact.value && contact.value.trim()) {
        contacts.push({ 
          platform: contact.type.toUpperCase() as 'INSTAGRAM' | 'TELEGRAM' | 'LINE' | 'OTHER', 
          value: contact.value.trim() 
        });
      }
    }

    const request: CreateLostItemRequest = {
      title: this.formData.title,
      category_id: categoryId,
      description: this.formData.description,
      location_last_seen: this.formData.location?.name || 'Unknown',
      location_latitude: this.formData.location?.lat,
      location_longitude: this.formData.location?.lng,
      date_lost: this.formData.date,
      image_url: this.formData.imageUrl || 'https://placehold.co/400x300?text=No+Image',
      urgency: urgencyMap[this.formData.urgency] || 'NORMAL',
      offer_reward: this.formData.reward,
      cod: this.formData.willingToCod,
      show_phone: this.formData.exposePhone,
      contacts: contacts.length > 0 ? contacts : undefined
    };

    console.log('Submitting lost item:', request);

    this.apiService.reportLostItem(request).subscribe({
      next: (response) => {
        console.log('Lost item created:', response);
        this.isSubmitting.set(false);
        this.isSuccess.set(true);
      },
      error: (error) => {
        console.error('Failed to create lost item:', error);
        this.isSubmitting.set(false);
        alert('Gagal membuat laporan: ' + error.message);
      }
    });
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
      alternativeContacts: [],
      alternativeContact: {
        instagram: '',
        telegram: '',
        line: '',
        other: ''
      },
      // Found specific
      storageLocation: 'with-me',
      entrustedTo: '',
      willingToDeliver: false,
      willingToCod: false,
      // Found specific - Verification Questions
      verificationQuestions: [
        { question: '', answer: '' }
      ]
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
        'Nama & Pertanyaan Verifikasi',
        'Pilih kategori barang',
        'Pilih lokasi ditemukan',
        'Informasi tambahan penemuan'
      ];
      return qrTitles[this.currentStep() - 1] || '';
    }

    const titles = [
      'Kamu kehilangan atau menemukan barang?',
      'Kamu punya bukti foto?',
      this.formData.status === 'lost' ? 'Masukkan nama dan ciri-ciri barang' : 'Nama & Pertanyaan Verifikasi',
      'Pilih kategori barang',
      'Pilih lokasi kejadian',
      this.formData.status === 'lost' ? 'Informasi tambahan kehilangan' : 'Informasi tambahan penemuan',
      this.formData.status === 'lost' ? 'Apakah ini barang kamu?' : 'Apakah ini barang yang dicari?'
    ];
    return titles[this.currentStep() - 1] || '';
  }

  getStepSubtitle(): string {
    // QR Scan mode subtitles
    if (this.isQrScanMode()) {
      const qrSubtitles = [
        'Agar pemilik lebih mengenal barangnya',
        'Buat pertanyaan yang hanya pemilik asli yang tahu jawabannya',
        'Kategori membantu pencarian lebih cepat',
        'Tandai di peta tempat barang ditemukan',
        'Beritahu dimana barang disimpan'
      ];
      return qrSubtitles[this.currentStep() - 1] || '';
    }

    const subtitles = [
      'Pilih jenis laporan yang ingin kamu buat',
      'Foto membantu barang lebih mudah dikenali (opsional)',
      this.formData.status === 'lost' 
        ? 'Berikan detail agar mudah ditemukan' 
        : 'Buat pertanyaan yang hanya pemilik asli yang tahu jawabannya',
      'Kategori membantu pencarian lebih cepat',
      'Tandai di peta tempat barang hilang/ditemukan',
      this.formData.status === 'lost'
        ? 'Atur tingkat urgensi dan preferensi kontak'
        : 'Beritahu dimana barang disimpan',
      this.formData.status === 'lost'
        ? 'Kami menemukan barang serupa, cek dulu sebelum lapor'
        : 'Ada laporan kehilangan yang mirip, cek dulu ya'
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
    // Add one empty contact when toggling off, reset when toggling on
    if (!this.formData.exposePhone && this.formData.alternativeContacts.length === 0) {
      this.formData.alternativeContacts.push({
        type: 'instagram',
        value: ''
      });
    } else if (this.formData.exposePhone) {
      this.formData.alternativeContacts = [];
    }
  }

  // ===========================
  // Verification Questions (for Found items)
  // ===========================
  addVerificationQuestion(): void {
    this.formData.verificationQuestions.push({ question: '', answer: '' });
  }

  removeVerificationQuestion(index: number): void {
    if (this.formData.verificationQuestions.length > 1) {
      this.formData.verificationQuestions.splice(index, 1);
    }
  }

  // Add new contact entry
  addAlternativeContact(): void {
    this.formData.alternativeContacts.push({
      type: 'instagram',
      value: ''
    });
  }

  // Remove contact entry by index
  removeAlternativeContact(index: number): void {
    this.formData.alternativeContacts.splice(index, 1);
  }

  // Get label for alternative contact input by type
  getContactLabel(type: AlternativeContactType): string {
    switch (type) {
      case 'instagram': return 'Username Instagram';
      case 'telegram': return 'Username Telegram';
      case 'line': return 'LINE ID';
      case 'whatsapp_other': return 'Nomor WhatsApp';
      case 'email': return 'Alamat Email';
      case 'other': return 'Kontak Lainnya';
      default: return 'Kontak';
    }
  }

  // Get placeholder for alternative contact input by type
  getContactPlaceholder(type: AlternativeContactType): string {
    switch (type) {
      case 'instagram': return 'username_instagram';
      case 'telegram': return 'username_telegram';
      case 'line': return 'line_id_anda';
      case 'whatsapp_other': return '081234567890';
      case 'email': return 'email@domain.com';
      case 'other': return 'Masukkan kontak Anda';
      default: return '';
    }
  }

  // Check if contact type needs @ prefix
  needsAtPrefix(type: AlternativeContactType): boolean {
    return type === 'instagram' || type === 'telegram';
  }

  // Get icon class for contact type
  getContactIcon(type: AlternativeContactType): string {
    switch (type) {
      case 'instagram': return 'ph-fill ph-instagram-logo';
      case 'telegram': return 'ph-fill ph-telegram-logo';
      case 'line': return 'ph ph-chat-circle-text';
      case 'whatsapp_other': return 'ph-fill ph-whatsapp-logo';
      case 'email': return 'ph ph-envelope';
      case 'other': return 'ph ph-link';
      default: return 'ph ph-chat-circle';
    }
  }

  // Get icon color for contact type
  getContactIconColor(type: AlternativeContactType): string {
    switch (type) {
      case 'instagram': return 'text-pink-500';
      case 'telegram': return 'text-blue-500';
      case 'line': return 'text-green-500';
      case 'whatsapp_other': return 'text-green-600';
      case 'email': return 'text-gray-600';
      case 'other': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  }

  // Get label for alternative contact input (legacy)
  getAlternativeContactLabel(): string {
    const type = this.formData.alternativeContact.type;
    switch (type) {
      case 'instagram': return 'Username Instagram';
      case 'telegram': return 'Username Telegram';
      case 'line': return 'LINE ID';
      case 'whatsapp_other': return 'Nomor WhatsApp';
      case 'email': return 'Alamat Email';
      case 'other': return 'Kontak Lainnya';
      default: return 'Kontak';
    }
  }

  // Get placeholder for alternative contact input (legacy)
  getAlternativeContactPlaceholder(): string {
    const type = this.formData.alternativeContact.type;
    switch (type) {
      case 'instagram': return 'username_instagram';
      case 'telegram': return 'username_telegram';
      case 'line': return 'line_id_anda';
      case 'whatsapp_other': return '081234567890';
      case 'email': return 'email@domain.com';
      case 'other': return 'Masukkan kontak Anda';
      default: return '';
    }
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
