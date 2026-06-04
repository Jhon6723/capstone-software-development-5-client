import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';
import { ProjectsService } from '../../../core/services/projects.service';
import { UploadContext, UploadStateService } from '../../../core/services/upload-state.service';
import { WsProcessingEvent, WsProcessingService } from '../../../core/services/ws-processing.service';

@Component({
  selector: 'app-processing-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './processing-page.html',
  styleUrl: './processing-page.scss'
})
export class ProcessingPageComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private projectsService = inject(ProjectsService);
  private uploadStateService = inject(UploadStateService);
  private wsProcessingService = inject(WsProcessingService);

  // Estado reactivo
  status = signal<'uploading' | 'processing' | 'optimizing' | 'complete' | 'error'>('uploading');
  progress = signal(0);
  message = signal('Preparando entorno...');
  isConnected = signal(true);
  imageCount = signal(1);
  uploadState = new Map<string, { fileName: string; progress: number; status: 'pending' | 'uploading' | 'done' | 'error' }>();
  currentProjectId = signal<string | null>(null);

  private simTimeout: ReturnType<typeof setTimeout> | undefined;
  private wsSubscription: Subscription | undefined;
  private readonly maxPollAttempts = 40;
  private readonly debugEnabled = true;

  ngOnInit(): void {
    const context = this.uploadStateService.getContext();

    if (!context) {
      this.status.set('error');
      this.isConnected.set(false);
      this.message.set('No hay una solicitud de procesamiento activa.');
      return;
    }

    this.imageCount.set(Math.max(context.images.length, context.expectedResultCount ?? 1));
    void this.startProcessing(context);
  }

  ngOnDestroy(): void {
    if (this.simTimeout) clearTimeout(this.simTimeout);
    this.wsSubscription?.unsubscribe();
    this.wsProcessingService.disconnect();
  }

  // Lógica de estados
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      uploading: 'Subiendo archivos',
      processing: 'Procesando con IA',
      optimizing: 'Optimizando resultados',
      complete: '¡Generación completada!',
      error: 'Error en el proceso'
    };
    return labels[status] || 'Iniciando...';
  }

  isStepActive(step: string): boolean {
    const order = ['uploading', 'processing', 'optimizing', 'complete'];
    const current = order.indexOf(this.status());
    return current >= order.indexOf(step);
  }

  // Navegación
  goBack(): void {
    // Si el backend permite cancelar, llamar aquí: this.wsService.cancel();
    this.router.navigate(['/dashboard']);
  }

  goToProjects(): void {
    const projectId = this.currentProjectId();
    if (projectId) {
      this.router.navigate(['/project-result', projectId]);
      return;
    }

    this.router.navigate(['/projects']);
  }

  private async startProcessing(context: UploadContext): Promise<void> {
    try {
      this.status.set('uploading');
      this.progress.set(10);
      this.message.set('Creando proyecto...');

      const project = await firstValueFrom(this.projectsService.createProject({
        name: context.projectName || this.buildFallbackProjectName(context),
        description: context.projectDescription,
      }));

      this.currentProjectId.set(project.id);
      this.progress.set(20);
      this.message.set('Enviando solicitud al backend...');

      const filesToUpload = context.images.length > 0 ? context.images : [undefined];

      for (const [index, file] of filesToUpload.entries()) {
        await firstValueFrom(this.projectsService.uploadImage(project.id, {
          file,
          prompt: context.prompt ?? '',
          feature: context.feature,
          parameters: context.parameters,
        }));

        const uploadProgress = Math.round(((index + 1) / filesToUpload.length) * 40);
        this.progress.set(20 + uploadProgress);
        this.message.set(`Solicitud ${index + 1} de ${filesToUpload.length} enviada.`);
      }

      this.status.set('processing');
      this.progress.set(65);
      this.message.set('Esperando resultados del procesamiento...');

      await this.waitForProcessedImages(project.id, context);

      this.status.set('complete');
      this.progress.set(100);
      this.message.set('¡Generación completada!');

      this.simTimeout = setTimeout(() => {
        this.router.navigate(['/project-result', project.id], {
          queryParams: {
            action: context.action,
            prompt: context.prompt,
            effect: context.effect,
          },
        });
      }, 1200);
    } catch (error) {
      console.error('Processing error:', error);
      this.status.set('error');
      this.isConnected.set(false);
      this.message.set('No se pudo completar el procesamiento. Revisa tu sesión o vuelve a intentar.');
    }
  }

  private async waitForProcessedImages(projectId: string, context: UploadContext): Promise<void> {
    const expectedResults = Math.max(
      context.expectedResultCount ?? context.parameters?.quantity ?? (context.images.length || 1),
      1,
    );

    await new Promise<void>((resolve, reject) => {
      const timeoutMs = this.maxPollAttempts * 3000;
      const completedImageIds = new Set<string>();
      this.debug('waiting websocket events', { projectId, expectedResults, timeoutMs });

      const timeoutId = setTimeout(() => {
        this.debug('websocket wait timeout reached', { projectId, expectedResults, received: completedImageIds.size });
        this.wsSubscription?.unsubscribe();
        this.wsSubscription = undefined;
        this.wsProcessingService.disconnect();
        reject(new Error('Timed out waiting for processed images via WebSocket.'));
      }, timeoutMs);

      this.wsSubscription = this.wsProcessingService.connect().subscribe({
        next: event => {
          this.debug('event received', event);

          if (event.type === 'pong' || event.type === 'unknown') {
            this.debug('event ignored by type', { type: event.type });
            return;
          }

          if (event.projectId && event.projectId !== projectId) {
            this.debug('event ignored by projectId mismatch', { expected: projectId, actual: event.projectId });
            return;
          }

          if (event.type === 'IMAGE_PROCESSING_FAILED') {
            this.debug('processing failed event', event);
            clearTimeout(timeoutId);
            this.wsSubscription?.unsubscribe();
            this.wsSubscription = undefined;
            this.wsProcessingService.disconnect();
            reject(new Error(event.errorMessage ?? 'Image processing failed.'));
            return;
          }

          if (event.type === 'IMAGE_PROCESSING_COMPLETED') {
            this.applyProcessingProgress(event, completedImageIds);
            this.debug('progress updated', { completed: completedImageIds.size, expectedResults });

            if (completedImageIds.size >= expectedResults) {
              this.debug('processing completed by websocket events', { completed: completedImageIds.size, expectedResults });
              clearTimeout(timeoutId);
              this.wsSubscription?.unsubscribe();
              this.wsSubscription = undefined;
              this.wsProcessingService.disconnect();
              resolve();
            }
          }
        },
        error: err => {
          this.debug('websocket subscription error', err);
          clearTimeout(timeoutId);
          this.wsSubscription = undefined;
          this.wsProcessingService.disconnect();
          reject(err);
        },
      });
    });
  }

  private applyProcessingProgress(event: WsProcessingEvent, completedImageIds: Set<string>): void {
    if (event.imageId) {
      completedImageIds.add(event.imageId);
    }

    this.status.set('optimizing');
    const progressBoost = Math.min(30, completedImageIds.size * 10);
    this.progress.set(70 + progressBoost);
    this.message.set(`Recibiendo ${completedImageIds.size} resultado(s) del backend...`);
  }

  private buildFallbackProjectName(context: UploadContext): string {
    if (context.projectName) {
      return context.projectName;
    }

    if (context.action === 'prompt') {
      return 'Proyecto generado desde prompt';
    }

    if (context.action === 'effects') {
      return `Efecto ${context.effect ?? 'artístico'}`;
    }

    return 'Mejora de imagen';
  }

  private debug(message: string, payload?: unknown): void {
    if (!this.debugEnabled) {
      return;
    }

    if (payload === undefined) {
      console.debug('[ProcessingPage]', message);
      return;
    }

    console.debug('[ProcessingPage]', message, payload);
  }
}