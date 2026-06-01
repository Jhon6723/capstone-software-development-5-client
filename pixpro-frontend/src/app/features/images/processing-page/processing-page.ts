import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-processing-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './processing-page.html',
  styleUrl: './processing-page.scss'
})
export class ProcessingPageComponent implements OnInit, OnDestroy {
  private router = inject(Router);

  // Estado reactivo
  status = signal<'uploading' | 'processing' | 'optimizing' | 'complete' | 'error'>('uploading');
  progress = signal(0);
  message = signal('Preparando entorno...');
  isConnected = signal(true);
  imageCount = signal(1);
  uploadState = new Map<string, { fileName: string; progress: number; status: 'pending' | 'uploading' | 'done' | 'error' }>();

  // Simulación temporal (eliminar al integrar WebSockets reales)
  private simTimeout: ReturnType<typeof setTimeout> | undefined;

  ngOnInit(): void {
    // TODO: Reemplazar con this.initWebSocket();
    this.startSimulation();
  }

  ngOnDestroy(): void {
    if (this.simTimeout) clearTimeout(this.simTimeout);
    // TODO: this.wsService?.disconnect();
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
    this.router.navigate(['/projects']);
  }

  private startSimulation(): void {
    const count = this.imageCount() || 1;
    const steps = [
        { status: 'uploading', message: `Subiendo ${count} imagen(es)...`, duration: 1200 },
        { status: 'processing', message: 'Analizando con modelo de IA...', duration: 2500 },
        { status: 'optimizing', message: 'Aplicando efectos y ajustes...', duration: 1800 },
        { status: 'complete', message: '¡Generación completada!', duration: 1000 }
    ];

    let idx = 0;
    const runStep = () => {
        if (idx < steps.length) {
        const step = steps[idx];
        this.status.set(step.status as 'uploading' | 'processing' | 'optimizing' | 'complete');
        this.message.set(step.message);
        this.progress.set(Math.min(100, ((idx + 1) / steps.length) * 100));
        idx++;
        this.simTimeout = setTimeout(runStep, step.duration);
        } else {
        this.uploadState.clear(); // Limpiar mock state
        
        // Generar ID temporal para el proyecto (en backend real vendría de la respuesta)
        const projectId = 'proj_' + Date.now();
        
        setTimeout(() => {
            this.router.navigate(['/project-result', projectId]);
        }, 1200);
        }
    };
    runStep();
 }

  // Placeholder para WebSockets reales
  /*
  private initWebSocket(): void {
    const wsUrl = `ws://backend.com/ws/projects/${projectId}`;
    this.wsService.connect(wsUrl).pipe(
      finalize(() => this.isConnected.set(false))
    ).subscribe({
      next: (data) => {
        this.status.set(data.status);
        this.progress.set(data.progress);
        this.message.set(data.message);
        if (data.status === 'complete') {
          setTimeout(() => this.router.navigate(['/project', data.projectId]), 1000);
        }
      },
      error: (err) => {
        this.status.set('error');
        this.message.set('No se pudo conectar con el servidor. Reintentando...');
      }
    });
  }
  */
}