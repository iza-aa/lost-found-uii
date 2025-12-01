import { Component, Input, Output, EventEmitter, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FinderFormData {
  // Verification questions created by finder (REQUIRED for Lost items)
  verificationQuestions: Array<{ question: string; answer: string }>;
  photoUrl?: string;
  // Contact preferences
  exposePhone: boolean;
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
  
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<FinderFormData>();

  // Verification questions created by finder (for Lost items)
  verificationQuestions: Array<{ question: string; answer: string }> = [
    { question: '', answer: '' }
  ];
  
  photoUrl: string = '';
  photoPreview: string = '';
  
  // Contact preferences
  exposePhone: boolean = true;
  additionalContact: string = '';

  isSubmitting = signal(false);
  isSuccess = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.resetForm();
      // Initialize with one empty question
      this.verificationQuestions = [{ question: '', answer: '' }];
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
    this.verificationQuestions = [{ question: '', answer: '' }];
    this.photoUrl = '';
    this.photoPreview = '';
    this.exposePhone = true;
    this.additionalContact = '';
    this.isSuccess.set(false);
    this.isSubmitting.set(false);
  }

  // Question management
  addQuestion(): void {
    if (this.verificationQuestions.length < 3) {
      this.verificationQuestions.push({ question: '', answer: '' });
    }
  }

  removeQuestion(index: number): void {
    if (this.verificationQuestions.length > 1) {
      this.verificationQuestions.splice(index, 1);
    }
  }

  // Photo handling
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

  // Toggle phone exposure
  toggleExposePhone(): void {
    this.exposePhone = !this.exposePhone;
    if (this.exposePhone) {
      this.additionalContact = '';
    }
  }

  canSubmit(): boolean {
    // Must have at least 1 valid verification question with answer
    const hasValidQuestion = this.verificationQuestions.some(
      q => q.question.trim().length >= 5 && q.answer.trim().length >= 1
    );
    
    // If not exposing phone, must have alternative contact
    if (!this.exposePhone && this.additionalContact.trim().length < 3) {
      return false;
    }
    
    return hasValidQuestion;
  }

  onSubmit(): void {
    if (!this.canSubmit()) return;

    this.isSubmitting.set(true);

    // Filter out empty questions
    const validQuestions = this.verificationQuestions.filter(
      q => q.question.trim().length > 0 && q.answer.trim().length > 0
    );

    // Simulate submission delay
    setTimeout(() => {
      this.submit.emit({
        verificationQuestions: validQuestions,
        photoUrl: this.photoUrl || undefined,
        exposePhone: this.exposePhone,
        additionalContact: this.additionalContact || undefined
      });
      this.isSubmitting.set(false);
      this.isSuccess.set(true);
    }, 1500);
  }
}
