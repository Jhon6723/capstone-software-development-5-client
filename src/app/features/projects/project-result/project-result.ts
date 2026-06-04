import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ProjectImage } from '../../../core/models/project.model';
import { ProjectsService } from '../../../core/services/projects.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar';

export interface GeneratedImage {
  id: string;
  url: string;
  thumbnail: string;
  width: number;
  height: number;
  format: string;
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
  private projectsService = inject(ProjectsService);

  // Estado reactivo
  project = signal<ProjectResult | null>(null);
  loading = signal(true);
  selectedImage = signal<GeneratedImage | null>(null);
  isDownloading = signal(false);

  ngOnInit(): void {
    const projectId = this.route.snapshot.paramMap.get('id');
    this.loadProject(projectId || 'mock');
  }

  async loadProject(id: string): Promise<void> {
    this.loading.set(true);
    
    try {
      const [project, imageResponse] = await Promise.all([
        firstValueFrom(this.projectsService.getById(id)),
        firstValueFrom(this.projectsService.getProjectImages(id, { page: 1, limit: 100 })),
      ]);

      if (!project) {
        this.project.set(null);
        return;
      }

      const actionParam = this.route.snapshot.queryParamMap.get('action');
      const action = actionParam === 'upload' || actionParam === 'prompt' || actionParam === 'effects'
        ? actionParam
        : 'effects';
      const prompt = this.route.snapshot.queryParamMap.get('prompt')?.trim() || undefined;
      const effect = this.route.snapshot.queryParamMap.get('effect')?.trim() || undefined;

      const processedImages = imageResponse.data.filter(image => image.status.toLowerCase() === 'processed');
      const visibleImages = (processedImages.length > 0 ? processedImages : imageResponse.data)
        .map(image => this.mapGeneratedImage(image, effect));

      this.project.set({
        id: project.id,
        name: project.name,
        model: project.model,
        createdAt: project.createdAt || project.date,
        action,
        images: visibleImages,
        metadata: {
          prompt,
          effect,
        },
      });
    } catch (error) {
      console.error('Error loading project result:', error);
      this.project.set(null);
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
      const response = await fetch(image.url);
      const blob = await response.blob();
      this.triggerDownload(blob, `pixpro-${image.id}.${image.format || 'png'}`);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      this.isDownloading.set(false);
    }
  }

  async downloadAll(): Promise<void> {
    this.isDownloading.set(true);
    
    try {
      const images = this.project()?.images ?? [];
      for (const image of images) {
        const response = await fetch(image.url);
        const blob = await response.blob();
        this.triggerDownload(blob, `pixpro-${image.id}.${image.format || 'png'}`);
      }
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

  private mapGeneratedImage(image: ProjectImage, effect?: string): GeneratedImage {
    return {
      id: image.id,
      url: image.secureUrl,
      thumbnail: image.secureUrl,
      width: image.width,
      height: image.height,
      format: image.format,
      size: image.sizeInBytes / (1024 * 1024),
      effect,
    };
  }

  private triggerDownload(blob: Blob, fileName: string): void {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }
}