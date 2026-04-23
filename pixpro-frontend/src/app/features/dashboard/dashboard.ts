import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent {

  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser = this.authService.currentUser;

  get firstName(): string {
    const name = this.currentUser()?.name;
    if (!name) return 'Usuario';
    return name.split(' ')[0] || 'Usuario';
  }

  // Placeholders for next phases
  quickAccessCards = [
    {
      icon: '◎',
      title: 'Detección de objetos',
      description: 'Identifica y etiqueta objetos en tus imágenes automáticamente.',
      tag: 'Fase 2',
      color: 'card-blue'
    },
    {
      icon: '✦',
      title: 'Filtros artísticos',
      description: 'Aplica estilos artísticos generados por IA a tus fotos.',
      tag: 'Fase 2',
      color: 'card-purple'
    },
    {
      icon: '↑',
      title: 'Mejora de resolución',
      description: 'Aumenta la calidad y resolución de tus imágenes con IA.',
      tag: 'Fase 2',
      color: 'card-teal'
    },
    {
      icon: '◷',
      title: 'Mis proyectos',
      description: 'Accede y gestiona todos tus proyectos de procesamiento.',
      tag: 'Próximamente',
      color: 'card-indigo'
    }
  ];

  logout(): void {
    this.authService.logout();
  }
}
