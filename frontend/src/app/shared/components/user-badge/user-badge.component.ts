import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserBadge, BADGE_CONFIG } from '../../../core/models/user.model';

@Component({
  selector: 'app-user-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span 
      [class]="getClasses()"
      [title]="getTitle()">
      <i [class]="config.icon"></i>
      @if (showLabel) {
        <span>{{ config.label }}</span>
      }
    </span>
  `
})
export class UserBadgeComponent {
  @Input() badge: UserBadge = 'gray';
  @Input() size: 'sm' | 'md' | 'lg' = 'sm';
  @Input() showLabel = true;

  get config() {
    return BADGE_CONFIG[this.badge];
  }

  getClasses(): string {
    const sizeClasses = {
      sm: 'text-xs px-2 py-0.5 gap-1',
      md: 'text-sm px-2.5 py-1 gap-1.5',
      lg: 'text-base px-3 py-1.5 gap-2'
    };

    return `inline-flex items-center rounded-full font-medium ${sizeClasses[this.size]} ${this.config.bgColor} ${this.config.color}`;
  }

  getTitle(): string {
    const titles = {
      gold: 'Akun terverifikasi sebagai Staff UII',
      blue: 'Akun terverifikasi sebagai Mahasiswa UII',
      gray: 'Akun umum'
    };
    return titles[this.badge];
  }
}
