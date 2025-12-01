import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Finder, ClaimantStatus } from '../../../../../core/models';
import { UserBadgeComponent } from '../../../../../shared/components/user-badge/user-badge.component';

@Component({
  selector: 'app-finder-list-modal',
  standalone: true,
  imports: [CommonModule, UserBadgeComponent],
  templateUrl: './finder-list-modal.component.html',
  styleUrls: ['./finder-list-modal.component.css']
})
export class FinderListModalComponent {
  @Input() isOpen: boolean = false;
  @Input() finders: Finder[] = [];
  
  @Output() close = new EventEmitter<void>();
  @Output() viewDetail = new EventEmitter<Finder>();
  @Output() answerQuestions = new EventEmitter<Finder>();

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(): void {
    this.close.emit();
  }

  onViewDetail(finder: Finder): void {
    this.viewDetail.emit(finder);
  }

  onAnswerQuestions(finder: Finder, event: Event): void {
    event.stopPropagation();
    this.answerQuestions.emit(finder);
  }

  getStatusLabel(status: ClaimantStatus | 'answered'): string {
    switch (status) {
      case 'pending': return 'Menunggu Jawaban';
      case 'answered': return 'Menunggu Validasi';
      case 'approved': return 'Disetujui';
      case 'rejected': return 'Ditolak';
      default: return status;
    }
  }

  getStatusColorClass(status: ClaimantStatus | 'answered'): string {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400';
      case 'answered': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400';
      case 'approved': return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400';
      case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  getFirstQuestion(finder: Finder): string {
    if (finder.verificationQuestions && finder.verificationQuestions.length > 0) {
      return finder.verificationQuestions[0].question;
    }
    return 'Tidak ada pertanyaan';
  }

  getQuestionsCount(finder: Finder): number {
    return finder.verificationQuestions?.length || 0;
  }
}
