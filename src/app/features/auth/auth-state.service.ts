import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private registerMode = signal(false);
  readonly isRegister = this.registerMode.asReadonly();

  setLogin(): void {
    this.registerMode.set(false);
  }

  setRegister(): void {
    this.registerMode.set(true);
  }
}
