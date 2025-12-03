import { Component, EventEmitter, Input, Output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ContactEntry {
  type: string;
  value: string;
}

export interface OwnerClaimData {
  answers: string[];
  showPhone: boolean;
  contacts: ContactEntry[];
}

@Component({
  selector: 'app-owner-claim-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './owner-claim-modal.component.html'
})
export class OwnerClaimModalComponent {
  @Input() isOpen = false;
  @Input() questions: { question: string }[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<OwnerClaimData>();

  answers = signal<string[]>([]);
  showPhone = signal(true);
  contacts = signal<ContactEntry[]>([{ type: 'instagram', value: '' }]);

  contactOptions = [
    { value: 'instagram', label: 'Instagram' },
    { value: 'telegram', label: 'Telegram' },
    { value: 'line', label: 'LINE' },
    { value: 'email', label: 'Email' },
    { value: 'other', label: 'Lainnya' }
  ];

  ngOnChanges(): void {
    // Initialize answers array when questions change
    const questionsArray = Array.isArray(this.questions) ? this.questions : [];
    if (questionsArray.length > 0 && this.answers().length !== questionsArray.length) {
      this.answers.set(questionsArray.map(() => ''));
    }
  }

  canSubmit = computed(() => {
    const allAnswered = this.answers().every(a => a.trim().length > 0);
    if (this.showPhone()) {
      return allAnswered;
    } else {
      const hasContact = this.contacts().some(c => c.value.trim());
      return allAnswered && hasContact;
    }
  });

  updateAnswer(index: number, value: string): void {
    this.answers.update(a => {
      const newA = [...a];
      newA[index] = value;
      return newA;
    });
  }

  // Contact methods
  addContact(): void {
    this.contacts.update(c => [...c, { type: 'instagram', value: '' }]);
  }

  removeContact(index: number): void {
    this.contacts.update(c => c.filter((_, i) => i !== index));
  }

  updateContactType(index: number, type: string): void {
    this.contacts.update(c => {
      const newC = [...c];
      newC[index] = { ...newC[index], type };
      return newC;
    });
  }

  updateContactValue(index: number, value: string): void {
    this.contacts.update(c => {
      const newC = [...c];
      newC[index] = { ...newC[index], value };
      return newC;
    });
  }

  getContactIcon(type: string): string {
    const icons: Record<string, string> = {
      'instagram': 'ph-fill ph-instagram-logo',
      'telegram': 'ph-fill ph-telegram-logo',
      'line': 'ph-fill ph-chat-circle',
      'email': 'ph-fill ph-envelope',
      'other': 'ph ph-link'
    };
    return icons[type] || 'ph ph-link';
  }

  getPlaceholder(type: string): string {
    const placeholders: Record<string, string> = {
      'instagram': '@username',
      'telegram': '@username',
      'line': 'ID Line',
      'email': 'email@example.com',
      'other': 'Kontak lainnya'
    };
    return placeholders[type] || 'Kontak';
  }

  onClose(): void {
    this.close.emit();
  }

  onSubmit(): void {
    if (!this.canSubmit()) return;
    
    this.submit.emit({
      answers: this.answers(),
      showPhone: this.showPhone(),
      contacts: this.contacts().filter(c => c.value.trim())
    });
  }

  reset(): void {
    const questionsArray = Array.isArray(this.questions) ? this.questions : [];
    this.answers.set(questionsArray.map(() => ''));
    this.showPhone.set(true);
    this.contacts.set([{ type: 'instagram', value: '' }]);
  }
}
