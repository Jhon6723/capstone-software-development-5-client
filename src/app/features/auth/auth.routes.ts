import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './auth-layout/auth-layout';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./login/login').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./register/register').then(m => m.RegisterComponent)
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  }
];
