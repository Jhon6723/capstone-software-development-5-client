export type ModelTier = 'gpt_mini_low' | 'kontext' | 'gpt_mini_high' | 'flux_schnell';
export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'unlimited';

// Backend response structure for a single model credit
export interface ModelCreditResponse {
  modelTier: string; // 'GptMiniLow', 'Kontext', 'GptMiniHigh', etc.
  remaining: number;
  total: number;
  resetAt: string | null;
}

// Full backend response
export interface UserCreditsResponse {
  userId: string;
  subscriptionTier: string; // 'Free', 'Basic', 'Pro', 'Unlimited'
  credits: ModelCreditResponse[];
}

// Frontend mapping of ModelTier (used internally)
export interface UserCredits {
  modelTier: ModelTier;
  creditsRemaining: number;
  creditsTotal: number;
}

// Model mapping from API model names to internal tier
export const MODEL_TIER_MAP: Record<string, ModelTier> = {
  'gpt-image-1-mini-low': 'gpt_mini_low',
  kontext: 'kontext',
  'gpt-image-1-mini-high': 'gpt_mini_high',
  'flux-schnell': 'flux_schnell',
};

// Mapping from backend ModelTier enum strings to internal ModelTier
export const BACKEND_TIER_MAP: Record<string, ModelTier> = {
  GptMiniLow: 'gpt_mini_low',
  Kontext: 'kontext',
  GptMiniHigh: 'gpt_mini_high',
  FluxSchnell: 'flux_schnell',
};

// Reverse mapping
export const MODEL_DISPLAY_MAP: Record<ModelTier, string> = {
  gpt_mini_low: 'gpt-image-1-mini-low',
  kontext: 'kontext',
  gpt_mini_high: 'gpt-image-1-mini-high',
  flux_schnell: 'flux-schnell',
};

// Credit information per model tier
export interface CreditInfo {
  modelTier: ModelTier;
  displayName: string;
  description: string;
  creditsPerImage: number;
  freeTierCredits: number | 'unlimited';
  color: string;
}

export const CREDIT_INFO: CreditInfo[] = [
  {
    modelTier: 'flux_schnell',
    displayName: 'Flux Schnell',
    description: 'Text-to-image generation (Budget tier)',
    creditsPerImage: 0,
    freeTierCredits: 'unlimited',
    color: '#10b981', // green
  },
  {
    modelTier: 'gpt_mini_low',
    displayName: 'GPT Image Mini (Low)',
    description: 'Image editing - Cheapest option',
    creditsPerImage: 1,
    freeTierCredits: 5,
    color: '#3b82f6', // blue
  },
  {
    modelTier: 'kontext',
    displayName: 'Kontext (FLUX.1)',
    description: 'Image editing - Standard quality',
    creditsPerImage: 1,
    freeTierCredits: 3,
    color: '#8b5cf6', // purple
  },
  {
    modelTier: 'gpt_mini_high',
    displayName: 'GPT Image Mini (High)',
    description: 'Image editing - Premium quality',
    creditsPerImage: 1,
    freeTierCredits: 1,
    color: '#f59e0b', // amber
  },
];

// Error response for insufficient credits (from backend)
export interface InsufficientCreditsError {
  code: 'INSUFFICIENT_CREDITS';
  message: string;
  modelTier: string;
  creditsRemaining: number;
  creditsRequired: number;
}

// Helper to check if user is admin based on subscription tier
export function isAdminFromTier(subscriptionTier: string): boolean {
  return subscriptionTier === 'Unlimited';
}
