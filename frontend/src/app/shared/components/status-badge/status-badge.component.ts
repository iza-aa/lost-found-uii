import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemStatus } from '../../../core/models';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.css'
})
export class StatusBadgeComponent {
  @Input() status!: ItemStatus;

  get statusLabel(): string {
    switch (this.status) {
      case 'lost': return 'Hilang';
      case 'found': return 'Ditemukan';
      default: return this.status;
    }
  }

  get statusClass(): string {
    switch (this.status) {
      case 'lost': return 'bg-red-100 text-red-700';
      case 'found': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  }
}
