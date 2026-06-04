import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar';
import { ImageUploaderComponent } from '../image-uploader/image-uploader.component';

@Component({
  selector: 'app-upload-page',
  standalone: true,
  imports: [CommonModule, NavbarComponent, ImageUploaderComponent],
  templateUrl: './upload-page.html',
  styleUrl: './upload-page.scss'
})
export class UploadPageComponent {
  constructor(private readonly route: ActivatedRoute) {}

  get title(): string {
    switch (this.action) {
      case 'prompt':
        return 'Generar desde prompt';
      case 'effects':
        return 'Aplicar efecto artístico';
      default:
        return 'Subir imágenes';
    }
  }

  get subtitle(): string {
    switch (this.action) {
      case 'prompt':
        return 'Genera una imagen desde texto. Puedes continuar sin subir archivos o agregar imágenes de referencia opcionales.';
      case 'effects':
        return 'Sube una imagen para transformarla con un estilo artístico de IA. Acepta JPG, PNG y WEBP hasta 5MB.';
      default:
        return 'Selecciona las imágenes que quieres procesar con IA. Acepta JPG, PNG y WEBP, máximo 5MB por archivo y hasta 4 imágenes a la vez.';
    }
  }

  private get action(): 'upload' | 'prompt' | 'effects' {
    const action = this.route.snapshot.queryParamMap.get('action');
    return action === 'prompt' || action === 'effects' ? action : 'upload';
  }

  onImagesSelected(files: File[]): void {
    console.log('Imágenes seleccionadas:', files);
  }
}
