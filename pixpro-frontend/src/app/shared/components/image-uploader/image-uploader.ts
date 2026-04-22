import { Component, EventEmitter, Output } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';

interface ImagePreview {
  file: File;
  previewUrl: string;
  error?: string;
}

@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [NgIf, NgFor],
  template: `
    <div class="image-uploader">
      <input
        type="file"
        #fileInput
        multiple
        accept="image/jpeg,image/png"
        (change)="onFilesSelected($event)"
        style="display: none"
      />
      
      <!-- Buttons -->
      <div>
        <button (click)="fileInput.click()">
          Seleccionar imagenes
        </button>
        <button *ngIf="imagePreviews.length > 0" (click)="clearAllImages()" style="margin-left: 10px;">
          Limpiar todas ({{ imagePreviews.length }})
        </button>
      </div>
      
      <!-- Grid of previews -->
      <div *ngIf="imagePreviews.length > 0" style="margin-top: 20px;">
        <h4>Vista previa ({{ imagePreviews.length }} imágenes):</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px;">
          <div *ngFor="let preview of imagePreviews; let i = index" style="border: 1px solid #ccc; padding: 10px; border-radius: 5px;">
            <img 
              [src]="preview.previewUrl" 
              [alt]="preview.file.name"
              style="width: 100%; height: 150px; object-fit: cover; border-radius: 5px;"
            />
            <p style="font-size: 12px; margin: 5px 0; word-break: break-all;">
              {{ preview.file.name }}
            </p>
            <p style="font-size: 10px; color: #666; margin: 2px 0;">
              {{ formatFileSize(preview.file.size) }}
            </p>
            <button (click)="removeImage(i)" style="margin-top: 5px; background-color: #ff4444; color: white; border: none; padding: 5px; border-radius: 3px;">
              Eliminar
            </button>
          </div>
        </div>
      </div>
      
      <!-- Error messages -->
      <div *ngIf="globalErrorMessage" style="color: red; margin-top: 10px;">
        {{ globalErrorMessage }}
      </div>
    </div>
  `
})
export class ImageUploaderComponent {
  @Output() imagesSelected = new EventEmitter<File[]>();
  
  imagePreviews: ImagePreview[] = [];
  globalErrorMessage: string | null = null;
  
  private readonly MAX_SIZE_MB = 5;
  private readonly MAX_FILES = 4; // Limit of 4 images
  private readonly ALLOWED_TYPES = [
    'image/jpeg',
    'image/png'
  ];
  
  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    
    this.globalErrorMessage = null;
    
    if (!files || files.length === 0) {
      return;
    }
    
    // Validate maximum number of images
    if (this.imagePreviews.length + files.length > this.MAX_FILES) {
      this.globalErrorMessage = `Solo puedes seleccionar maximo ${this.MAX_FILES} imagenes, actualmente tienes ${this.imagePreviews.length} imágenes.`;
      return;
    }
    
    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      this.processFile(file);
    }
    
    // Updated array of files
    this.emitImages();
    input.value = '';
  }
  
  private processFile(file: File): void {
    // Validate type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      this.globalErrorMessage = `Formato no permitido: ${file.name}. Solo JPG o PNG`;
      return;
    }
    
    // Validate size
    const maxSizeBytes = this.MAX_SIZE_MB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      this.globalErrorMessage = `Imagen excede tamaño: ${file.name}. Máximo ${this.MAX_SIZE_MB}MB.`;
      return;
    }
    
    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreviews.push({
        file: file,
        previewUrl: e.target?.result as string
      });
    };
    reader.readAsDataURL(file);
  }
  
  removeImage(index: number): void {
    this.imagePreviews.splice(index, 1);
    this.emitImages();
    
    if (this.imagePreviews.length === 0) {
      this.globalErrorMessage = null;
    }
  }
  
  clearAllImages(): void {
    this.imagePreviews = [];
    this.globalErrorMessage = null;
    this.emitImages();
  }
  
  private emitImages(): void {
    const files = this.imagePreviews.map(preview => preview.file);
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