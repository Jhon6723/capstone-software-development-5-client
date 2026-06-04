import { Component, ElementRef, EventEmitter, inject, Output, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionId } from '../../../core/models/project.model';
import { ProcessingFeature, ProcessingParameters } from '../../../core/models/upload-image.request';
import { UploadStateService } from '../../../core/services/upload-state.service';

interface ImagePreview {
  file: File;
  previewUrl: string;
  error?: string;
}

interface ModelOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-image-uploader',
  standalone: true,
  templateUrl: './image-uploader.component.html',
  styleUrl: './image-uploader.component.scss',
})
export class ImageUploaderComponent {
  @Output() imagesSelected = new EventEmitter<File[]>();
  @ViewChild('fileInput') private fileInput?: ElementRef<HTMLInputElement>;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private uploadState = inject(UploadStateService);

  imagePreviews = signal<ImagePreview[]>([]);
  globalErrorMessage = signal<string | null>(null);
  isProcessing = signal<boolean>(false);
  projectTitle = signal('');
  projectDescription = signal('');
  selectedModel = signal('');

  private pendingReads: number = 0;

  private readonly MAX_SIZE_MB = 5;
  private readonly MAX_FILES = 1;
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  ngOnInit(): void {
    this.projectTitle.set(this.buildDefaultProjectName());
    this.projectDescription.set(this.buildDefaultProjectDescription());
    this.selectedModel.set(this.resolveDefaultModel());
  }

  get title(): string {
    switch (this.currentAction) {
      case 'prompt':
        return 'Generación desde prompt';
      case 'effects':
        return 'Subir imagen para aplicar efecto';
      default:
        return 'Subir imágenes';
    }
  }

  get subtitle(): string {
    switch (this.currentAction) {
      case 'prompt':
        return 'Si quieres, agrega una imagen de referencia. También puedes continuar solo con el prompt.';
      case 'effects':
        return 'JPG, PNG o WEBP · Máx. 5MB · 1 imagen';
      default:
        return 'JPG, PNG o WEBP · Máx. 5MB · 1 imagen';
    }
  }

  get canContinue(): boolean {
    if (this.globalErrorMessage() || this.isProcessing()) {
      return false;
    }

    if (!this.projectTitle().trim()) {
      return false;
    }

    if (this.currentAction === 'prompt') {
      return this.promptFromRoute.length > 0;
    }

    return this.imagePreviews().length > 0;
  }

  get continueLabel(): string {
    return this.currentAction === 'prompt' ? 'Generar con IA' : 'Continuar al procesamiento';
  }

  get showImageUploadSection(): boolean {
    return this.currentAction !== 'prompt';
  }

  get availableModels(): ModelOption[] {
    if (this.currentAction === 'prompt') {
      return [{ value: 'flux-schnell', label: 'Flux Schnell (text-to-image)' }];
    }

    return [
      { value: 'gpt-image-1-mini-low', label: 'GPT Image Mini Low (rápido y económico)' },
      { value: 'gpt-image-1-mini-high', label: 'GPT Image Mini High (máxima calidad)' },
      { value: 'kontext', label: 'Kontext (estilo artístico)' },
    ];
  }

  openFilePicker(): void {
    this.fileInput?.nativeElement.click();
  }

  private get currentAction(): ActionId {
    const action = this.route.snapshot.queryParamMap.get('action');
    return action === 'prompt' || action === 'effects' ? action : 'upload';
  }

  private get promptFromRoute(): string {
    return this.route.snapshot.queryParamMap.get('prompt')?.trim() ?? '';
  }

  private get effectFromRoute(): string {
    return this.route.snapshot.queryParamMap.get('effect')?.trim() ?? '';
  }

  // Método para navegar a página de procesamiento
  goToProcessing(): void {
    const config = this.buildProcessingConfig();
    if (!config) return;

    const previews = this.imagePreviews();
    const files = previews.map(p => p.file);

    this.uploadState.setContext({
      images: files,
      action: this.currentAction,
      effect: this.effectFromRoute || undefined,
      prompt: config.prompt,
      feature: config.feature,
      parameters: config.parameters,
      projectName: config.projectName,
      projectDescription: config.projectDescription,
      expectedResultCount: config.parameters.quantity ?? 1,
    });

    this.router.navigate(['/processing']);
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    this.globalErrorMessage.set(null);

    if (!files || files.length === 0) return;

    if (this.imagePreviews().length + files.length > this.MAX_FILES) {
      this.globalErrorMessage.set('Solo puedes seleccionar una imagen.');
      input.value = '';
      return;
    }

    this.isProcessing.set(true);
    this.pendingReads = 0;

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!this.ALLOWED_TYPES.includes(file.type)) {
        this.globalErrorMessage.set(`Formato no válido: ${file.name}. Solo JPG, PNG o WEBP`);
        continue;
      }

      const maxSizeBytes = this.MAX_SIZE_MB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        this.globalErrorMessage.set(`Imagen excede tamaño: ${file.name}. Máximo ${this.MAX_SIZE_MB}MB.`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      this.isProcessing.set(false);
      input.value = '';
      return;
    }

    this.pendingReads = validFiles.length;
    const currentPreviews = [...this.imagePreviews()];

    for (const file of validFiles) {
      const reader = new FileReader();
      reader.onload = e => {
        currentPreviews.push({
          file: file,
          previewUrl: e.target?.result as string,
        });
        this.imagePreviews.set(currentPreviews);
        this.pendingReads--;

        if (this.pendingReads === 0) {
          this.isProcessing.set(false);
          this.emitImages();
        }
      };
      reader.readAsDataURL(file);
    }

    input.value = '';
  }

  removeImage(index: number): void {
    const currentPreviews = [...this.imagePreviews()];
    currentPreviews.splice(index, 1);
    this.imagePreviews.set(currentPreviews);
    this.emitImages();

    if (this.imagePreviews().length === 0) {
      this.globalErrorMessage.set(null);
    }
  }

  clearAllImages(): void {
    this.imagePreviews.set([]);
    this.globalErrorMessage.set(null);
    this.emitImages();
  }

  private emitImages(): void {
    const files = this.imagePreviews().map(preview => preview.file);
    this.imagesSelected.emit(files);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  updateProjectTitle(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.projectTitle.set(value);
    if (this.globalErrorMessage()) this.globalErrorMessage.set(null);
  }

  updateProjectDescription(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.projectDescription.set(value);
  }

  updateModel(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedModel.set(value);
  }

  private buildProcessingConfig(): { prompt: string; feature: ProcessingFeature; parameters: ProcessingParameters; projectName: string; projectDescription?: string } | null {
    const prompt = this.resolvePrompt();
    const customTitle = this.projectTitle().trim();
    const customDescription = this.projectDescription().trim();

    if (!prompt) {
      this.globalErrorMessage.set('No hay prompt suficiente para enviar la solicitud al backend.');
      return null;
    }

    if (!customTitle) {
      this.globalErrorMessage.set('Agrega un título para el proyecto antes de continuar.');
      return null;
    }

    if (this.currentAction !== 'prompt' && this.imagePreviews().length === 0) {
      this.globalErrorMessage.set('Debes subir al menos una imagen para este flujo.');
      return null;
    }

    const feature: ProcessingFeature = this.currentAction === 'prompt' ? 0 : 1;
    const parameters: ProcessingParameters = {
      quantity: 1,
      model: this.selectedModel() || this.resolveDefaultModel(),
    };

    return {
      prompt,
      feature,
      parameters,
      projectName: customTitle,
      projectDescription: customDescription || undefined,
    };
  }

  private resolvePrompt(): string {
    if (this.currentAction === 'prompt') {
      return this.promptFromRoute;
    }

    if (this.currentAction === 'effects') {
      const customPrompt = this.promptFromRoute;
      if (customPrompt) {
        return customPrompt;
      }

      const effect = this.effectFromRoute;
      const prompts: Record<string, string> = {
        ghibli: 'Transform this image into a Studio Ghibli-inspired illustration while preserving the scene composition.',
        anime: 'Transform this image into a polished anime-style illustration with expressive colors and clean outlines.',
        cyberpunk: 'Transform this image into a cinematic cyberpunk scene with neon lights, futuristic details, and night atmosphere.',
        custom: 'Apply the requested artistic transformation while preserving the subject of the original image.',
      };

      return prompts[effect] ?? 'Apply an artistic transformation to this image while preserving the main subject.';
    }

    return 'Enhance this image, improve sharpness and visual quality, and preserve the original composition.';
  }

  private resolveDefaultModel(): string {
    if (this.currentAction === 'prompt') {
      return 'flux-schnell';
    }

    if (this.currentAction === 'effects') {
      return 'kontext';
    }

    return 'gpt-image-1-mini-low';
  }

  private buildDefaultProjectName(): string {
    if (this.currentAction === 'prompt') {
      return 'Proyecto generado desde prompt';
    }

    if (this.currentAction === 'effects') {
      const effect = this.effectFromRoute || 'artístico';
      return `Efecto ${effect}`;
    }

    return 'Mejora de imagen';
  }

  private buildDefaultProjectDescription(): string {
    if (this.currentAction === 'prompt') {
      return this.promptFromRoute || 'Generación de imagen mediante prompt en PixPro.';
    }

    if (this.currentAction === 'effects') {
      const effect = this.effectFromRoute || 'artístico';
      return `Transformación de imagen con efecto ${effect}.`;
    }

    return 'Mejora y optimización de imágenes con IA.';
  }
}