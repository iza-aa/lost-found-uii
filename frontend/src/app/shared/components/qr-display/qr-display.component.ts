import { Component, Input, ElementRef, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QRCodeModule } from 'angularx-qrcode';

@Component({
  selector: 'app-qr-display',
  standalone: true,
  imports: [CommonModule, QRCodeModule],
  templateUrl: './qr-display.component.html',
  styleUrls: ['./qr-display.component.css']
})
export class QrDisplayComponent {
  @ViewChild('qrContainer') qrContainer!: ElementRef;

  @Input() data: string = '';
  @Input() size: number = 200;
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() showDownload: boolean = true;
  @Input() showShare: boolean = true;
  @Input() darkColor: string = '#003479'; // UII Blue
  @Input() lightColor: string = '#ffffff';

  isDownloading = signal(false);

  async downloadQR(): Promise<void> {
    this.isDownloading.set(true);

    try {
      // Get the QR code canvas element
      const canvas = this.qrContainer.nativeElement.querySelector('canvas');
      
      if (canvas) {
        // Create a new canvas with padding and info
        const padding = 40;
        const textHeight = this.title ? 60 : 0;
        const newCanvas = document.createElement('canvas');
        const ctx = newCanvas.getContext('2d');
        
        newCanvas.width = canvas.width + padding * 2;
        newCanvas.height = canvas.height + padding * 2 + textHeight;
        
        if (ctx) {
          // White background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
          
          // Draw QR code
          ctx.drawImage(canvas, padding, padding);
          
          // Draw title if exists
          if (this.title) {
            ctx.fillStyle = '#1f2937';
            ctx.font = 'bold 16px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(this.title, newCanvas.width / 2, canvas.height + padding + 30);
          }
          
          // Draw subtitle if exists
          if (this.subtitle) {
            ctx.fillStyle = '#6b7280';
            ctx.font = '12px Inter, system-ui, sans-serif';
            ctx.fillText(this.subtitle, newCanvas.width / 2, canvas.height + padding + 50);
          }
          
          // Download
          const link = document.createElement('a');
          link.download = `qr-${this.title || 'code'}.png`;
          link.href = newCanvas.toDataURL('image/png');
          link.click();
        }
      }
    } catch (error) {
      console.error('Error downloading QR:', error);
    } finally {
      this.isDownloading.set(false);
    }
  }

  async shareQR(): Promise<void> {
    try {
      const canvas = this.qrContainer.nativeElement.querySelector('canvas');
      
      if (canvas && navigator.share) {
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b: Blob) => resolve(b), 'image/png');
        });
        
        const file = new File([blob], `qr-${this.title || 'code'}.png`, { type: 'image/png' });
        
        await navigator.share({
          title: this.title || 'QR Code',
          text: this.subtitle || 'Scan QR Code ini',
          files: [file]
        });
      } else {
        // Fallback: copy URL to clipboard
        await navigator.clipboard.writeText(this.data);
        alert('Link berhasil disalin!');
      }
    } catch (error) {
      console.error('Error sharing QR:', error);
    }
  }
}
