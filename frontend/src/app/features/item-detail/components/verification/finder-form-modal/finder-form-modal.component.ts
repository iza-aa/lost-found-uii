import { Component, Input, Output, EventEmitter, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VerificationQuestion, VerificationAnswer } from '../../../../../core/models';

export interface FinderFormData {
  answers: VerificationAnswer[];
  photoUrl?: string;
  additionalContact?: string;
}

@Component({
  selector: 'app-finder-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finder-form-modal.component.html',
  styleUrls: ['./finder-form-modal.component.css']
})
export class FinderFormModalComponent implements OnChanges {
  @Input() isOpen: boolean = false;
  @Input() questions: VerificationQuestion[] = [];
  
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<FinderFormData>();

  answers: { questionId: string; question: string; answer: string }[] = [];
  photoUrl: string = '';
  photoPreview: string = '';
  additionalContact: string = '';

  isSubmitting = signal(false);
  isSuccess = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['questions'] || changes['isOpen']) {
      if (this.isOpen && this.questions) {
        this.initializeAnswers();
      }
    }
  }

  initializeAnswers(): void {
    this.answers = this.questions.map(q => ({
      questionId: q.id,
      question: q.question,
      answer: ''
    }));
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
    this.photoUrl = '';
    this.photoPreview = '';
    this.additionalContact = '';
    this.isSuccess.set(false);
    this.isSubmitting.set(false);
  }

  onPhotoSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.photoPreview = e.target?.result as string;
        this.photoUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto(): void {
    this.photoUrl = '';
    this.photoPreview = '';
  }

  isQuestionRequired(index: number): boolean {
    return this.questions[index]?.isRequired ?? false;
  }

  canSubmit(): boolean {
    // Check that all required questions are answered
    for (let i = 0; i < this.questions.length; i++) {
      if (this.questions[i].isRequired) {
        const answer = this.answers[i];
        if (!answer || answer.answer.trim().length < 3) {
          return false;
        }
      }
    }
    return true;
  }

  onSubmit(): void {
    if (!this.canSubmit()) return;

    this.isSubmitting.set(true);

    // Simulate submission delay
    setTimeout(() => {
      this.submit.emit({
        answers: this.answers as VerificationAnswer[],
        photoUrl: this.photoUrl || undefined,
        additionalContact: this.additionalContact || undefined
      });
      this.isSubmitting.set(false);
      this.isSuccess.set(true);
    }, 1500);
  }
}
