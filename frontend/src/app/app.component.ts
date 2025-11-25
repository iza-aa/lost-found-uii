import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// Import layout kita
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

@Component({
  selector: 'app-root',
  standalone: true,
  // Masukkan MainLayoutComponent ke dalam sini:
  imports: [RouterOutlet, MainLayoutComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontend';
}