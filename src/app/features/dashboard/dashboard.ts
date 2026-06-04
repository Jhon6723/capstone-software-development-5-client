import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ActionId, Project } from '../../core/models/project.model';
import { AuthService } from '../../core/services/auth.service';
import { ProjectsService } from '../../core/services/projects.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar';

type ActivePanel = ActionId | null;

interface ActionCard {
  id: ActionId;
  title: string;
  description: string;
  gradient: string;
  opensPanel: boolean;
}

interface Effect {
  id: string;
  name: string;
  gradient: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {

  private authService = inject(AuthService);
  private projectsService = inject(ProjectsService);
  private router = inject(Router);

  currentUser = this.authService.currentUser;
  activePanel = signal<ActivePanel>(null);
  promptText = signal('');
  selectedEffect = signal<string | null>(null);
  customEffectPrompt = signal('');

  get firstName(): string {
    const user = this.currentUser();
    if (!user) return 'Usuario';
    return user.name?.split(' ')[0] || 'Usuario';
  }

  readonly actionCards: ActionCard[] = [
    {
      id: 'upload',
      title: 'Mejora de imágenes',
      description: 'Aumenta la resolución, nitidez y calidad visual de tus fotos',
      gradient: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #34d399 100%)',
      opensPanel: false
    },
    {
      id: 'prompt',
      title: 'Crear desde prompt',
      description: 'Genera imágenes a partir de una descripción de texto',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      opensPanel: true
    },
    {
      id: 'effects',
      title: 'Aplicar efectos artísticos',
      description: 'Transforma tus imágenes con estilos artísticos de IA',
      gradient: 'linear-gradient(135deg, #f43f5e 0%, #f97316 100%)',
      opensPanel: true
    }
  ];

  readonly effects: Effect[] = [
    { id: 'ghibli',    name: 'Ghibli',        gradient: 'linear-gradient(135deg, #059669, #34d399)' },
    { id: 'anime',     name: 'Anime',          gradient: 'linear-gradient(135deg, #db2777, #a855f7)' },
    { id: 'cyberpunk', name: 'Cyberpunk',      gradient: 'linear-gradient(135deg, #2563eb, #06b6d4)' },
    { id: 'custom',    name: 'Personalizado',  gradient: 'linear-gradient(135deg, #d97706, #f59e0b)' }
  ];

  recentProjects: Project[] = [];

  ngOnInit(): void {
    this.loadRecentProjects();
  }

  // Iconos SVG
  getCardIcon(id: ActionId): string {
    const icons: Record<ActionId, string> = {
      upload: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>`,
      prompt: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/><line x1="15" x2="19" y1="5" y2="9"/></svg>`,
      effects: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/><circle cx="12" cy="12" r="3"/></svg>`
    };
    return icons[id];
  }

  // Limpieza de estado al cambiar panel
  private clearPanelState(panel: ActivePanel): void {
    if (panel !== 'prompt') this.promptText.set('');
    if (panel !== 'effects') {
      this.selectedEffect.set(null);
      this.customEffectPrompt.set('');
    }
  }

  // Lógica de selección de cards
  selectCard(id: ActionId): void {
    const card = this.actionCards.find(c => c.id === id);
    if (!card) return;

    if (card.opensPanel) {
      const isOpen = this.activePanel() === id;
      this.activePanel.set(isOpen ? null : id);
      this.clearPanelState(isOpen ? null : id);
    } else {
      this.router.navigate(['/upload'], { queryParams: { action: id } });
    }
  }

  isActive(id: ActionId): boolean {
    return this.activePanel() === id;
  }

  // Panel: Prompt
  updatePrompt(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.promptText.set(value);
  }

  addHint(hint: string): void {
    const current = this.promptText();
    const separator = current && !current.endsWith(' ') ? ' ' : '';
    this.promptText.set(`${current}${separator}${hint} `);
  }

  get canContinuePrompt(): boolean {
    return this.promptText().trim().length > 0;
  }

  continueWithPrompt(): void {
    if (!this.canContinuePrompt) return;
    this.router.navigate(['/upload'], {
      queryParams: { action: 'prompt', prompt: this.promptText() }
    });
  }

  // Panel: Effects
  selectEffect(id: string): void {
    this.selectedEffect.set(id);
  }

  updateCustomEffectPrompt(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.customEffectPrompt.set(value);
  }

  addCustomHint(hint: string): void {
    const current = this.customEffectPrompt();
    const separator = current && !current.endsWith(' ') ? ' ' : '';
    this.customEffectPrompt.set(`${current}${separator}${hint} `);
  }

  get canContinueEffect(): boolean {
    const effect = this.selectedEffect();
    if (!effect) return false;
    if (effect === 'custom') {
      return this.customEffectPrompt().trim().length > 0;
    }
    return true;
  }

  continueWithEffect(): void {
    if (!this.canContinueEffect) return;
    
    const effect = this.selectedEffect();
    const prompt = effect === 'custom' ? this.customEffectPrompt() : undefined;
    
    const queryParams: { action: string; effect: string; prompt?: string } = { action: 'effects', effect: effect! };
    if (prompt) queryParams.prompt = prompt;
    
    this.router.navigate(['/upload'], { queryParams });
  }

  // Navegación a proyectos
  viewAllProjects(): void {
    this.router.navigate(['/projects']);
  }

  viewProject(id: string): void {
    this.router.navigate(['/project', id]);
  }

  private async loadRecentProjects(): Promise<void> {
    try {
      const response = await this.projectsService.getList({ page: 1, limit: 12 }).toPromise();
      if (!response) {
        this.recentProjects = [];
        return;
      }

      this.recentProjects = response.data
        .sort((a, b) => {
          const aDate = new Date(a.createdAt ?? a.date).getTime();
          const bDate = new Date(b.createdAt ?? b.date).getTime();
          return bDate - aDate;
        })
        .slice(0, 3)
        .map(project => ({
          ...project,
          date: this.formatRelativeDate(project.createdAt ?? project.date)
        }));
    } catch (error) {
      console.error('Error loading recent projects:', error);
      this.recentProjects = [];
    }
  }

  private formatRelativeDate(dateString: string): string {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return 'Fecha no disponible';
    }

    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  // Efecto glow siguiendo el mouse
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    const cards = document.querySelectorAll('.action-card') as NodeListOf<HTMLElement>;
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  }
}