import {
  animate,
  group,
  query,
  style,
  transition,
  trigger
} from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.scss',
  animations: [
    trigger('slideAnimation', [
      transition('login => register', [
        query(':enter, :leave', [
          style({ position: 'absolute', top: 0, width: '100%' })
        ], { optional: true }),
        group([
          query(':leave', [
            animate('480ms cubic-bezier(0.65, 0, 0.35, 1)',
              style({ transform: 'translateX(-100%)', opacity: 0 }))
          ], { optional: true }),
          query(':enter', [
            style({ transform: 'translateX(100%)', opacity: 0 }),
            animate('480ms cubic-bezier(0.65, 0, 0.35, 1)',
              style({ transform: 'translateX(0)', opacity: 1 }))
          ], { optional: true })
        ])
      ]),

      transition('register => login', [
        query(':enter, :leave', [
          style({ position: 'absolute', top: 0, width: '100%' })
        ], { optional: true }),
        group([
          query(':leave', [
            animate('480ms cubic-bezier(0.65, 0, 0.35, 1)',
              style({ transform: 'translateX(100%)', opacity: 0 }))
          ], { optional: true }),
          query(':enter', [
            style({ transform: 'translateX(-100%)', opacity: 0 }),
            animate('480ms cubic-bezier(0.65, 0, 0.35, 1)',
              style({ transform: 'translateX(0)', opacity: 1 }))
          ], { optional: true })
        ])
      ])
    ])
  ]
})
export class AuthLayoutComponent implements OnInit, OnDestroy {

  private router = inject(Router);
  private routerSub?: Subscription;

  isRegisterMode = signal(false);

  ngOnInit(): void {
    this.updateMode(this.router.url);
    this.routerSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: NavigationEnd) => {
      this.updateMode(e.urlAfterRedirects);
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  private updateMode(url: string): void {
    this.isRegisterMode.set(url.includes('register'));
  }

  getRouteState(outlet: RouterOutlet): string {
    return outlet.isActivated
      ? (outlet.activatedRoute.snapshot.url[0]?.path ?? 'login')
      : 'login';
  }
}
