import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, UserProfile, UserResponse } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly auth0 = inject(Auth0Service);
  private readonly API_URL = environment.apiUrl;

  currentUser = signal<UserProfile | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    this.loadUserFromStorage();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.API_URL}/auth/login`, credentials)
      .pipe(tap(response => this.handleAuthSuccess(response)));
  }

  register(userData: { email: string; password: string }): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.API_URL}/auth/register`, userData);
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
      document.cookie = `access_token=${response.token}; path=/; SameSite=Strict`;
      const userProfile: UserProfile = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.email.split('@')[0],
        role: 'user'
      };
      document.cookie = `user_profile=${JSON.stringify(userProfile)}; path=/; SameSite=Strict`;
      this.currentUser.set(userProfile);
    }
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
