import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Finder, ClaimantStatus } from '../../../../../core/models';
import { UserBadgeComponent } from '../../../../../shared/components/user-badge/user-badge.component';

@Component({
  selector: 'app-finder-detail-modal',
  standalone: true,
  imports: [CommonModule, UserBadgeComponent],
  templateUrl: './finder-detail-modal.component.html',
  styleUrls: ['./finder-detail-modal.component.css']
})
export class FinderDetailModalComponent {
  @Input() isOpen: boolean = false;
  @Input() finder: Finder | null = null;
  
  @Output() close = new EventEmitter<void>();
  @Output() approve = new EventEmitter<Finder>();
  @Output() reject = new EventEmitter<Finder>();

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(): void {
    this.close.emit();
  }

  onApprove(): void {
    if (this.finder) {
      this.approve.emit(this.finder);
    }
  }

  onReject(): void {
    if (this.finder) {
      this.reject.emit(this.finder);
    }
  }

  // Helper method to format phone for WhatsApp URL
  getWhatsAppUrl(phone: string | undefined): string {
    if (!phone) return '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}`;
  }
}
