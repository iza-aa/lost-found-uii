import { Component, Input, Output, EventEmitter, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Finder, VerificationAnswer } from '../../../../../core/models';
import { UserBadgeComponent } from '../../../../../shared/components/user-badge/user-badge.component';

export interface OwnerAnswerData {
  finderId: string;
  answers: VerificationAnswer[];
}

@Component({
  selector: 'app-answer-questions-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, UserBadgeComponent],
  templateUrl: './answer-questions-modal.component.html',
  styleUrls: ['./answer-questions-modal.component.css']
})
export class AnswerQuestionsModalComponent implements OnChanges {
  @Input() isOpen: boolean = false;
  @Input() finder: Finder | null = null;
  
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<OwnerAnswerData>();

  // Answers array matching verification questions
  answers: string[] = [];

  isSubmitting = signal(false);
  isSuccess = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen && this.finder) {
      this.resetForm();
      // Initialize answers array
      this.answers = this.finder.verificationQuestions.map(() => '');
    }
  }

  onClose(): void {
    this.close.emit();
    this.resetForm();
  }

  onBackdropClick(): void {
    this.close.emit();
    this.resetForm();
  }

  resetForm(): void {
    this.answers = [];
    this.isSuccess.set(false);
    this.isSubmitting.set(false);
  }

  canSubmit(): boolean {
    if (!this.finder) return false;
    // All questions must have answers (min 1 char)
    return this.answers.every(a => a.trim().length >= 1);
  }

  onSubmit(): void {
    if (!this.canSubmit() || !this.finder) return;

    this.isSubmitting.set(true);

    // Build answers array
    const answersData: VerificationAnswer[] = this.finder.verificationQuestions.map((q, index) => ({
      questionId: `q-${index}`,
      question: q.question,
      answer: this.answers[index].trim()
    }));

    // Simulate submission delay
    setTimeout(() => {
      this.submit.emit({
        finderId: this.finder!.id,
        answers: answersData
      });
      this.isSubmitting.set(false);
      this.isSuccess.set(true);
    }, 1000);
  }
}
