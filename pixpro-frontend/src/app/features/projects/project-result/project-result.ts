import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar';

export interface GeneratedImage {
  id: string;
  url: string;
  thumbnail: string;
  width: number;
  height: number;
  format: 'png' | 'jpg';
  size: number;
  prompt?: string;
  effect?: string;
}

export interface ProjectResult {
  id: string;
  name: string;
  model: string;
  createdAt: string;
  action: 'upload' | 'prompt' | 'effects';
  images: GeneratedImage[];
  metadata?: {
    prompt?: string;
    effect?: string;
    processingTime?: number;
  };
}

@Component({
  selector: 'app-project-result',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './project-result.html',
  styleUrl: './project-result.scss'
})
export class ProjectResultComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Estado reactivo
  project = signal<ProjectResult | null>(null);
  loading = signal(true);
  selectedImage = signal<GeneratedImage | null>(null);
  isDownloading = signal(false);

  // Mock data (reemplazar con llamada al backend)
  private readonly mockProject: ProjectResult = {
    id: 'proj_' + Date.now(),
    name: 'Proyecto generado',
    model: 'PixPro AI v2.1',
    createdAt: new Date().toISOString(),
    action: 'effects',
    images: [
      {
        id: 'img_1',
        url: 'https://picsum.photos/seed/result1/1024/1024',
        thumbnail: 'https://picsum.photos/seed/result1/400/400',
        width: 1024, height: 1024, format: 'png', size: 2.4,
        effect: 'ghibli'
      },
      {
        id: 'img_2',
        url: 'https://picsum.photos/seed/result2/1024/1024',
        thumbnail: 'https://picsum.photos/seed/result2/400/400',
        width: 1024, height: 1024, format: 'png', size: 2.1,
        effect: 'ghibli'
      },
      {
        id: 'img_3',
        url: 'https://picsum.photos/seed/result3/1024/1024',
        thumbnail: 'https://picsum.photos/seed/result3/400/400',
        width: 1024, height: 1024, format: 'png', size: 2.8,
        effect: 'ghibli'
      },
      {
        id: 'img_4',
        url: 'https://picsum.photos/seed/result4/1024/1024',
        thumbnail: 'https://picsum.photos/seed/result4/400/400',
        width: 1024, height: 1024, format: 'png', size: 2.3,
        effect: 'ghibli'
      }
    ],
    metadata: {
      effect: 'ghibli',
      prompt: 'Paisaje mágico estilo Studio Ghibli',
      processingTime: 8.4
    }
  };

  ngOnInit(): void {
    // Leer parámetros de ruta (projectId o contexto del processing)
    const projectId = this.route.snapshot.paramMap.get('id');
    this.loadProject(projectId || 'mock');
  }

  async loadProject(id: string): Promise<void> {
    this.loading.set(true);
    
    try {
      // MODO MOCK: Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // En producción: reemplazar con llamada real
      // const data = await this.projectsService.getResult(id).toPromise();
      
      this.project.set(this.mockProject);
    } catch (error) {
      console.error('Error loading project result:', error);
    } finally {
      this.loading.set(false);
    }
  }

  // Formateo de fechas y tamaños
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  formatSize(mb: number): string {
    return `${mb.toFixed(1)} MB`;
  }

  // Acciones de imagen
  selectImage(image: GeneratedImage | null): void {
    this.selectedImage.set(image);
  }

  async downloadImage(image: GeneratedImage): Promise<void> {
    this.isDownloading.set(true);
    
    try {
      // MODO MOCK: Simular descarga
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // En producción: fetch real del blob
      // const response = await fetch(image.url);
      // const blob = await response.blob();
      // triggerDownload(blob, `pixpro-${image.id}.${image.format}`);
      
      // Feedback visual
      alert(`✅ Imagen descargada: ${image.id}`);
    } catch (error) {
      console.error('Download error:', error);
      alert('❌ Error al descargar. Intenta de nuevo.');
    } finally {
      this.isDownloading.set(false);
    }
  }

  async downloadAll(): Promise<void> {
    this.isDownloading.set(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(`✅ ${this.project()?.images.length} imágenes descargadas como ZIP`);
    } finally {
      this.isDownloading.set(false);
    }
  }

  // Compartir proyecto
  async shareProject(): Promise<void> {
    const project = this.project();
    if (!project) return;

    const shareData = {
      title: `Proyecto PixPro: ${project.name}`,
      text: `Mira mi proyecto generado con IA: ${project.metadata?.prompt || project.name}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copiar al portapapeles
        await navigator.clipboard.writeText(shareData.url);
        alert('🔗 Enlace copiado al portapapeles');
      }
    } catch (err) {
      console.log('Share cancelled or failed:', err);
    }
  }

  // Navegación
  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  goToProjects(): void {
    this.router.navigate(['/projects']);
  }

  createNew(): void {
    this.router.navigate(['/upload']);
  }

  // Helpers de UI
  getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      upload: 'Mejora de imágenes',
      prompt: 'Generado desde prompt',
      effects: 'Efecto artístico aplicado'
    };
    return labels[action] || 'Proyecto';
  }

  isImageSelected(imageId: string): boolean {
    return this.selectedImage()?.id === imageId;
  }
}