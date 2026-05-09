import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { LoginRequest, LoginResponse, UserProfile } from './auth.models';
import { AppConfigService } from '../config/app.config.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly auth0 = inject(Auth0Service);

  currentUser = signal<UserProfile | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router,
    private config: AppConfigService,
  ) {
    this.loadUserFromStorage();
  }

  private get API_URL(): string {
    return this.config.get('apiUrl');
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.API_URL}/auth/login`, credentials)
      .pipe(tap(response => this.handleAuthSuccess(response)));
  }

  simulateLogin(credentials: LoginRequest): Observable<LoginResponse> {
    const fakeResponse: LoginResponse = {
      accessToken: 'fake-jwt-token-for-development',
      expiresIn: 3600,
      user: { id: '1', email: credentials.email, name: 'User Demo', role: 'user' },
    };
    return new Observable(observer => {
      setTimeout(() => {
        this.handleAuthSuccess(fakeResponse);
        observer.next(fakeResponse);
        observer.complete();
      }, 800);
    });
  }

  loginWithGoogle(): void {
    this.auth0.loginWithRedirect({
      authorizationParams: { connection: 'google-oauth2' },
    });
  }

  loginWithMicrosoft(): void {
    this.auth0.loginWithRedirect({
      authorizationParams: { connection: 'windowslive' },
    });
  }

  handleAuth0Success(token: string, user: UserProfile): void {
    if (this.isBrowser) {
      document.cookie = `access_token=${token}; path=/; SameSite=Strict`;
      document.cookie = `user_profile=${JSON.stringify(user)}; path=/; SameSite=Strict`;
    }
    this.currentUser.set(user);
  }

  logout(): void {
    if (this.isBrowser) {
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'user_profile=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    this.currentUser.set(null);
    this.auth0.logout({
      logoutParams: { returnTo: window.location.origin + '/auth/login' },
    });
  }

  isAuthenticated(): boolean {
    if (!this.isBrowser) return false;
    return this.getCookie('access_token') !== null;
  }

  getToken(): string | null {
    if (!this.isBrowser) return null;
    return this.getCookie('access_token');
  }

  private handleAuthSuccess(response: LoginResponse): void {
    if (this.isBrowser) {
      document.cookie = `access_token=${response.accessToken}; path=/; SameSite=Strict`;
      document.cookie = `user_profile=${JSON.stringify(response.user)}; path=/; SameSite=Strict`;
    }
    this.currentUser.set(response.user);
  }

  private loadUserFromStorage(): void {
    if (!this.isBrowser) return;
    const stored = this.getCookie('user_profile');
    if (stored) {
      this.currentUser.set(JSON.parse(stored));
    }
  }

  private getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }
}
