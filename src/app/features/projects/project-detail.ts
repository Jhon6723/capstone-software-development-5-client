import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Project, ProjectImage } from '../../core/models/project.model';
import { ProjectsService } from '../../core/services/projects.service';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.scss'
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectsService = inject(ProjectsService);

  project = signal<Project | null>(null);
  images = signal<ProjectImage[]>([]);
  loading = signal(true);
  selectedImage = signal<ProjectImage | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProject(id);
    }
  }

  async loadProject(id: string): Promise<void> {
    this.loading.set(true);
    this.selectedImage.set(null);
    try {
      const project = await firstValueFrom(this.projectsService.getById(id));
      this.project.set(project ?? null);

      if (project) {
        const imagesResponse = await firstValueFrom(this.projectsService.getProjectImages(id, { page: 1, limit: 100 }));
        const processedImages = imagesResponse.data.filter(image => image.status.toLowerCase() === 'processed');
        this.images.set(processedImages.length > 0 ? processedImages : imagesResponse.data);
      }
    } catch (error) {
      console.error('Error loading project:', error);
      this.project.set(null);
      this.images.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }

  formatSize(bytes: number): string {
    const megaBytes = bytes / (1024 * 1024);
    return `${megaBytes.toFixed(1)} MB`;
  }

  selectImage(image: ProjectImage | null): void {
    this.selectedImage.set(image);
  }

  isImageSelected(imageId: string): boolean {
    return this.selectedImage()?.id === imageId;
  }

  async downloadImage(image: ProjectImage): Promise<void> {
    try {
      const response = await fetch(image.secureUrl);
      const blob = await response.blob();
      const extension = image.format || 'png';
      this.triggerDownload(blob, `pixpro-${image.id}.${extension}`);
    } catch (error) {
      console.error('Download error:', error);
    }
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