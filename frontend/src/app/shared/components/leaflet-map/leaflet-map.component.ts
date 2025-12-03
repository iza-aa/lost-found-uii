import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, PLATFORM_ID, Inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import type * as LeafletTypes from 'leaflet';

type LeafletModule = typeof LeafletTypes;
let L: LeafletModule;

export interface MapMarker {
  lat: number;
  lng: number;
  popupContent?: string;
  icon?: 'default' | 'lost' | 'found' | 'user' | 'selected';
  data?: any;
}

export interface MapClickEvent {
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-leaflet-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaflet-map.component.html',
  styleUrls: ['./leaflet-map.component.css']
})
export class LeafletMapComponent implements OnInit, OnDestroy, OnChanges {
  private isBrowser: boolean;
  private map: LeafletTypes.Map | null = null;
  private markersLayer: LeafletTypes.LayerGroup | null = null;
  private userMarker: LeafletTypes.Marker | null = null;

  // Inputs
  @Input() mapId: string = 'map';
  @Input() center: [number, number] = [-7.6872, 110.4098]; // UII Campus
  @Input() zoom: number = 16;
  @Input() height: string = '300px';
  @Input() markers: MapMarker[] = [];
  @Input() interactive: boolean = true;
  @Input() showZoomControl: boolean = true;
  @Input() clickable: boolean = false;
  @Input() selectedLocation: { lat: number; lng: number } | null = null;

  // Outputs
  @Output() mapClick = new EventEmitter<MapClickEvent>();
  @Output() markerClick = new EventEmitter<MapMarker>();
  @Output() mapReady = new EventEmitter<void>();

  isLoading = signal(true);

  constructor(
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      setTimeout(() => this.initMap(), 50);
    }
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['markers'] && !changes['markers'].firstChange) {
      this.updateMarkers();
    }
    if (changes['selectedLocation'] && !changes['selectedLocation'].firstChange) {
      this.updateSelectedMarker();
    }
    if (changes['center'] && !changes['center'].firstChange && this.map) {
      this.map.setView(this.center, this.zoom);
    }
  }

  private async initMap(): Promise<void> {
    if (!this.isBrowser || this.map) return;

    const mapElement = document.getElementById(this.mapId);
    if (!mapElement) return;

    // Dynamic import Leaflet - handle both ESM default export and namespace
    const leafletModule = await import('leaflet');
    L = (leafletModule as any).default || leafletModule;

    this.map = L.map(this.mapId, {
      zoomControl: false,
      dragging: this.interactive,
      scrollWheelZoom: this.interactive,
      doubleClickZoom: this.interactive,
      touchZoom: this.interactive
    }).setView(this.center, this.zoom);

    // Add zoom control if enabled
    if (this.showZoomControl && this.interactive) {
      L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    }

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    // Initialize markers layer
    this.markersLayer = L.layerGroup().addTo(this.map);

    // Add click handler if clickable
    if (this.clickable) {
      this.map.on('click', (e: LeafletTypes.LeafletMouseEvent) => {
        this.mapClick.emit({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    }

    // Add initial markers
    this.updateMarkers();

    // Add selected location marker if exists
    if (this.selectedLocation) {
      this.updateSelectedMarker();
    }

    this.isLoading.set(false);
    this.mapReady.emit();
  }

  private updateMarkers(): void {
    if (!this.map || !this.markersLayer) return;

    // Clear existing markers
    this.markersLayer.clearLayers();

    // Ensure markers is an array
    const markersArray = Array.isArray(this.markers) ? this.markers : [];

    // Add new markers
    markersArray.forEach(marker => {
      const icon = this.createIcon(marker.icon || 'default');
      const leafletMarker = L.marker([marker.lat, marker.lng], { icon })
        .addTo(this.markersLayer!);

      if (marker.popupContent) {
        leafletMarker.bindPopup(marker.popupContent, {
          maxWidth: 280,
          className: 'custom-popup'
        });
      }

      leafletMarker.on('click', () => {
        this.markerClick.emit(marker);
      });
    });
  }

  private updateSelectedMarker(): void {
    if (!this.map) return;

    // Remove existing selected marker
    if (this.userMarker) {
      this.map.removeLayer(this.userMarker);
      this.userMarker = null;
    }

    // Add new selected marker
    if (this.selectedLocation) {
      const icon = this.createIcon('selected');
      this.userMarker = L.marker(
        [this.selectedLocation.lat, this.selectedLocation.lng], 
        { icon }
      ).addTo(this.map);
    }
  }

  private createIcon(type: string): LeafletTypes.DivIcon {
    switch (type) {
      case 'lost':
        return L.divIcon({
          className: 'custom-marker',
          html: `
            <div class="marker-pin lost">
              <i class="ph ph-question"></i>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -36]
        });

      case 'found':
        return L.divIcon({
          className: 'custom-marker',
          html: `
            <div class="marker-pin found">
              <i class="ph ph-check"></i>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -36]
        });

      case 'user':
        return L.divIcon({
          className: 'custom-marker',
          html: `<div class="user-location"><div class="pulse"></div></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

      case 'selected':
        return L.divIcon({
          className: 'custom-marker',
          html: `
            <div class="marker-pin selected">
              <i class="ph-fill ph-map-pin"></i>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          popupAnchor: [0, -40]
        });

      default:
        return L.divIcon({
          className: 'custom-marker',
          html: `
            <div class="marker-pin default">
              <i class="ph-fill ph-map-pin"></i>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32]
        });
    }
  }

  // Public methods
  public destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.markersLayer = null;
      this.userMarker = null;
    }
  }

  public setView(lat: number, lng: number, zoom?: number): void {
    if (this.map) {
      this.map.setView([lat, lng], zoom || this.zoom);
    }
  }

  public addUserLocation(lat: number, lng: number): void {
    if (!this.map) return;

    const icon = this.createIcon('user');
    L.marker([lat, lng], { icon })
      .addTo(this.map)
      .bindPopup('Lokasi Anda');
  }

  public invalidateSize(): void {
    if (this.map) {
      setTimeout(() => this.map?.invalidateSize(), 100);
    }
  }
}
