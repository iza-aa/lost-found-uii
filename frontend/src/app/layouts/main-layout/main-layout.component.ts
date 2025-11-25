import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// Import ke-3 komponen anak
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';
import { ThemeToggleComponent } from '../../shared/components';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet, 
    NavbarComponent, 
    FooterComponent, 
    BottomNavComponent,
    ThemeToggleComponent
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {}