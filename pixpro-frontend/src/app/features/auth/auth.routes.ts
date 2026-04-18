import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./login/login').then(m => m.LoginComponent) // placeholder
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
