import { Injectable, PLATFORM_ID, Inject, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { User, getBadgeFromEmail } from '../models/user.model';
import { getMockUserByEmail, MOCK_USERS } from '../mocks/user.mock';

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
        const user = JSON.parse(stored) as User;
        this.currentUserSignal.set(user);
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
   * Mock SSO Login
   * Simulates SSO UII login by checking email domain
   */
  login(email: string, password: string): { success: boolean; message: string } {
    // Validate email format
    if (!email || !email.includes('@')) {
      return { success: false, message: 'Email tidak valid' };
    }

    // Check if user exists in mock data
    let user = getMockUserByEmail(email);

    if (user) {
      // User exists, login directly
      this.currentUserSignal.set(user);
      this.saveUserToStorage(user);
      return { success: true, message: 'Login berhasil!' };
    }

    // Create new user based on email domain
    const { role, badge } = getBadgeFromEmail(email);
    const namePart = email.split('@')[0].replace(/[._]/g, ' ');
    const capitalizedName = namePart
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const newUser: User = {
      id: `user_${Date.now()}`,
      name: capitalizedName,
      email: email.toLowerCase(),
      role,
      badge,
      avatar: `https://i.pravatar.cc/150?u=${email}`
    };

    // Add student ID if student
    if (role === 'student') {
      newUser.studentId = `205${Math.floor(10000 + Math.random() * 90000)}`;
      newUser.faculty = 'Fakultas Teknologi Industri';
    }

    // Add employee ID if staff
    if (role === 'staff') {
      newUser.employeeId = `19${Math.floor(100000 + Math.random() * 900000)}`;
    }

    this.currentUserSignal.set(newUser);
    this.saveUserToStorage(newUser);
    
    return { success: true, message: 'Login berhasil!' };
  }

  /**
   * Logout current user
   */
  logout(): void {
    this.currentUserSignal.set(null);
    this.removeUserFromStorage();
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
