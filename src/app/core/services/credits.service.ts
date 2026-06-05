import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BACKEND_TIER_MAP,
  CREDIT_INFO,
  CreditInfo,
  InsufficientCreditsError,
  MODEL_TIER_MAP,
  UserCredits,
  UserCreditsResponse,
  isAdminFromTier,
} from '../models/user-credits.model';

@Injectable({ providedIn: 'root' })
export class CreditsService {
  private http = inject(HttpClient);

  // Signals for reactive state
  credits = signal<UserCredits[]>([]);
  isAdmin = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  private get apiUrl(): string {
    return `${environment.apiUrl}/credits/me`;
  }

  /**
   * Load user credits from backend
   */
  loadCredits(): Observable<UserCreditsResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<UserCreditsResponse>(this.apiUrl).pipe(
      tap(response => {
        // Map backend response to internal format
        const mappedCredits: UserCredits[] = response.credits
          .map(c => {
            const modelTier = BACKEND_TIER_MAP[c.modelTier];
            if (!modelTier) return null;
            return {
              modelTier,
              creditsRemaining: c.remaining,
              creditsTotal: c.total,
            };
          })
          .filter((c): c is UserCredits => c !== null);

        this.credits.set(mappedCredits);
        this.isAdmin.set(isAdminFromTier(response.subscriptionTier));
        this.isLoading.set(false);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.error.set('Failed to load credits');
        return throwError(() => err);
      }),
    );
  }

  /**
   * Get credits for a specific model tier
   */
  getCreditsForModel(modelName: string): UserCredits | undefined {
    const modelTier = MODEL_TIER_MAP[modelName];
    if (!modelTier) return undefined;

    return this.credits().find(c => c.modelTier === modelTier);
  }

  /**
   * Check if user has sufficient credits for a model
   * Returns true if: admin, unlimited model, or has enough credits
   */
  canUseModel(modelName: string): boolean {
    if (this.isAdmin()) return true;

    const modelTier = MODEL_TIER_MAP[modelName];
    if (!modelTier) return false;

    // flux-schnell is unlimited
    if (modelTier === 'flux_schnell') return true;

    const credit = this.credits().find(c => c.modelTier === modelTier);
    return credit ? credit.creditsRemaining > 0 : false;
  }

  /**
   * Get remaining credits count for display
   */
  getRemainingCredits(modelName: string): number | 'unlimited' {
    if (this.isAdmin()) return 'unlimited';

    const modelTier = MODEL_TIER_MAP[modelName];
    if (!modelTier) return 0;

    if (modelTier === 'flux_schnell') return 'unlimited';

    const credit = this.credits().find(c => c.modelTier === modelTier);
    return credit ? credit.creditsRemaining : 0;
  }

  /**
   * Get credit info for a model
   */
  getCreditInfo(modelName: string): CreditInfo | undefined {
    const modelTier = MODEL_TIER_MAP[modelName];
    return CREDIT_INFO.find(info => info.modelTier === modelTier);
  }

  /**
   * Get all credit info
   */
  getAllCreditInfo(): CreditInfo[] {
    return CREDIT_INFO;
  }

  /**
   * Check if error is insufficient credits
   */
  isInsufficientCreditsError(error: HttpErrorResponse): InsufficientCreditsError | null {
    if (error.status === 402 && error.error?.code === 'INSUFFICIENT_CREDITS') {
      return {
        code: 'INSUFFICIENT_CREDITS',
        message: error.error.message || 'Insufficient credits',
        modelTier: error.error.modelTier,
        creditsRemaining: error.error.creditsRemaining || 0,
        creditsRequired: error.error.creditsRequired || 1,
      };
    }
    return null;
  }

  /**
   * Refresh credits after upload (optimistic update)
   */
  decrementCredit(modelName: string): void {
    if (this.isAdmin()) return;

    const modelTier = MODEL_TIER_MAP[modelName];
    if (!modelTier || modelTier === 'flux_schnell') return;

    this.credits.update(currentCredits =>
      currentCredits.map(c =>
        c.modelTier === modelTier && c.creditsRemaining > 0 ? { ...c, creditsRemaining: c.creditsRemaining - 1 } : c,
      ),
    );
  }
}
