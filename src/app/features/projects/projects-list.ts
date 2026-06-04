import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProjectsService } from '../../core/services/projects.service';
import { Project } from '../../core/models/project.model';

@Component({
  selector: 'app-projects-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './projects-list.html',
  styleUrl: './projects-list.scss'
})
export class ProjectsListComponent implements OnInit {
  private projectsService = inject(ProjectsService);
  private router = inject(Router);

  projects = signal<Project[]>([]);
  loading = signal(false);
  currentPage = signal(1);
  hasMore = signal(true);
  searchQuery = signal('');

  ngOnInit(): void {
    this.loadProjects();
  }

  async loadProjects(): Promise<void> {
    this.loading.set(true);
    
    try {
      const response = await this.projectsService.getList({
        page: this.currentPage(),
        limit: 12,
        search: this.searchQuery() || undefined
      }).toPromise();

      if (response) {
        this.projects.set(response.data);
        this.hasMore.set(response.hasMore);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async loadMore(): Promise<void> {
    this.currentPage.set(this.currentPage() + 1);
    const current = this.projects();
    
    this.loading.set(true);
    try {
      const response = await this.projectsService.getList({
        page: this.currentPage(),
        limit: 12,
        search: this.searchQuery() || undefined
      }).toPromise();

      if (response) {
        this.projects.set([...current, ...response.data]);
        this.hasMore.set(response.hasMore);
      }
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.currentPage.set(1);
    this.loadProjects();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  // Navegación
  goToProject(id: string): void {
    this.router.navigate(['/project', id]);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  // Nuevo método para volver al dashboard
  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}