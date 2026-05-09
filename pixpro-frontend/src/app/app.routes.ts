import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
    path: 'auth/callback',
    loadComponent: () => import('./features/auth/auth-callback/auth-callback').then(m => m.AuthCallbackComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent),
  },
  {
    path: 'upload',
    canActivate: [authGuard],
    loadComponent: () => import('./features/images/upload-page/upload-page').then(m => m.UploadPageComponent),
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
