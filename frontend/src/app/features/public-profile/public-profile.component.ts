import { Component, OnInit, signal, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from '../../core/models';
import { MOCK_USERS } from '../../core/mocks';
import { UserBadgeComponent } from '../../shared/components';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-public-profile',
  standalone: true,
  imports: [CommonModule, UserBadgeComponent],
  templateUrl: './public-profile.component.html',
  styleUrls: ['./public-profile.component.css']
})
export class PublicProfileComponent implements OnInit {
  user = signal<User | null>(null);
  isLoading = signal(true);
  notFound = signal(false);
  private isBrowser: boolean;
  private rawUserParam: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object,
    private authService: AuthService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    const userParam = this.route.snapshot.paramMap.get('userId');
    
    if (userParam) {
      this.rawUserParam = userParam;
      this.loadUser(userParam);
    } else {
      this.notFound.set(true);
      this.isLoading.set(false);
    }
  }

  private loadUser(userParam: string): void {
    setTimeout(() => {
      let foundUser: User | null = null;

      // First, try to decode as base64 encoded user data (for cross-device QR)
      try {
        const decoded = atob(userParam);
        const userData = JSON.parse(decoded);
        
        if (userData && userData.name && userData.phone) {
          foundUser = {
            id: userData.id || 'qr-user',
            name: userData.name,
            email: '',
            phone: userData.phone,
            badge: userData.badge || 'gray',
            role: userData.badge === 'gold' ? 'staff' : userData.badge === 'blue' ? 'student' : 'public',
            avatar: userData.avatar,
            faculty: userData.faculty,
            studentId: userData.studentId,
            employeeId: userData.employeeId
          };
        }
      } catch {
        // Not base64, try as user ID
        foundUser = MOCK_USERS.find(u => u.id === userParam) || null;
        
        // If not found in mocks, check localStorage
        if (!foundUser && this.isBrowser) {
          const storedUser = localStorage.getItem('lf_user');
          if (storedUser) {
            try {
              const parsed = JSON.parse(storedUser) as User;
              if (parsed.id === userParam) {
                foundUser = parsed;
              }
            } catch {
              // Ignore
            }
          }
        }
      }
      
      if (foundUser) {
        this.user.set(foundUser);
      } else {
        this.notFound.set(true);
      }
      
      this.isLoading.set(false);
    }, 500);
  }

  // Check if current user is the owner of this QR
  isOwnQr(): boolean {
    const currentUser = this.authService.currentUser();
    const qrUser = this.user();
    if (!currentUser || !qrUser) return false;
    return currentUser.id === qrUser.id || currentUser.phone === qrUser.phone;
  }

  // Navigate to post-item with QR data
  reportFoundItem(): void {
    const qrUser = this.user();
    if (!qrUser) return;

    // Navigate to post-item with QR data
    this.router.navigate(['/post-item'], {
      queryParams: {
        qr: 'true',
        qrData: this.rawUserParam
      }
    });
  }

  getBadgeLabel(): string {
    const badge = this.user()?.badge;
    switch (badge) {
      case 'gold': return 'Staff UII';
      case 'blue': return 'Mahasiswa UII';
      default: return 'Pengguna Umum';
    }
  }

  getRoleLabel(): string {
    const role = this.user()?.role;
    switch (role) {
      case 'student': return 'Mahasiswa';
      case 'staff': return 'Staff';
      default: return 'Umum';
    }
  }

  contactViaWhatsApp(): void {
    const phone = this.user()?.phone;
    if (phone) {
      // Format phone number (remove leading 0, add 62)
      let formatted = phone.replace(/\D/g, '');
      if (formatted.startsWith('0')) {
        formatted = '62' + formatted.substring(1);
      }
      
      const message = encodeURIComponent('Halo, saya menemukan barang Anda melalui Lost & Found UII.');
      window.open(`https://wa.me/${formatted}?text=${message}`, '_blank');
    }
  }

  contactViaPhone(): void {
    const phone = this.user()?.phone;
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    }
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
