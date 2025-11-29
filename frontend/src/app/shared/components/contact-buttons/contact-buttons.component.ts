import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactEntry, AlternativeContact } from '../../../core/models';

export type ContactDisplayMode = 'grid' | 'inline' | 'list';

@Component({
  selector: 'app-contact-buttons',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contact-buttons.component.html',
  styleUrls: ['./contact-buttons.component.css']
})
export class ContactButtonsComponent {
  @Input() contacts?: ContactEntry[];
  @Input() alternativeContact?: AlternativeContact;
  @Input() phone?: string;
  @Input() exposePhone?: boolean;
  @Input() mode: ContactDisplayMode = 'grid';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() showLabels: boolean = true;

  get normalizedContacts(): ContactEntry[] {
    // If contacts array is provided, use it
    if (this.contacts && this.contacts.length > 0) {
      return this.contacts;
    }

    // If alternativeContact with contacts array
    if (this.alternativeContact?.contacts && this.alternativeContact.contacts.length > 0) {
      return this.alternativeContact.contacts;
    }

    // Convert legacy alternativeContact format to contacts array
    const result: ContactEntry[] = [];
    if (this.alternativeContact) {
      if (this.alternativeContact.type && this.alternativeContact.value) {
        result.push({ type: this.alternativeContact.type, value: this.alternativeContact.value });
      }
      if (this.alternativeContact.instagram) {
        result.push({ type: 'instagram', value: this.alternativeContact.instagram });
      }
      if (this.alternativeContact.telegram) {
        result.push({ type: 'telegram', value: this.alternativeContact.telegram });
      }
      if (this.alternativeContact.line) {
        result.push({ type: 'line', value: this.alternativeContact.line });
      }
      if (this.alternativeContact.other) {
        result.push({ type: 'other', value: this.alternativeContact.other });
      }
    }

    // Add phone as WhatsApp if exposed
    if (this.exposePhone && this.phone && result.length === 0) {
      result.push({ type: 'whatsapp_other', value: this.phone });
    }

    return result;
  }

  get hasContacts(): boolean {
    return this.normalizedContacts.length > 0;
  }

  get gridColsClass(): string {
    const count = this.normalizedContacts.length;
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    return 'grid-cols-2 lg:grid-cols-3';
  }

  get buttonSizeClass(): string {
    switch (this.size) {
      case 'sm': return 'py-1.5 px-2 text-xs';
      case 'lg': return 'py-3 px-6 text-base';
      default: return 'py-2 px-3 text-sm';
    }
  }

  getContactUrl(contact: ContactEntry): string | null {
    switch (contact.type) {
      case 'instagram':
        return `https://instagram.com/${contact.value}`;
      case 'telegram':
        return `https://t.me/${contact.value}`;
      case 'whatsapp_other':
        const waNumber = contact.value.startsWith('0') 
          ? '62' + contact.value.slice(1) 
          : contact.value;
        return `https://wa.me/${waNumber}`;
      case 'email':
        return `mailto:${contact.value}`;
      default:
        return null;
    }
  }

  getContactIcon(type: string): string {
    switch (type) {
      case 'instagram': return 'ph-fill ph-instagram-logo';
      case 'telegram': return 'ph-fill ph-telegram-logo';
      case 'whatsapp_other': return 'ph-fill ph-whatsapp-logo';
      case 'line': return 'ph ph-chat-circle-text';
      case 'email': return 'ph ph-envelope';
      default: return 'ph ph-link';
    }
  }

  getContactLabel(type: string): string {
    switch (type) {
      case 'instagram': return 'Instagram';
      case 'telegram': return 'Telegram';
      case 'whatsapp_other': return 'WhatsApp';
      case 'line': return 'LINE';
      case 'email': return 'Email';
      default: return 'Kontak';
    }
  }

  getContactColorClass(type: string): string {
    switch (type) {
      case 'instagram': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90';
      case 'telegram': return 'bg-blue-500 text-white hover:bg-blue-600';
      case 'whatsapp_other': return 'bg-green-500 text-white hover:bg-green-600';
      case 'line': return 'bg-green-500 text-white';
      case 'email': return 'bg-blue-600 text-white hover:bg-blue-700';
      default: return 'bg-gray-500 text-white hover:bg-gray-600';
    }
  }

  getDisplayValue(contact: ContactEntry): string {
    switch (contact.type) {
      case 'instagram':
      case 'telegram':
        return `@${contact.value}`;
      case 'line':
        return `LINE: ${contact.value}`;
      default:
        return contact.value;
    }
  }

  getIconColor(type: string): string {
    switch (type) {
      case 'instagram': return 'text-pink-500';
      case 'telegram': return 'text-blue-500';
      case 'whatsapp_other': return 'text-green-500';
      case 'line': return 'text-green-500';
      case 'email': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  }
}
