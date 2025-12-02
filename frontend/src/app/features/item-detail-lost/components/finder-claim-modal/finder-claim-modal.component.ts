import { Component, EventEmitter, Input, Output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ContactEntry {
  type: string;
  value: string;
}

export interface FinderClaimData {
  questions: string[];
  showPhone: boolean;
  contacts: ContactEntry[];
}

@Component({
  selector: 'app-finder-claim-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finder-claim-modal.component.html'
})
export class FinderClaimModalComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<FinderClaimData>();

  questions = signal<string[]>(['']);
  showPhone = signal(false);
  contacts = signal<ContactEntry[]>([{ type: 'instagram', value: '' }]);

  contactOptions = [
    { value: 'instagram', label: 'Instagram' },
    { value: 'telegram', label: 'Telegram' },
    { value: 'line', label: 'LINE' },
    { value: 'email', label: 'Email' },
    { value: 'other', label: 'Lainnya' }
  ];

  canSubmit = computed(() => {
    const hasQuestions = this.questions().some(q => q.trim());
    if (this.showPhone()) {
      return hasQuestions;
    } else {
      const hasContact = this.contacts().some(c => c.value.trim());
      return hasQuestions && hasContact;
    }
  });

  // Question methods
  addQuestion(): void {
    this.questions.update(q => [...q, '']);
  }

  removeQuestion(index: number): void {
    this.questions.update(q => q.filter((_, i) => i !== index));
  }

  updateQuestion(index: number, value: string): void {
    this.questions.update(q => {
      const newQ = [...q];
      newQ[index] = value;
      return newQ;
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

  getContactIconColor(type: string): string {
    const colors: Record<string, string> = {
      'instagram': 'text-pink-500',
      'telegram': 'text-blue-500',
      'line': 'text-green-500',
      'email': 'text-gray-500',
      'other': 'text-gray-500'
    };
    return colors[type] || 'text-gray-500';
  }

  getContactPlaceholder(type: string): string {
    const placeholders: Record<string, string> = {
      'instagram': '@username',
      'telegram': '@username',
      'line': 'LINE ID',
      'email': 'email@example.com',
      'other': 'Kontak lainnya'
    };
    return placeholders[type] || 'Kontak';
  }

  onClose(): void {
    this.close.emit();
  }

  onSubmit(): void {
    const validQuestions = this.questions().filter(q => q.trim());
    if (validQuestions.length === 0) {
      alert('Tambahkan minimal 1 pertanyaan');
      return;
    }

    if (!this.showPhone()) {
      const validContacts = this.contacts().filter(c => c.value.trim());
      if (validContacts.length === 0) {
        alert('Tambahkan minimal 1 kontak alternatif');
        return;
      }
    }

    this.submit.emit({
      questions: validQuestions,
      showPhone: this.showPhone(),
      contacts: this.contacts().filter(c => c.value.trim())
    });
  }

  reset(): void {
    this.questions.set(['']);
    this.showPhone.set(false);
    this.contacts.set([{ type: 'instagram', value: '' }]);
  }
}
