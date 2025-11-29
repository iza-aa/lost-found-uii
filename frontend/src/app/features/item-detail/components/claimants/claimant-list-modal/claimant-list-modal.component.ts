import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Claimant, ClaimantStatus } from '../../../../../core/models';
import { UserBadgeComponent } from '../../../../../shared/components/user-badge/user-badge.component';

@Component({
  selector: 'app-claimant-list-modal',
  standalone: true,
  imports: [CommonModule, UserBadgeComponent],
  templateUrl: './claimant-list-modal.component.html',
  styleUrls: ['./claimant-list-modal.component.css']
})
export class ClaimantListModalComponent {
  @Input() isOpen: boolean = false;
  @Input() claimants: Claimant[] = [];
  
  @Output() close = new EventEmitter<void>();
  @Output() viewDetail = new EventEmitter<Claimant>();

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(): void {
    this.close.emit();
  }

  onViewDetail(claimant: Claimant): void {
    this.viewDetail.emit(claimant);
  }

  getStatusLabel(status: ClaimantStatus): string {
    switch (status) {
      case 'pending': return 'Menunggu';
      case 'approved': return 'Disetujui';
      case 'rejected': return 'Ditolak';
      default: return status;
    }
  }

  getStatusColorClass(status: ClaimantStatus): string {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400';
      case 'approved': return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400';
      case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  }
}
