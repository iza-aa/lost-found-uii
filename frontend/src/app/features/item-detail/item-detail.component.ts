import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import type * as LeafletTypes from 'leaflet';
import { Item } from '../../core/models';
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
  imports: [CommonModule, RouterModule, UserBadgeComponent, StatusBadgeComponent, CubeLoaderComponent],
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
}
