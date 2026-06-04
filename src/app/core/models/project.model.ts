export interface Project {
  id: string;
  name: string;
  description?: string;
  model: string;
  imageCount: number;
  date: string;           // ISO string o formato legible
  colors: string[];       // Para el mosaic preview
  thumbnailUrl?: string;  // Para cuando el backend envíe imágenes reales
  createdAt?: string;     // Timestamp para ordenamiento
  userId?: string;        // Para filtrar por usuario
  ownerId?: string;
  teamMemberIds?: string[];
  metadata?: {
    prompt?: string;
    effect?: string;
    resolution?: string;
    [key: string]: string | number | boolean | null | undefined;
  };
}

export interface ProjectListResponse {
  data: Project[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ProjectImage {
  id: string;
  projectId: string;
  fileName: string;
  contentType: string;
  filePath: string;
  cloudinaryPublicId: string;
  secureUrl: string;
  format: string;
  sizeInBytes: number;
  width: number;
  height: number;
  status: string;
  ownerId: string;
  createdAt: string;
}

export interface ImageListResponse {
  data: ProjectImage[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface ImageUploadResponse {
  imageId: string;
  fileName: string;
  url: string;
  secureUrl: string;
  format: string;
  sizeInBytes: number;
  width: number;
  height: number;
  uploadedAt: string;
  feature: 0 | 1;
}

export interface BackendProjectResponse {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  teamMemberIds?: string[];
  createdAt: string;
  updatedAt?: string;
  imageCount: number;
}

export interface BackendProjectListResponse {
  data: BackendProjectResponse[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export type ActionId = 'upload' | 'prompt' | 'effects';