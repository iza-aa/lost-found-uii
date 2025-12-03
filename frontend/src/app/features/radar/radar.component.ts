import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import type * as LeafletTypes from 'leaflet';
import { Item, ItemCategory } from '../../core/models';
import { ApiService, ItemResponse } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CubeLoaderComponent } from '../../shared/components/cube-loader/cube-loader.component';

type LeafletModule = typeof LeafletTypes;
let L: LeafletModule;

@Component({
  selector: 'app-radar',
  standalone: true,
  imports: [CommonModule, CubeLoaderComponent],
  templateUrl: './radar.component.html',
  styleUrl: './radar.component.css'
})
export class RadarComponent implements OnInit, OnDestroy {
  private isBrowser: boolean;
  private map: LeafletTypes.Map | null = null;

  isLoading = signal(true);
  items = signal<Item[]>([]);
  selectedFilter = signal<'all' | 'lost' | 'found'>('all');
  
  // Stats
  lostCount = signal(0);
  foundCount = signal(0);

  // UII Campus center coordinates (Kampus Terpadu Jl. Kaliurang)
  private readonly UII_CENTER: [number, number] = [-7.687340, 110.412067];

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.loadItems();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private loadItems(): void {
    // Check auth first
    if (!this.authService.isAuthenticated()) {
      this.items.set([]);
      this.lostCount.set(0);
      this.foundCount.set(0);
      if (this.isBrowser) {
        setTimeout(() => this.initMap(), 100);
      }
      return;
    }

    // Load from API
    this.apiService.getAllItems().subscribe({
      next: (apiItems) => {
        // Ensure apiItems is an array
        const items = Array.isArray(apiItems) ? apiItems : [];
        
        // Map and filter items with coordinates
        const mappedItems = this.mapApiItemsToFrontend(items);
        const itemsWithLocation = mappedItems.filter(item => 
          typeof item.location === 'object' && 
          'lat' in item.location && 
          item.location.lat !== 0 && 
          item.location.lng !== 0
        );
        
        this.items.set(itemsWithLocation);
        this.lostCount.set(itemsWithLocation.filter(i => i.status === 'lost').length);
        this.foundCount.set(itemsWithLocation.filter(i => i.status === 'found').length);

        if (this.isBrowser) {
          setTimeout(() => this.initMap(), 100);
        }
      },
      error: (error) => {
        console.error('Failed to load items:', error);
        this.items.set([]);
        this.lostCount.set(0);
        this.foundCount.set(0);
        if (this.isBrowser) {
          setTimeout(() => this.initMap(), 100);
        }
      }
    });
  }

  private mapApiItemsToFrontend(apiItems: ItemResponse[]): Item[] {
    // Defensive check - ensure apiItems is actually an array
    if (!Array.isArray(apiItems)) {
      console.warn('mapApiItemsToFrontend: Expected array, got:', typeof apiItems);
      return [];
    }
    return apiItems.map(apiItem => {
      const reporter = apiItem.finder || apiItem.owner;
      return {
        id: apiItem.id,
        title: apiItem.title,
        description: '',
        category: this.mapCategoryName(apiItem.category_name) as ItemCategory,
        status: apiItem.type === 'FOUND' ? 'found' : 'lost',
        reportStatus: apiItem.status === 'OPEN' ? 'active' : (apiItem.status === 'CLAIMED' ? 'claimed' : 'resolved') as any,
        imageUrl: this.apiService.getStaticFileUrl(apiItem.image_url || '') || 'https://placehold.co/400x300?text=No+Image',
        date: new Date(apiItem.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        time: new Date(apiItem.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        location: {
          name: apiItem.location_name || 'Unknown Location',
          lat: apiItem.location_latitude || 0,
          lng: apiItem.location_longitude || 0
        },
        reporterId: reporter?.id || '',
        reporterName: reporter?.name || 'Unknown',
        reporterBadge: this.mapRoleToBadge(reporter?.role),
        createdAt: new Date(apiItem.created_at),
        verificationQuestions: [],
        isScannedByQr: !!apiItem.attached_qr
      } as Item;
    });
  }

  private mapCategoryName(categoryName?: string): string {
    if (!categoryName) return 'others';
    const categoryMap: Record<string, string> = {
      'Tas': 'bags',
      'Dompet': 'wallet',
      'HP': 'phone',
      'Elektronik': 'electronics',
      'Dokumen': 'documents',
      'Kunci': 'keys',
      'Pakaian': 'clothing',
      'Lainnya': 'others'
    };
    return categoryMap[categoryName] || 'others';
  }

  private mapRoleToBadge(role?: string): 'gold' | 'blue' | 'gray' {
    if (!role) return 'gray';
    switch (role) {
      case 'STAFF_DOSEN': return 'gold';
      case 'MAHASISWA': return 'blue';
      default: return 'gray';
    }
  }

  private async initMap(): Promise<void> {
    if (!this.isBrowser || this.map) return;

    const mapElement = document.getElementById('radar-map');
    if (!mapElement) return;

    // Dynamic import Leaflet - handle both ESM default export and namespace
    const leafletModule = await import('leaflet');
    L = (leafletModule as any).default || leafletModule;

    this.map = L.map('radar-map', {
      zoomControl: false
    }).setView(this.UII_CENTER, 16);

    // Add zoom control to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    // Add markers
    this.addMarkers();

    this.isLoading.set(false);
  }

  private addMarkers(): void {
    if (!this.map) return;

    const filteredItems = this.getFilteredItems();

    filteredItems.forEach(item => {
      if (typeof item.location === 'string') return;

      const isLost = item.status === 'lost';
      const color = isLost ? '#EF4444' : '#22C55E'; // Red for lost, Green for found
      const icon = isLost ? 'ph-question' : 'ph-check';

      const customIcon = L.divIcon({
        className: 'custom-radar-marker',
        html: `
          <div class="radar-marker ${isLost ? 'lost' : 'found'}">
            <i class="ph ${icon}"></i>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
      });

      const marker = L.marker([item.location.lat, item.location.lng], { icon: customIcon })
        .addTo(this.map!);

      // Create popup content
      const popupContent = `
        <div class="radar-popup">
          <div class="popup-image">
            ${item.imageUrl 
              ? `<img src="${item.imageUrl}" alt="${item.title}">` 
              : `<div class="no-image"><i class="ph ph-image"></i></div>`
            }
            <span class="popup-status ${item.status}">${isLost ? 'Hilang' : 'Ditemukan'}</span>
          </div>
          <div class="popup-content">
            <h4>${item.title}</h4>
            <p class="location"><i class="ph ph-map-pin"></i> ${item.location.name}</p>
            <p class="date"><i class="ph ph-calendar"></i> ${item.date}</p>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 280,
        className: 'radar-popup-container'
      });

      // Navigate to detail on popup click
      marker.on('popupopen', () => {
        const popupEl = document.querySelector('.radar-popup');
        if (popupEl) {
          popupEl.addEventListener('click', () => {
            const route = item.status === 'found' ? '/found' : '/item';
            this.router.navigate([route, item.id], { 
              queryParams: { from: 'radar' } 
            });
          });
        }
      });
    });
  }

  private getFilteredItems(): Item[] {
    const filter = this.selectedFilter();
    const allItems = this.items();
    
    if (filter === 'all') return allItems;
    return allItems.filter(item => item.status === filter);
  }

  setFilter(filter: 'all' | 'lost' | 'found'): void {
    this.selectedFilter.set(filter);
    this.refreshMarkers();
  }

  private refreshMarkers(): void {
    if (!this.map) return;

    // Clear existing markers
    this.map.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        this.map!.removeLayer(layer);
      }
    });

    // Add new markers
    this.addMarkers();
  }

  centerMap(): void {
    if (this.map) {
      this.map.setView(this.UII_CENTER, 16);
    }
  }

  locateMe(): void {
    if (!this.map || !this.isBrowser) return;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          this.map?.setView([latitude, longitude], 17);
          
          // Add user location marker
          const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: `<div class="user-marker"><div class="pulse"></div></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });

          L.marker([latitude, longitude], { icon: userIcon })
            .addTo(this.map!)
            .bindPopup('Lokasi Anda');
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Tidak dapat mengakses lokasi Anda');
        }
      );
    }
  }
}
