import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CreditsCardComponent } from '../credits-card/credits-card';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, CreditsCardComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class NavbarComponent {
  private authService = inject(AuthService);

  currentUser = this.authService.currentUser;
  showCredits = false;

  get userInitial(): string {
    const name = this.currentUser()?.name;
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  }

  logout(): void {
    this.authService.logout();
  }
}
