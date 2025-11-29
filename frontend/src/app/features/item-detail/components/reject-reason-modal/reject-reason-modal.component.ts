import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reject-reason-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reject-reason-modal.component.html',
  styleUrls: ['./reject-reason-modal.component.css']
})
export class RejectReasonModalComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string = 'Tolak?';
  @Input() subtitle: string = 'Berikan alasan penolakan (opsional)';
  @Input() placeholder: string = 'Contoh: Bukti tidak cukup...';
  @Input() confirmText: string = 'Tolak';
  
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<string>();

  reason: string = '';

  onClose(): void {
    this.reason = '';
    this.close.emit();
  }

  onBackdropClick(): void {
    this.onClose();
  }

  onConfirm(): void {
    this.confirm.emit(this.reason);
    this.reason = '';
  }
}
