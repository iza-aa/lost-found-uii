import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Item, Category, ItemCategory } from '../../core/models';
import { ApiService, ItemResponse, Category as ApiCategory } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ItemCardComponent, EmptyStateComponent, SearchBarComponent, CategoryFilterComponent } from '../../shared/components';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ItemCardComponent, EmptyStateComponent, SearchBarComponent, CategoryFilterComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  searchQuery = '';
  selectedCategory: ItemCategory | 'all' = 'all';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 12;
  itemsPerPageOptions = [8, 12, 16, 24];
  
  // Loading state
  isLoading = signal(true); // Start with loading true
  errorMessage = signal('');
  
  items: Item[] = []; // Start empty, no mock data
  categories: Category[] = [{ id: 'all', label: 'Semua', icon: 'ph-squares-four' }]; // Start with just "Semua"
  
  // Store API categories for mapping
  private apiCategories: ApiCategory[] = [];

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadItems();
  }

  loadCategories(): void {
    this.apiService.getCategories().subscribe({
      next: (apiCats) => {
        this.apiCategories = apiCats;
        // Map API categories to frontend format
        const mappedCategories: Category[] = apiCats.map(cat => ({
          id: this.mapCategoryNameToId(cat.name) as ItemCategory,
          label: cat.name,
          icon: this.getCategoryIcon(cat.name)
        }));
        // Add "Semua" at the beginning
        this.categories = [
          { id: 'all', label: 'Semua', icon: 'ph-squares-four' },
          ...mappedCategories
        ];
        console.log('Categories loaded:', this.categories);
      },
      error: (error) => {
        console.error('Failed to load categories:', error);
      }
    });
  }

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

  private getCategoryIcon(name: string): string {
    const iconMap: Record<string, string> = {
      'Tas': 'ph-bag',
      'Dompet': 'ph-wallet',
      'HP': 'ph-device-mobile',
      'Elektronik': 'ph-laptop',
      'Dokumen': 'ph-file-text',
      'Kunci': 'ph-key',
      'Pakaian': 'ph-t-shirt',
      'Lainnya': 'ph-dots-three'
    };
    return iconMap[name] || 'ph-dots-three';
  }

  loadItems(): void {
    // If user not authenticated, show empty state with message
    if (!this.authService.isAuthenticated()) {
      console.log('User not authenticated');
      this.items = [];
      this.isLoading.set(false);
      this.errorMessage.set('Silakan login untuk melihat barang yang dilaporkan.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.apiService.getAllItems().subscribe({
      next: (apiItems) => {
        // Map API response to frontend Item model
        this.items = this.mapApiItemsToFrontend(apiItems);
        this.isLoading.set(false);
        console.log('Items loaded from API:', this.items);
      },
      error: (error) => {
        console.error('Failed to load items from API:', error);
        this.items = [];
        this.isLoading.set(false);
        this.errorMessage.set('Gagal memuat data. Silakan coba lagi.');
      }
    });
  }

  private mapApiItemsToFrontend(apiItems: ItemResponse[]): Item[] {
    return apiItems.map(apiItem => {
      // Determine reporter info based on item type
      const reporter = apiItem.finder || apiItem.owner;
      const reporterName = reporter?.name || 'Unknown';
      const reporterBadge = this.mapRoleToBadge(reporter?.role);

      return {
        id: apiItem.id,
        title: apiItem.title,
        description: apiItem.description || '',
        category: this.mapCategoryName(apiItem.category_name) as ItemCategory,
        status: apiItem.type === 'FOUND' ? 'found' : 'lost',
        reportStatus: apiItem.status === 'OPEN' ? 'active' : (apiItem.status === 'CLAIMED' ? 'claimed' : 'resolved') as any,
        imageUrl: apiItem.image_url || 'https://placehold.co/400x300?text=No+Image',
        date: new Date(apiItem.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        time: new Date(apiItem.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        location: {
          name: apiItem.location_name || 'Unknown Location',
          lat: 0,
          lng: 0
        },
        reporterId: reporter?.id || '',
        reporterName: reporterName,
        reporterBadge: reporterBadge,
        createdAt: new Date(apiItem.created_at),
        verificationQuestions: apiItem.verifications?.map((v, i) => ({
          id: `vq_${i}`,
          question: v.question,
          answer: '', // Hidden
          isRequired: true
        })) || []
      } as Item;
    });
  }

  private mapRoleToBadge(role?: string): 'gold' | 'blue' | 'gray' {
    if (!role) return 'gray';
    switch (role) {
      case 'STAFF_DOSEN': return 'gold';
      case 'MAHASISWA': return 'blue';
      default: return 'gray';
    }
  }

  private mapCategoryName(categoryName?: string): string {
    if (!categoryName) return 'others';
    
    // Map backend category names to frontend category IDs
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

  // Helper to get location string
  private getLocationString(location: string | { lat: number; lng: number; name: string }): string {
    return typeof location === 'string' ? location : location.name;
  }

  // Filtered items (sebelum pagination)
  get filteredItems(): Item[] {
    return this.items.filter(item => {
      const locationStr = this.getLocationString(item.location);
      const matchesSearch = item.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                           item.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                           locationStr.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      const matchesCategory = this.selectedCategory === 'all' || item.category === this.selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }

  // Paginated items (untuk ditampilkan)
  get paginatedItems(): Item[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredItems.slice(startIndex, startIndex + this.itemsPerPage);
  }

  // Total halaman
  get totalPages(): number {
    return Math.ceil(this.filteredItems.length / this.itemsPerPage);
  }

  // Array halaman untuk pagination
  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let start = Math.max(2, this.currentPage - 1);
      let end = Math.min(this.totalPages - 1, this.currentPage + 1);
      
      if (start > 2) {
        pages.push(-1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < this.totalPages - 1) {
        pages.push(-1);
      }
      
      pages.push(this.totalPages);
    }
    
    return pages;
  }

  get itemRangeStart(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get itemRangeEnd(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredItems.length);
  }

  selectCategory(categoryId: ItemCategory | 'all') {
    this.selectedCategory = categoryId;
    this.currentPage = 1;
  }

  onSearchChange() {
    this.currentPage = 1;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevPage() {
    this.goToPage(this.currentPage - 1);
  }

  nextPage() {
    this.goToPage(this.currentPage + 1);
  }

  changeItemsPerPage(count: number) {
    this.itemsPerPage = count;
    this.currentPage = 1;
  }
}
