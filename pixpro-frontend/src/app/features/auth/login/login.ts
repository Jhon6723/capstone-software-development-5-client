import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  // Signals
  isLoading = signal(false);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  get emailControl() { return this.loginForm.get('email')!; }
  get passwordControl() { return this.loginForm.get('password')!; }

  get emailErrorMessage(): string {
    if (this.emailControl.hasError('required')) return 'El email es requerido';
    if (this.emailControl.hasError('email')) return 'Ingresa un email válido';
    return '';
  }

  get passwordErrorMessage(): string {
    if (this.passwordControl.hasError('required')) return 'La contraseña es requerida';
    if (this.passwordControl.hasError('minlength')) return 'Mínimo 6 caracteres';
    return '';
  }

  onSubmit(): void {
    // Double check
    if (this.loginForm.invalid || this.isLoading()) return;

    this.isLoading.set(true);

    const credentials = this.loginForm.getRawValue();

    /**
     * INTEGRATION NOTE:
     * Change `simulateLogin` to `login` when the backend is ready:
     *   this.authService.login(credentials).subscribe(...)
     */
    this.authService.simulateLogin(credentials).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        const message = err?.error?.message || 'Credenciales incorrectas. Intenta nuevamente.';
        this.snackBar.open(message, 'Cerrar', {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}
