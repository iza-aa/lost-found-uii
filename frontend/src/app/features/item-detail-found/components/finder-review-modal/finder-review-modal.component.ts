import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ReviewClaim {
  id: string;
  owner?: {
    id: string;
    name: string;
    phone?: string;
    role: string;
  };
  answers: { question: string; answer: string }[];
  status: string;
}

@Component({
  selector: 'app-finder-review-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './finder-review-modal.component.html'
})
export class FinderReviewModalComponent {
  @Input() isOpen = false;
  @Input() claim: ReviewClaim | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() approve = new EventEmitter<void>();
  @Output() reject = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }

  onApprove(): void {
    this.approve.emit();
    this.close.emit();
  }

  onReject(): void {
    this.reject.emit();
    this.close.emit();
  }

  formatRole(role: string): string {
    const roleMap: Record<string, string> = {
      'MAHASISWA': 'Mahasiswa',
      'STAFF_DOSEN': 'Staff / Dosen',
      'STAFF': 'Staff',
      'DOSEN': 'Dosen',
      'PUBLIC': 'Publik'
    };
    return roleMap[role] || 'Publik';
  }

  getRoleBadgeClass(role: string): string {
    const baseClass = 'text-xs px-2 py-0.5 rounded-full font-medium';
    const colorMap: Record<string, string> = {
      'MAHASISWA': 'bg-blue-100 text-blue-700',
      'STAFF_DOSEN': 'bg-amber-100 text-amber-700',
      'STAFF': 'bg-amber-100 text-amber-700',
      'DOSEN': 'bg-amber-100 text-amber-700',
      'PUBLIC': 'bg-gray-100 text-gray-600'
    };
    return `${baseClass} ${colorMap[role] || colorMap['PUBLIC']}`;
  }
}
