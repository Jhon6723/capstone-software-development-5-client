import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private config: Record<string, string> = {};
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor(private http: HttpClient) {}

  async load(): Promise<void> {
    if (!this.isBrowser) return;
    try {
      //const data = await firstValueFrom(this.http.get<Record<string, string>>('/assets/config.json'));
      //this.config = data;
    } catch (error) {
      console.error('Error loading config.json', error);
      this.config = {};
    }
  }

  get(key: string): string {
    return this.config[key] ?? '';
  }
}
