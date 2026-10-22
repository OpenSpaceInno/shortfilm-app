/**
 * Subscription & Payment Client
 * Communicates with backend SubscriptionsModule (M21, M22, M23)
 * via unified typed subscriptionsApi client.
 */

import { subscriptionsApi } from '@/lib/api-client';

const USER_SUB_KEY = 'shortreel_client_user_sub';

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  tier: 'FREE' | 'VIP' | 'STUDENT' | 'LIFETIME';
  description: string;
  priceMonthly: number;
  priceAnnually: number | null;
  currency: string;
  billingInterval: 'FREE' | 'MONTHLY' | 'ANNUAL';
  trialDays: number;
  features: string[];
  entitlementMatrix?: Record<string, any>;
  isActive: boolean;
  isPopular?: boolean;
}

export interface CheckoutSession {
  checkoutUrl?: string;
  sessionId?: string;
  orderId?: string;
  provider: 'RAZORPAY' | 'STRIPE' | 'MOCK' | 'MANUAL';
  subscriptionId: string;
  status: string;
  planName: string;
  amount: number;
  currency: string;
  billingInterval: string;
  metadata?: Record<string, any>;
}

export interface CurrentSubscription {
  isVip: boolean;
  status: string;
  tier: string;
  planName: string;
  subscriptionId: string;
  billingInterval: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  gracePeriodEnd?: string | null;
  isCancelled: boolean;
  entitlements: Array<{
    code: string;
    source: string;
    expiresAt?: string;
    isActive: boolean;
  }>;
}

/**
 * Returns a stable dev user identity token stored in localStorage
 */
export function getOrCreateDevUserSub(): string {
  try {
    let sub = localStorage.getItem(USER_SUB_KEY);
    if (!sub) {
      sub = `dev_user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(USER_SUB_KEY, sub);
    }
    return sub;
  } catch {
    return 'dev_user_guest_fallback';
  }
}

/**
 * Fetches active subscription plans catalog from the backend API.
 */
export async function fetchPlans(): Promise<SubscriptionPlan[]> {
  try {
    const res = await subscriptionsApi.getPlans();
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  } catch (err) {
    console.warn('[SubscriptionAPI] Failed to fetch plans from backend, falling back to catalog:', err);
    return [];
  }
}

/**
 * Gets the current active user subscription and entitlement profile.
 */
export async function getCurrentSubscription(): Promise<CurrentSubscription | null> {
  try {
    const res = await subscriptionsApi.getCurrentSubscription();
    return res.success ? res.data : null;
  } catch (err) {
    console.warn('[SubscriptionAPI] Failed to fetch current subscription:', err);
    return null;
  }
}

/**
 * Initiates a subscription checkout session on the backend.
 */
export async function initiateCheckout(
  planId: string,
  provider: 'RAZORPAY' | 'STRIPE' | 'MOCK' = 'MOCK',
  billingInterval: 'MONTHLY' | 'ANNUAL' = 'MONTHLY',
): Promise<CheckoutSession> {
  const returnUrl = typeof window !== 'undefined' ? `${window.location.origin}/plans` : undefined;
  const res = await subscriptionsApi.initiateCheckout({
    planId,
    provider,
    billingInterval,
    ...(returnUrl ? { returnUrl } : {}),
  });

  if (!res.success) {
    const msg = Array.isArray(res.error?.message)
      ? res.error.message.join(', ')
      : res.error?.message || 'Checkout failed';
    throw new Error(msg);
  }

  return res.data;
}

/**
 * Verifies gateway checkout payment and provisions VIP entitlements in the database.
 */
export async function verifyCheckout(
  subscriptionId: string,
  orderId?: string,
  paymentId?: string,
  signature?: string,
  provider: 'RAZORPAY' | 'STRIPE' | 'MOCK' = 'MOCK',
): Promise<{ verified: boolean; subscription: any }> {
  const res = await subscriptionsApi.verifyPayment({
    subscriptionId,
    orderId: orderId || `order_${Date.now()}`,
    paymentId: paymentId || `pay_${Date.now()}`,
    signature: signature || 'sig_verified',
    provider,
  });

  if (!res.success) {
    const msg = Array.isArray(res.error?.message)
      ? res.error.message.join(', ')
      : res.error?.message || 'Payment verification failed';
    throw new Error(msg);
  }

  return {
    verified: true,
    subscription: res.data?.subscription || res.data,
  };
}

/**
 * Cancels recurring VIP auto-renewal while keeping access active until period end.
 */
export async function cancelSubscription(reason?: string): Promise<{ success: boolean; message: string }> {
  const res = await subscriptionsApi.cancelSubscription();

  if (!res.success) {
    const msg = Array.isArray(res.error?.message)
      ? res.error.message.join(', ')
      : res.error?.message || 'Cancellation failed';
    throw new Error(msg);
  }

  return {
    success: true,
    message: 'Subscription cancelled successfully.',
  };
}
