import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Root path
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },

  // Auth Feature
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login')
            .then(m => m.LoginComponent)
      },
      {
        path: 'register',
        // Placeholder: implement in US registration
        loadComponent: () =>
          import('./features/auth/login/login')
            .then(m => m.LoginComponent)
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  },

  // Protected routes
  {
    path: 'dashboard',
    canActivate: [authGuard],
    // Placeholder: implement in subsequent phases
    loadComponent: () =>
      import('./features/auth/login/login')
        .then(m => m.LoginComponent)
  },

  // Wildcard: any route not found
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];
