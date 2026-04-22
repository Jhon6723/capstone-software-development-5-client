import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Temporary route for testing uploading images
  {
    path: 'test',
    loadComponent: () => 
      import('./test/features/upload-test/uploading-test').then(m => m.UploadTestComponent),
    title: 'Prueba de imagenes'
  },

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/login/login').then(m => m.LoginComponent) // placeholder
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/auth/login/login').then(m => m.LoginComponent) // placeholder
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
