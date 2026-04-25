import { Component, EventEmitter, Output, signal } from '@angular/core';

interface ImagePreview {
  file: File;
  previewUrl: string;
  error?: string;
}

@Component({
  selector: 'app-image-uploader',
  standalone: true,
  templateUrl: './image-uploader.component.html',
  styleUrls: ['./image-uploader.component.scss'],
})
export class ImageUploaderComponent {
  @Output() imagesSelected = new EventEmitter<File[]>();

  imagePreviews = signal<ImagePreview[]>([]);
  globalErrorMessage = signal<string | null>(null);
  isProcessing = signal<boolean>(false);

  private pendingReads: number = 0;

  private readonly MAX_SIZE_MB = 5;
  private readonly MAX_FILES = 4;
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png'];

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    this.globalErrorMessage.set(null);

    if (!files || files.length === 0) {
      return;
    }

    // Validate max of images
    if (this.imagePreviews().length + files.length > this.MAX_FILES) {
      this.globalErrorMessage.set(`Solo puedes seleccionar maximo ${this.MAX_FILES} imagenes`);
      input.value = '';
      return;
    }

    this.isProcessing.set(true);
    this.pendingReads = 0;

    // Validate files
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!this.ALLOWED_TYPES.includes(file.type)) {
        this.globalErrorMessage.set(`Formato no valido: ${file.name}. Solo JPG o PNG`);
        continue;
      }

      const maxSizeBytes = this.MAX_SIZE_MB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        this.globalErrorMessage.set(`Imagen excede tamaño: ${file.name}. Maximo ${this.MAX_SIZE_MB}MB.`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      this.isProcessing.set(false);
      input.value = '';
      return;
    }

    // Process files
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
}
