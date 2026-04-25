import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent {

  private authService = inject(AuthService);
  currentUser = this.authService.currentUser;

  get firstName(): string {
    const name = this.currentUser()?.name;
    if (!name) return 'Usuario';
    return name.split(' ')[0] || 'Usuario';
  }

  quickAccessCards = [
    {
      icon: '◎',
      title: 'Subir imágenes',
      description: 'Sube y gestiona tus imágenes para procesarlas con IA.',
      tag: 'Disponible',
      color: 'card-blue',
      route: '/upload'
    },
    {
      icon: '✦',
      title: 'Filtros artísticos',
      description: 'Aplica estilos artísticos generados por IA a tus fotos.',
      tag: 'Fase 2',
      color: 'card-purple',
      route: null
    },
    {
      icon: '↑',
      title: 'Mejora de resolución',
      description: 'Aumenta la calidad y resolución de tus imágenes con IA.',
      tag: 'Fase 2',
      color: 'card-teal',
      route: null
    },
    {
      icon: '◷',
      title: 'Mis proyectos',
      description: 'Accede y gestiona todos tus proyectos de procesamiento.',
      tag: 'Próximamente',
      color: 'card-indigo',
      route: null
    }
  ];
}
