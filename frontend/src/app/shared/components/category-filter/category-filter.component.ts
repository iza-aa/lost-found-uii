import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category, ItemCategory } from '../../../core/models';

@Component({
  selector: 'app-category-filter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-filter.component.html',
  styleUrl: './category-filter.component.css'
})
export class CategoryFilterComponent {
  @Input() categories: Category[] = [];
  @Input() selectedCategory: ItemCategory | 'all' = 'all';
  @Output() categoryChange = new EventEmitter<ItemCategory | 'all'>();

  selectCategory(categoryId: ItemCategory | 'all') {
    this.selectedCategory = categoryId;
    this.categoryChange.emit(categoryId);
  }
}
