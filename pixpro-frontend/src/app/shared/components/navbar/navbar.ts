import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent {

  private authService = inject(AuthService);

  currentUser = this.authService.currentUser;

  get userInitial(): string {
    const name = this.currentUser()?.name;
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  }

  logout(): void {
    this.authService.logout();
  }
}
