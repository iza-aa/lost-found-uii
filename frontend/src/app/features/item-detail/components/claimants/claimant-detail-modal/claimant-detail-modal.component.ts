import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Claimant, ClaimantStatus } from '../../../../../core/models';
import { UserBadgeComponent } from '../../../../../shared/components/user-badge/user-badge.component';

@Component({
  selector: 'app-claimant-detail-modal',
  standalone: true,
  imports: [CommonModule, UserBadgeComponent],
  templateUrl: './claimant-detail-modal.component.html',
  styleUrls: ['./claimant-detail-modal.component.css']
})
export class ClaimantDetailModalComponent {
  @Input() isOpen: boolean = false;
  @Input() claimant: Claimant | null = null;
  
  @Output() close = new EventEmitter<void>();
  @Output() approve = new EventEmitter<Claimant>();
  @Output() reject = new EventEmitter<Claimant>();

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(): void {
    this.close.emit();
  }

  onApprove(): void {
    if (this.claimant) {
      this.approve.emit(this.claimant);
    }
  }

  onReject(): void {
    if (this.claimant) {
      this.reject.emit(this.claimant);
    }
  }
}
