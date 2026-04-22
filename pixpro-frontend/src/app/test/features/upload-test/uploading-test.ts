import { Component } from '@angular/core';
import { ImageUploaderComponent } from '../../../shared/components/image-uploader/image-uploader';
import { NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'app-upload-test',
  standalone: true,
  imports: [ImageUploaderComponent, NgIf, NgFor],
  template: `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h1>Prueba para subir imagenes</h1>
      <p>Selecciona una o varias imagenes:</p>
      
      <!-- Reusable component with multiple support -->
      <app-image-uploader (imagesSelected)="onImagesSelected($event)"></app-image-uploader>
      
      <!-- Information about the selected images -->
      <div *ngIf="selectedImages.length > 0" style="margin-top: 20px;">
        <h3>Imagenes seleccionadas ({{ selectedImages.length }}):</h3>
        <div style="background-color: #f0f0f0; padding: 10px; border-radius: 5px;">
          <ul>
            <li *ngFor="let image of selectedImages; let i = index">
              <strong>{{ i + 1 }}.</strong> {{ image.name }} - {{ formatFileSize(image.size) }} - Tipo: {{ image.type }}
            </li>
          </ul>
          <button (click)="logImagesDetails()" style="margin-top: 10px;">
            Ver detalles en consola
          </button>
        </div>
      </div>
    </div>
  `
})
export class UploadTestComponent {
  selectedImages: File[] = [];
  
  onImagesSelected(files: File[]): void {
    this.selectedImages = files;
    console.log(`${files.length} imagenes seleccionadas:`);
    files.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.name} (${this.formatFileSize(file.size)})`);
    });
  }
  
  logImagesDetails(): void {
    console.log('Detalles:');
    this.selectedImages.forEach((file, index) => {
      console.log({
        index: index + 1,
        nombre: file.name,
        tamaño: file.size,
        tipo: file.type,
      });
    });
  }
  
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}