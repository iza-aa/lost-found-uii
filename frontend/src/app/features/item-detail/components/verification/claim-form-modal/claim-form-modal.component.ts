import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../../../../core/models';

export interface ClaimFormData {
  description: string;
  photoUrl?: string;
  showWhatsApp: boolean;
  alternativeContact?: string;
  isQrVerified?: boolean;
}

@Component({
  selector: 'app-claim-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './claim-form-modal.component.html',
  styleUrls: ['./claim-form-modal.component.css']
})
export class ClaimFormModalComponent {
  @Input() isOpen: boolean = false;
  @Input() currentUser: User | null = null;
  @Input() isQrScanned: boolean = false;
  @Input() isQrVerified: boolean = false;
  
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<ClaimFormData>();

  form = {
    description: '',
    photoUrl: '',
    photoPreview: '',
    showWhatsApp: true,
    alternativeContact: ''
  };

  isSubmitting = signal(false);
  isSuccess = signal(false);

  onClose(): void {
    this.close.emit();
    this.resetForm();
  }

  onBackdropClick(): void {
    this.close.emit();
    this.resetForm();
  }

  resetForm(): void {
    this.form = {
      description: '',
      photoUrl: '',
      photoPreview: '',
      showWhatsApp: true,
      alternativeContact: ''
    };
    this.isSuccess.set(false);
    this.isSubmitting.set(false);
  }

  onPhotoSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.form.photoPreview = e.target?.result as string;
        this.form.photoUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto(): void {
    this.form.photoUrl = '';
    this.form.photoPreview = '';
  }

  canSubmit(): boolean {
    // For QR-verified items, no description needed
    if (this.isQrScanned && this.isQrVerified) {
      return true;
    }
    // If WhatsApp is off, alternative contact is required
    if (!this.form.showWhatsApp && !this.form.alternativeContact.trim()) {
      return false;
    }
    return this.form.description.trim().length >= 10;
  }

  onSubmit(): void {
    if (!this.canSubmit()) return;

    this.isSubmitting.set(true);

    // Simulate submission delay
    setTimeout(() => {
      this.submit.emit({
        description: this.isQrVerified ? '(QR Verified Owner)' : this.form.description,
        photoUrl: this.form.photoUrl || undefined,
        showWhatsApp: this.form.showWhatsApp,
        alternativeContact: this.form.alternativeContact || undefined,
        isQrVerified: this.isQrVerified
      });
      this.isSubmitting.set(false);
      this.isSuccess.set(true);
    }, 1500);
  }
}
