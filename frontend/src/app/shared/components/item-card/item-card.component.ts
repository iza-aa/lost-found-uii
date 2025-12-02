import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Item } from '../../../core/models';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { UserBadgeComponent } from '../user-badge/user-badge.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-item-card',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent, UserBadgeComponent],
  templateUrl: './item-card.component.html',
  styleUrl: './item-card.component.css'
})
export class ItemCardComponent {
  @Input() item!: Item;
  
  private authService = inject(AuthService);
  private router = inject(Router);

  /**
   * Handle card click - check auth before navigating
   */
  onCardClick(): void {
    // Determine route based on item status
    const route = this.item.status === 'found' ? '/found' : '/item';
    const fullPath = `${route}/${this.item.id}`;
    
    if (this.authService.isAuthenticated()) {
      // Navigate to item detail
      this.router.navigate([route, this.item.id]);
    } else {
      // Redirect to login with return URL
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: fullPath }
      });
    }
  }

  /**
   * Get location display string
   */
  getLocationDisplay(): string {
    if (!this.item.location) {
      return 'Lokasi tidak diketahui';
    }
    if (typeof this.item.location === 'string') {
      return this.item.location;
    }
    return this.item.location.name || 'Lokasi tidak diketahui';
  }
}
