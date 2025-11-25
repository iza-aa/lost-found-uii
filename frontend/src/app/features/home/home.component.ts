import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Item, Category, ItemCategory } from '../../core/models';
import { MOCK_ITEMS, MOCK_CATEGORIES } from '../../core/mocks';
import { ItemCardComponent, EmptyStateComponent, SearchBarComponent, CategoryFilterComponent } from '../../shared/components';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ItemCardComponent, EmptyStateComponent, SearchBarComponent, CategoryFilterComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  searchQuery = '';
  selectedCategory: ItemCategory | 'all' = 'all';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 12;
  itemsPerPageOptions = [8, 12, 16, 24];
  
  items: Item[] = MOCK_ITEMS;
  categories: Category[] = MOCK_CATEGORIES;

  // Filtered items (sebelum pagination)
  get filteredItems(): Item[] {
    return this.items.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                           item.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                           item.location.toLowerCase().includes(this.searchQuery.toLowerCase());
      
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
