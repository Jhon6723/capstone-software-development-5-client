export interface Project {
  id: string;
  name: string;
  model: string;
  imageCount: number;
  date: string;           // ISO string o formato legible
  colors: string[];       // Para el mosaic preview
  thumbnailUrl?: string;  // Para cuando el backend envíe imágenes reales
  createdAt?: string;     // Timestamp para ordenamiento
  userId?: string;        // Para filtrar por usuario
  metadata?: {
    prompt?: string;
    effect?: string;
    resolution?: string;
    [key: string]: any;
  };
}

export interface ProjectListResponse {
  data: Project[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export type ActionId = 'upload' | 'prompt' | 'effects';