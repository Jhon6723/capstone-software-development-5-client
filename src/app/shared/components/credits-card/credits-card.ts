import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { CreditsService } from '../../../core/services/credits.service';
import { CREDIT_INFO, CreditInfo } from '../../../core/models/user-credits.model';

@Component({
  selector: 'app-credits-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule, MatBadgeModule],
  templateUrl: './credits-card.html',
  styleUrl: './credits-card.scss'
})
export class CreditsCardComponent implements OnInit {
  private creditsService = inject(CreditsService);

  credits = this.creditsService.credits;
  isAdmin = this.creditsService.isAdmin;
  isLoading = this.creditsService.isLoading;

  // Display info for all models
  creditInfo = CREDIT_INFO;

  ngOnInit(): void {
    this.creditsService.loadCredits().subscribe();
  }

  /**
   * Get remaining credits for a specific model tier
   */
  getRemainingCredits(modelTier: string): number | 'unlimited' {
    if (this.isAdmin()) return 'unlimited';

    if (modelTier === 'flux_schnell') return 'unlimited';

    const credit = this.credits().find(c => c.modelTier === modelTier);
    return credit ? credit.creditsRemaining : 0;
  }

  /**
   * Check if credits are low (less than 20% remaining)
   */
  isLowCredits(info: CreditInfo): boolean {
    if (this.isAdmin()) return false;
    if (info.freeTierCredits === 'unlimited') return false;

    const remaining = this.getRemainingCredits(info.modelTier);
    if (remaining === 'unlimited') return false;

    const total = info.freeTierCredits as number;
    return remaining <= total * 0.2;
  }

  /**
   * Get display text for credits
   */
  getCreditsDisplay(modelTier: string): string {
    const remaining = this.getRemainingCredits(modelTier);
    if (remaining === 'unlimited') return '∞';
    return remaining.toString();
  }

  /**
   * Refresh credits
   */
  refresh(): void {
    this.creditsService.loadCredits().subscribe();
  }
}
