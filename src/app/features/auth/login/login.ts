import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatSnackBarModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  isLoading = signal(false);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get emailControl() {
    return this.loginForm.get('email')!;
  }
  get passwordControl() {
    return this.loginForm.get('password')!;
  }

  get emailError(): string {
    if (this.emailControl.hasError('required')) return 'El email es requerido';
    if (this.emailControl.hasError('email')) return 'Ingresa un email válido';
    return '';
  }

  get passwordError(): string {
    if (this.passwordControl.hasError('required')) return 'La contraseña es requerida';
    if (this.passwordControl.hasError('minlength')) return 'Mínimo 6 caracteres';
    return '';
  }

  onSubmit(): void {
    if (this.loginForm.invalid || this.isLoading()) return;
    this.isLoading.set(true);
    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: err => {
        this.isLoading.set(false);
        const msg = err.error?.message || 'Credenciales incorrectas. Intenta nuevamente.';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
      },
    });
  }

  loginWithGoogle(): void {
    this.authService.loginWithGoogle();
  }
}
