import { Component, Output, EventEmitter, OnDestroy, AfterViewInit, signal, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qr-scanner.component.html',
  styleUrls: ['./qr-scanner.component.css']
})
export class QrScannerComponent implements AfterViewInit, OnDestroy {
  @Output() scanSuccess = new EventEmitter<string>();
  @Output() scanError = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  private html5QrCode: any = null;
  private isBrowser: boolean;

  isLoading = signal(true);
  hasError = signal(false);
  errorMessage = signal('');
  isFlashOn = signal(false);
  currentCamera = signal<'environment' | 'user'>('environment');

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  async ngAfterViewInit(): Promise<void> {
    if (this.isBrowser) {
      await this.initScanner();
    }
  }

  ngOnDestroy(): void {
    this.stopScanner();
  }

  private async initScanner(): Promise<void> {
    try {
      const Html5Qrcode = (await import('html5-qrcode')).Html5Qrcode;
      
      this.html5QrCode = new Html5Qrcode('qr-reader');
      
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await this.html5QrCode.start(
        { facingMode: this.currentCamera() },
        config,
        (decodedText: string) => {
          this.onScanSuccess(decodedText);
        },
        (errorMessage: string) => {
          // Ignore continuous scanning errors
        }
      );

      this.isLoading.set(false);
    } catch (error: any) {
      this.isLoading.set(false);
      this.hasError.set(true);
      this.errorMessage.set(this.getErrorMessage(error));
      this.scanError.emit(this.errorMessage());
    }
  }

  private getErrorMessage(error: any): string {
    if (error?.message?.includes('Permission denied')) {
      return 'Akses kamera ditolak. Mohon izinkan akses kamera di pengaturan browser.';
    }
    if (error?.message?.includes('NotFoundError')) {
      return 'Kamera tidak ditemukan pada perangkat ini.';
    }
    if (error?.message?.includes('NotAllowedError')) {
      return 'Akses kamera tidak diizinkan. Mohon izinkan akses kamera.';
    }
    return 'Gagal mengakses kamera. Pastikan tidak ada aplikasi lain yang menggunakan kamera.';
  }

  private onScanSuccess(decodedText: string): void {
    // Vibrate on success (if supported)
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
    
    this.stopScanner();
    this.scanSuccess.emit(decodedText);
  }

  async stopScanner(): Promise<void> {
    if (this.html5QrCode) {
      try {
        await this.html5QrCode.stop();
        this.html5QrCode.clear();
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
  }

  async toggleCamera(): Promise<void> {
    await this.stopScanner();
    this.currentCamera.set(this.currentCamera() === 'environment' ? 'user' : 'environment');
    this.isLoading.set(true);
    this.hasError.set(false);
    await this.initScanner();
  }

  async toggleFlash(): Promise<void> {
    if (this.html5QrCode) {
      try {
        const track = this.html5QrCode.getRunningTrackCameraCapabilities();
        if (track?.torchFeature()?.isSupported()) {
          const newState = !this.isFlashOn();
          await track.torchFeature().apply(newState);
          this.isFlashOn.set(newState);
        }
      } catch (error) {
        console.error('Flash not supported:', error);
      }
    }
  }

  onClose(): void {
    this.stopScanner();
    this.close.emit();
  }

  async retryScanner(): Promise<void> {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.errorMessage.set('');
    await this.initScanner();
  }
}
