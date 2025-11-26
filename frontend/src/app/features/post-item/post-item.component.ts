import { Component, OnInit, AfterViewInit, OnDestroy, PLATFORM_ID, Inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import type * as LeafletTypes from 'leaflet';
import { ItemCategory, ItemStatus } from '../../core/models';
import { MOCK_CATEGORIES, MOCK_LOCATIONS, UII_CENTER, CampusLocation } from '../../core/mocks';
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

  // Steps
  currentStep = signal(1);
  totalSteps = 5;
  isSubmitting = signal(false);
  isSuccess = signal(false);

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
    time: ''
  };

  // Data
  categories = MOCK_CATEGORIES.filter(c => c.id !== 'all') as Array<{id: ItemCategory; label: string; icon: string}>;
  locations = MOCK_LOCATIONS;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private router: Router,
    private authService: AuthService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.formData.date = this.getTodayDate();
    this.formData.time = this.getCurrentTime();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  // Step Navigation
  nextStep(): void {
    if (this.canProceed()) {
      if (this.currentStep() < this.totalSteps) {
        this.currentStep.update(v => v + 1);
        
        if (this.currentStep() === 5 && this.isBrowser) {
          setTimeout(() => this.initMap(), 100);
        }
      }
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(v => v - 1);
    }
  }

  goToStep(step: number): void {
    if (step <= this.currentStep() && step >= 1) {
      this.currentStep.set(step);
      
      if (step === 5 && this.isBrowser) {
        setTimeout(() => this.initMap(), 100);
      }
    }
  }

  canProceed(): boolean {
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
        return this.formData.location !== null;
      default:
        return false;
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
      const customLocation: CampusLocation = {
        id: 'custom',
        name: 'Lokasi Dipilih',
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        description: `Koordinat: ${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`
      };
      this.selectLocation(customLocation);
    });
  }

  selectLocation(location: CampusLocation): void {
    this.formData.location = location;
    
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
      this.selectLocation(location);
    }
  }

  // Submit
  async submitForm(): Promise<void> {
    if (!this.canProceed()) return;

    this.isSubmitting.set(true);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const user = this.authService.getCurrentUser();
    
    const newItem = {
      id: `item_${Date.now()}`,
      title: this.formData.title,
      description: this.formData.description,
      category: this.formData.category,
      status: this.formData.status,
      imageUrl: this.formData.imageUrl,
      date: this.formatDate(this.formData.date),
      time: this.formData.time,
      location: this.formData.location,
      reporterId: user?.id,
      reporterName: user?.name,
      reporterBadge: user?.badge,
      reporterPhone: user?.phone,
      createdAt: new Date()
    };

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
      time: this.getCurrentTime()
    };
    this.currentStep.set(1);
    this.isSuccess.set(false);
    
    if (this.marker && this.map) {
      this.map.removeLayer(this.marker);
      this.marker = null;
    }
  }

  getStepTitle(): string {
    const titles = [
      'Kamu kehilangan atau menemukan barang?',
      'Kamu punya bukti foto?',
      'Masukkan nama dan ciri-ciri barang',
      'Pilih kategori barang',
      'Pilih lokasi kejadian'
    ];
    return titles[this.currentStep() - 1] || '';
  }

  getStepSubtitle(): string {
    const subtitles = [
      'Pilih jenis laporan yang ingin kamu buat',
      'Foto membantu barang lebih mudah dikenali (opsional)',
      'Berikan detail agar mudah ditemukan',
      'Kategori membantu pencarian lebih cepat',
      'Tandai di peta tempat barang hilang/ditemukan'
    ];
    return subtitles[this.currentStep() - 1] || '';
  }
}
