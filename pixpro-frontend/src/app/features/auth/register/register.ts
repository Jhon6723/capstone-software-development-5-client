import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/auth/auth.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirm  = control.get('confirmPassword');
  if (!password || !confirm) return null;
  if (password.value !== confirm.value) {
    confirm.setErrors({ passwordMismatch: true });
    return { passwordMismatch: true };
  }
  const errors = { ...confirm.errors };
  delete errors['passwordMismatch'];
  confirm.setErrors(Object.keys(errors).length ? errors : null);
  return null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatSnackBarModule,
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterComponent {

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);

  isLoading = signal(false);

  registerForm: FormGroup = this.fb.group({
    firstName:       ['', [Validators.required, Validators.minLength(2)]],
    lastName:        ['', [Validators.required, Validators.minLength(2)]],
    email:           ['', [Validators.required, Validators.email]],
    password:        ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/)
    ]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: passwordMatchValidator });

  get firstName()       { return this.registerForm.get('firstName')!; }
  get lastName()        { return this.registerForm.get('lastName')!; }
  get email()           { return this.registerForm.get('email')!; }
  get password()        { return this.registerForm.get('password')!; }
  get confirmPassword() { return this.registerForm.get('confirmPassword')!; }

  get firstNameError(): string {
    if (this.firstName.hasError('required'))  return 'El nombre es requerido';
    if (this.firstName.hasError('minlength')) return 'Mínimo 2 caracteres';
    return '';
  }

  get lastNameError(): string {
    if (this.lastName.hasError('required'))  return 'El apellido es requerido';
    if (this.lastName.hasError('minlength')) return 'Mínimo 2 caracteres';
    return '';
  }

  get emailError(): string {
    if (this.email.hasError('required')) return 'El email es requerido';
    if (this.email.hasError('email'))    return 'Ingresa un email válido';
    return '';
  }

  get passwordError(): string {
    if (this.password.hasError('required'))  return 'La contraseña es requerida';
    if (this.password.hasError('minlength')) return 'Mínimo 8 caracteres';
    if (this.password.hasError('pattern'))   return 'Debe tener al menos 1 mayúscula y 1 número';
    return '';
  }

  get confirmError(): string {
    if (this.confirmPassword.hasError('required'))         return 'Confirma tu contraseña';
    if (this.confirmPassword.hasError('passwordMismatch')) return 'Las contraseñas no coinciden';
    return '';
  }

  get strength(): number {
    const v = this.password.value || '';
    let s = 0;
    if (v.length >= 8)     s++;
    if (/[A-Z]/.test(v))  s++;
    if (/\d/.test(v))     s++;
    return s;
  }

  get strengthLabel(): string  { return ['', 'Débil', 'Media', 'Fuerte'][this.strength]; }
  get strengthClass(): string  { return ['', 'weak', 'medium', 'strong'][this.strength]; }

  onSubmit(): void {
    if (this.registerForm.invalid || this.isLoading()) return;
    this.isLoading.set(true);

    const request = {
      email: this.email.value,
      password: this.password.value
    };

    this.authService.register(request).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.snackBar.open('¡Cuenta creada exitosamente! Redirigiendo...', '', {
          duration: 2000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.message || 'Error al registrar. Intenta de nuevo.';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
      }
    });
  }
}
