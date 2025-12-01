import { Injectable, PLATFORM_ID, Inject, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { User, UserRole, UserBadge } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEY = 'lf_user';
  private isBrowser: boolean;
  
  // Signals for reactive state
  private currentUserSignal = signal<User | null>(null);
  
  // Public computed values
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);
  readonly userBadge = computed(() => this.currentUserSignal()?.badge ?? null);

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private router: Router
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.loadUserFromStorage();
  }

  /**
   * Load user from localStorage (if browser)
   */
  private loadUserFromStorage(): void {
    if (!this.isBrowser) return;
    
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const storedUser = JSON.parse(stored) as User;
        this.currentUserSignal.set(storedUser);
      } catch {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    }
  }

  /**
   * Save user to localStorage
   */
  private saveUserToStorage(user: User): void {
    if (!this.isBrowser) return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
  }

  /**
   * Remove user from localStorage
   */
  private removeUserFromStorage(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Logout current user
   */
  logout(): void {
    this.currentUserSignal.set(null);
    this.removeUserFromStorage();
    // Also clear API tokens
    if (this.isBrowser) {
      localStorage.removeItem('lf_token');
      localStorage.removeItem('lf_refresh_token');
      localStorage.removeItem('lf_api_user');
    }
    this.router.navigate(['/']);
  }

  /**
   * Check if user can access protected routes
   */
  canAccess(): boolean {
    return this.isAuthenticated();
  }

  /**
   * Get current user value (non-reactive)
   */
  getCurrentUser(): User | null {
    return this.currentUserSignal();
  }

  /**
   * Set user from API response (after login/register via ApiService)
   * This syncs AuthService state with ApiService
   */
  setUserFromApi(apiUser: { 
    id: string; 
    name: string; 
    email: string; 
    identity_number: string;
    role: string; 
    faculty?: string;
  }): void {
    // Map backend role to frontend role
    const roleMap: Record<string, UserRole> = {
      'MAHASISWA': 'student',
      'STAFF_DOSEN': 'staff',
      'PUBLIK': 'public',
      'ADMIN': 'staff',
      'SECURITY': 'staff'
    };
    
    // Map role to badge
    const badgeMap: Record<string, UserBadge> = {
      'MAHASISWA': 'blue',
      'STAFF_DOSEN': 'gold',
      'PUBLIK': 'gray',
      'ADMIN': 'gold',
      'SECURITY': 'gold'
    };

    const user: User = {
      id: apiUser.id,
      name: apiUser.name,
      email: apiUser.email,
      role: roleMap[apiUser.role] || 'public',
      badge: badgeMap[apiUser.role] || 'gray',
      faculty: apiUser.faculty,
      studentId: apiUser.role === 'MAHASISWA' ? apiUser.identity_number : undefined,
      employeeId: apiUser.role === 'STAFF_DOSEN' ? apiUser.identity_number : undefined,
      avatar: `https://i.pravatar.cc/150?u=${apiUser.email}`
    };

    this.currentUserSignal.set(user);
    this.saveUserToStorage(user);
  }

  /**
   * Update user profile
   */
  updateProfile(updates: Partial<User>): void {
    const current = this.currentUserSignal();
    if (current) {
      const updated = { ...current, ...updates };
      this.currentUserSignal.set(updated);
      this.saveUserToStorage(updated);
    }
  }
}
