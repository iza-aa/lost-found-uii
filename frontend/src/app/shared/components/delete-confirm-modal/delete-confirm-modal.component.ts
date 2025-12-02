import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CubeLoaderComponent } from '../cube-loader/cube-loader.component';

@Component({
  selector: 'app-delete-confirm-modal',
  standalone: true,
  imports: [CommonModule, CubeLoaderComponent],
  templateUrl: './delete-confirm-modal.component.html'
})
export class DeleteConfirmModalComponent {
  @Input() isOpen = false;
  @Input() isLoading = false;
  @Input() title = 'Hapus Laporan?';
  @Input() message = 'Laporan akan dihapus permanen.';
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }

  onConfirm(): void {
    this.confirm.emit();
  }
}
