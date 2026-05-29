import { Injectable, signal } from '@angular/core';

export interface UploadContext {
  images: File[];
  action?: 'upload' | 'prompt' | 'effects';
  prompt?: string;
  effect?: string;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class UploadStateService {
  context = signal<UploadContext | null>(null);

  setContext(data: Omit<UploadContext, 'timestamp'>): void {
    this.context.set({ ...data, timestamp: Date.now() });
  }

  getContext(): UploadContext | null {
    return this.context();
  }

  clear(): void {
    this.context.set(null);
  }
}