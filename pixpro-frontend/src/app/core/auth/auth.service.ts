import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse, UserProfile } from './auth.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly API_URL = environment.apiUrl;
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  currentUser = signal<UserProfile | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromStorage();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, credentials).pipe(
      tap(response => this.handleAuthSuccess(response))
    );
  }

  simulateLogin(credentials: LoginRequest): Observable<LoginResponse> {
    const fakeResponse: LoginResponse = {
      accessToken: 'fake-jwt-token-for-development',
      expiresIn: 3600,
      user: { id: '1', email: credentials.email, name: 'User Demo', role: 'user' }
    };
    return new Observable(observer => {
      setTimeout(() => {
        this.handleAuthSuccess(fakeResponse);
        observer.next(fakeResponse);
        observer.complete();
      }, 800);
    });
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_profile');
    }
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  isAuthenticated(): boolean {
    if (!this.isBrowser) return false;
    return !!localStorage.getItem('access_token');
  }

  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem('access_token');
  }

  private handleAuthSuccess(response: LoginResponse): void {
    if (this.isBrowser) {
      localStorage.setItem('access_token', response.accessToken);
      localStorage.setItem('user_profile', JSON.stringify(response.user));
    }
    this.currentUser.set(response.user);
  }

  private loadUserFromStorage(): void {
    if (!this.isBrowser) return;
    const stored = localStorage.getItem('user_profile');
    if (stored) {
      this.currentUser.set(JSON.parse(stored));
    }
  }
}
