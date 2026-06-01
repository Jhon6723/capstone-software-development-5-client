import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, delay, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Project, ProjectListResponse } from '../models/project.model';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private http = inject(HttpClient);
  
  private get apiUrl(): string {
    return `${environment.apiUrl}/projects`;
  }
  
  // Toggle para mocks
  private get useMocks(): boolean {
    return true;
  }

  // Obtener lista con paginación
  getList(params?: { page?: number; limit?: number; search?: string }): Observable<ProjectListResponse> {
    if (this.useMocks) {
      return of(this.getMockResponse(params)).pipe(delay(400));
    }

    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit);
    if (params?.search) httpParams = httpParams.set('search', params.search);

    return this.http.get<ProjectListResponse>(this.apiUrl, { params: httpParams });
  }

  // Obtener proyecto por ID
  getById(id: string): Observable<Project | null> {
    if (this.useMocks) {
      const project = this.mockProjects.find(p => p.id === id) || null;
      return of(project).pipe(delay(300));
    }

    return this.http.get<Project>(`${this.apiUrl}/${id}`).pipe(
      map(project => project || null)
    );
  }

  // Mock data
  private getMockResponse(params?: { page?: number; limit?: number; search?: string }): ProjectListResponse {
    const page = params?.page || 1;
    const limit = params?.limit || 12;
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      data: this.mockProjects.slice(start, end),
      total: this.mockProjects.length,
      page,
      pageSize: limit,
      hasMore: end < this.mockProjects.length
    };
  }

  private readonly mockProjects: Project[] = [
    {
      id: '1', name: 'Paisajes Ghibli', model: 'Ghibli v2.1',
      imageCount: 12, date: '2024-05-20T10:30:00Z',
      colors: ['#059669','#34d399','#10b981','#064e3b'],
      createdAt: '2024-05-20T10:30:00Z',
      metadata: { prompt: 'bosque mágico estilo ghibli', effect: 'ghibli' }
    },
    {
      id: '2', name: 'Retratos Anime', model: 'Anime XL',
      imageCount: 8, date: '2024-05-17T14:20:00Z',
      colors: ['#db2777','#c026d3','#a855f7','#701a75'],
      createdAt: '2024-05-17T14:20:00Z',
      metadata: { effect: 'anime' }
    },
    {
      id: '3', name: 'Ciudad Cyberpunk', model: 'CyberDiffusion',
      imageCount: 6, date: '2024-05-13T09:15:00Z',
      colors: ['#2563eb','#0891b2','#7c3aed','#1e1b4b'],
      createdAt: '2024-05-13T09:15:00Z',
      metadata: { prompt: 'ciudad futurista noche lluvia', effect: 'cyberpunk' }
    },
    {
      id: '4', name: 'Concept Art Sci-Fi', model: 'Diffusion Pro',
      imageCount: 15, date: '2024-05-10T16:45:00Z',
      colors: ['#0ea5e9','#6366f1','#1e293b','#0f172a'],
      createdAt: '2024-05-10T16:45:00Z',
      metadata: { effect: 'custom' }
    },
    {
      id: '5', name: 'Fotografía Macro', model: 'Enhance AI',
      imageCount: 20, date: '2024-05-05T11:20:00Z',
      colors: ['#f59e0b','#ef4444','#78716c','#44403c'],
      createdAt: '2024-05-05T11:20:00Z',
      metadata: { prompt: 'primer plano de flor con gotas de rocío' }
    },
    {
      id: '6', name: 'Texturas Abstractas', model: 'Style Transfer',
      imageCount: 10, date: '2024-04-28T09:00:00Z',
      colors: ['#8b5cf6','#ec4899','#334155','#1e293b'],
      createdAt: '2024-04-28T09:00:00Z',
      metadata: { effect: 'custom' }
    }
  ];
}