import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private config: Record<string, any> = {};
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor(private http: HttpClient) {}

  load(): Promise<void> {
    if (this.isBrowser && (window as any).__pixpro_config__) {
      this.config = (window as any).__pixpro_config__;
      return Promise.resolve();
    }

    if (!this.isBrowser) {
      return Promise.resolve();
    }

    return firstValueFrom(this.http.get('/assets/config.json'))
      .then((config: any) => {
        this.config = config;
        (window as any).__pixpro_config__ = config;
      })
      .catch(err => {
        console.error('Cannot loading config.json:', err);
      });
  }

  get(key: string): string {
    return key.split('.').reduce((obj: any, k) => obj?.[k], this.config) ?? '';
  }
}
