import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BackendProjectListResponse,
  BackendProjectResponse,
  CreateProjectRequest,
  ImageListResponse,
  ImageUploadResponse,
  Project,
  ProjectListResponse,
} from '../models/project.model';
import { UploadImageRequest, createUploadFormData } from '../models/upload-image.request';
import { CreditsService } from './credits.service';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private http = inject(HttpClient);
  private creditsService = inject(CreditsService);
  private readonly projectPalettes: string[][] = [
    ['#0f766e', '#14b8a6', '#5eead4', '#042f2e'],
    ['#7c3aed', '#a855f7', '#ec4899', '#3b0764'],
    ['#2563eb', '#06b6d4', '#7c3aed', '#172554'],
    ['#ea580c', '#f59e0b', '#ef4444', '#7c2d12'],
    ['#16a34a', '#84cc16', '#22c55e', '#14532d'],
    ['#334155', '#64748b', '#0f172a', '#1e293b'],
  ];

  private get apiUrl(): string {
    return `${environment.apiUrl}/projects`;
  }

  private get imagesApiUrl(): string {
    return `${environment.apiUrl}/images`;
  }

  getList(params?: { page?: number; limit?: number; search?: string }): Observable<ProjectListResponse> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit);
    if (params?.search) httpParams = httpParams.set('search', params.search);

    return this.http.get<BackendProjectListResponse>(this.apiUrl, { params: httpParams }).pipe(
      map(response => ({
        ...response,
        data: response.data.map(project => this.mapProject(project)),
      })),
    );
  }

  getById(id: string): Observable<Project | null> {
    return this.http
      .get<BackendProjectResponse>(`${this.apiUrl}/${id}`)
      .pipe(map(project => (project ? this.mapProject(project) : null)));
  }

  createProject(request: CreateProjectRequest): Observable<Project> {
    return this.http.post<BackendProjectResponse>(this.apiUrl, request).pipe(map(project => this.mapProject(project)));
  }

  getProjectImages(projectId: string, params?: { page?: number; limit?: number }): Observable<ImageListResponse> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit);

    return this.http.get<ImageListResponse>(`${this.apiUrl}/${projectId}/images`, { params: httpParams });
  }

  uploadImage(projectId: string, request: UploadImageRequest): Observable<ImageUploadResponse> {
    const formData = createUploadFormData(request);
    formData.append('projectId', projectId);

    const model = request.parameters?.model || 'gpt-image-1-mini-low';

    return this.http.post<ImageUploadResponse>(`${this.imagesApiUrl}/upload`, formData).pipe(
      tap(() => {
        // Optimistic credit decrement
        this.creditsService.decrementCredit(model);
      }),
      catchError((error: HttpErrorResponse) => {
        // Check for insufficient credits error
        const creditError = this.creditsService.isInsufficientCreditsError(error);
        if (creditError) {
          // Reload credits to get accurate state
          this.creditsService.loadCredits().subscribe();
        }
        return throwError(() => error);
      }),
    );
  }

  private mapProject(project: BackendProjectResponse): Project {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      ownerId: project.ownerId,
      userId: project.ownerId,
      teamMemberIds: project.teamMemberIds,
      model: 'PixPro AI',
      imageCount: project.imageCount,
      date: project.createdAt,
      createdAt: project.createdAt,
      colors: this.getPalette(project.id),
    };
  }

  private getPalette(projectId: string): string[] {
    const seed = Array.from(projectId).reduce((accumulator, char) => accumulator + char.charCodeAt(0), 0);
    return this.projectPalettes[seed % this.projectPalettes.length];
  }
}
