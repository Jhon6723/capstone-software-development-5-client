import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  templateUrl: './auth-callback.html',
  styleUrl: './auth-callback.scss',
})
export class AuthCallbackComponent implements OnInit {
  private auth0 = inject(Auth0Service);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.auth0.isAuthenticated$
      .pipe(
        filter(isAuthenticated => isAuthenticated === true),
        take(1),
        switchMap(() => this.auth0.getAccessTokenSilently()),
        switchMap(token =>
          this.auth0.user$.pipe(
            filter(user => !!user),
            take(1),
            switchMap(user => {
              this.authService.handleAuth0Success(token, {
                id: user!.sub ?? '',
                email: user!.email ?? '',
                name: user!.name ?? '',
                role: 'user',
              });
              return [token];
            }),
          ),
        ),
      )
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: err => {
          console.error('Error in callback Auth0:', err);
          this.router.navigate(['/auth/login']);
        },
      });
  }
}
