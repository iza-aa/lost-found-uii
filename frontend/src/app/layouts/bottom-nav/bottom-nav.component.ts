import { Component } from '@angular/core';
import { RouterModule } from '@angular/router'; // Wajib
import { CommonModule } from '@angular/common'; // Wajib

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.css'
})
export class BottomNavComponent {}