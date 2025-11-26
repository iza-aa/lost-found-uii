import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Auth Guard untuk protect routes
 * Redirect ke /login jika belum authenticated
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Store intended URL untuk redirect setelah login
  const returnUrl = state.url;
  
  // Redirect ke login dengan return URL
  router.navigate(['/login'], { 
    queryParams: { returnUrl } 
  });
  
  return false;
};

/**
 * Guest Guard - hanya untuk user yang belum login
 * Berguna untuk halaman login (jika sudah login, redirect ke home)
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  // Sudah login, redirect ke home
  router.navigate(['/']);
  return false;
};
