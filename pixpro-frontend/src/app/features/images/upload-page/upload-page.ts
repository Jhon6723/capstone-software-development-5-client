import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  onImagesSelected(files: File[]): void {
    // TODO: conectar con el Image Processing Service cuando el backend esté listo
    console.log('Imágenes seleccionadas:', files);
  }
}
