export interface UploadImageRequest {
  file?: File;
  prompt: string;
  feature?: ProcessingFeature;
  parameters?: ProcessingParameters;
}

export type ProcessingFeature = 0 | 1; // 0=Generator (text-to-image), 1=Editor (image-to-image)

export interface ProcessingParameters {
  width?: number;           // Default: 512, Range: 64-2048
  height?: number;          // Default: 512, Range: 64-2048
  numInferenceSteps?: number; // Default: 20, Range: 1-100 (Pixazo usa 4 fijo)
  strength?: number;        // Default: 0.75, Range: 0.0-1.0 (solo image-to-image)
  guidanceScale?: number;   // Default: 7.5, Range: 1.0-20.0 (solo Pollinations)
  quantity?: number;        // Default: 1, Range: 1-10
  model?: string;           // Default: 'gpt-image-1-mini-low'
                            // Options: 'flux-schnell', 'gpt-image-1-mini-low', 'kontext', 'gpt-image-1-mini-high'
}

// Helper para crear FormData desde el request
export function createUploadFormData(request: UploadImageRequest): FormData {
  const formData = new FormData();

  if (request.file) {
    formData.append('file', request.file);
  }

  formData.append('prompt', request.prompt);

  if (request.feature !== undefined) {
    formData.append('feature', request.feature.toString());
  }

  if (request.parameters) {
    formData.append('parameters', JSON.stringify(request.parameters));
  }

  return formData;
}

// Constantes recomendadas del backend
export const UPLOAD_CONSTRAINTS = {
  maxFileSizeBytes: 5 * 1024 * 1024, // 5 MB
  maxFileSizeMB: 5,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  gatewayMaxFileSizeBytes: 10 * 1024 * 1024, // 10 MB en Gateway
} as const;
