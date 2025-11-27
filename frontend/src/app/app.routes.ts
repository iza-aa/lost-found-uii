import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { NotificationComponent } from './features/notification/notification.component';
import { PostItemComponent } from './features/post-item/post-item.component';
import { RadarComponent } from './features/radar/radar.component';
import { ProfileComponent } from './features/profile/profile.component';
import { authGuard, guestGuard } from './core/guards';

export const routes: Routes = [
  // Public routes
  { path: '', component: HomeComponent },
  
  // Public profile (untuk QR scan) - tanpa navbar/bottom-nav
  { 
    path: 'u/:userId', 
    loadComponent: () => import('./features/public-profile/public-profile.component').then(m => m.PublicProfileComponent)
  },
  
  // Auth routes (hanya untuk guest)
  { 
    path: 'login', 
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard]
  },
  { 
    path: 'register', 
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
    canActivate: [guestGuard]
  },
  
  // Protected routes (harus login)
  { path: 'notification', component: NotificationComponent, canActivate: [authGuard] },
  { path: 'post-item', component: PostItemComponent, canActivate: [authGuard] },
  { path: 'radar', component: RadarComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  
  // Item detail (protected)
  { 
    path: 'item/:id', 
    loadComponent: () => import('./features/item-detail/item-detail.component').then(m => m.ItemDetailComponent),
    canActivate: [authGuard]
  },
  
  // Wildcard - redirect ke home
  { path: '**', redirectTo: '' }
];
