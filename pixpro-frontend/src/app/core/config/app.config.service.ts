import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AppConfig } from '../interfaces/app-config.interface';

type WindowWithConfig = Window & { __pixpro_config__?: AppConfig };

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private config: AppConfig | null = null;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor(private http: HttpClient) {}

  load(): Promise<void> {
    if (this.isBrowser && (window as WindowWithConfig).__pixpro_config__) {
      this.config = (window as WindowWithConfig).__pixpro_config__ ?? null;
      return Promise.resolve();
    }

    if (!this.isBrowser) {
      return Promise.resolve();
    }

    return firstValueFrom(this.http.get<AppConfig>('/assets/config.json'))
      .then((config: AppConfig) => {
        this.config = config;
        (window as WindowWithConfig).__pixpro_config__ = config;
      })
      .catch(err => {
        console.error('Could not load config.json:', err);
      });
  }

  get(key: string): string {
    if (!this.config) return '';
    if (key === 'apiUrl') return this.config.apiUrl;
    if (key === 'auth0.domain') return this.config.auth0.domain;
    if (key === 'auth0.clientId') return this.config.auth0.clientId;
    if (key === 'auth0.audience') return this.config.auth0.audience;
    if (key === 'auth0.redirectUri') return this.config.auth0.redirectUri;
    return '';
  }
}
