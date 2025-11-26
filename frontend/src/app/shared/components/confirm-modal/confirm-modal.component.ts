import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ConfirmModalType = 'danger' | 'warning' | 'info' | 'success';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.css']
})
export class ConfirmModalComponent {
  @Input() isOpen: boolean = false;
  @Input() type: ConfirmModalType = 'danger';
  @Input() title: string = 'Konfirmasi';
  @Input() message: string = 'Apakah Anda yakin?';
  @Input() confirmText: string = 'Ya';
  @Input() cancelText: string = 'Batal';
  @Input() icon: string = '';
  @Input() showCancel: boolean = true;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  getIconClass(): string {
    if (this.icon) return this.icon;
    
    switch (this.type) {
      case 'danger':
        return 'ph ph-warning-circle';
      case 'warning':
        return 'ph ph-warning';
      case 'success':
        return 'ph ph-check-circle';
      case 'info':
      default:
        return 'ph ph-info';
    }
  }

  getIconBgClass(): string {
    switch (this.type) {
      case 'danger':
        return 'bg-red-100 dark:bg-red-900/30';
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900/30';
      case 'success':
        return 'bg-green-100 dark:bg-green-900/30';
      case 'info':
      default:
        return 'bg-blue-100 dark:bg-blue-900/30';
    }
  }

  getIconColorClass(): string {
    switch (this.type) {
      case 'danger':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'success':
        return 'text-green-500';
      case 'info':
      default:
        return 'text-blue-500';
    }
  }

  getConfirmBtnClass(): string {
    switch (this.type) {
      case 'danger':
        return 'bg-red-500 hover:bg-red-600 text-white';
      case 'warning':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      case 'success':
        return 'bg-green-500 hover:bg-green-600 text-white';
      case 'info':
      default:
        return 'bg-uii-blue hover:bg-uii-blue/90 text-white';
    }
  }

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onBackdropClick(): void {
    this.cancel.emit();
  }
}
