import { Injectable, signal } from '@angular/core';
import { ActionId } from '../models/project.model';
import { ProcessingFeature, ProcessingParameters } from '../models/upload-image.request';

export interface UploadContext {
  images: File[];
  action?: ActionId;
  prompt?: string;
  effect?: string;
  feature?: ProcessingFeature;
  parameters?: ProcessingParameters;
  projectId?: string;
  projectName?: string;
  projectDescription?: string;
  expectedResultCount?: number;
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