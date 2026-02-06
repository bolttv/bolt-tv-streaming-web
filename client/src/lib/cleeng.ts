/**
 * Cleeng Client — calls Supabase Edge Functions
 *
 * Replaces:
 *   GET  /api/cleeng/config               → Edge Function: cleeng-config
 *   GET  /api/cleeng/offers               → Edge Function: cleeng-offers
 *   POST /api/cleeng/sso                  → Edge Function: cleeng-sso
 *   POST /api/cleeng/checkout             → Edge Function: cleeng-checkout
 *   GET  /api/cleeng/subscriptions/:id    → Edge Function: cleeng-subscriptions
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function edgeFunctionUrl(name: string): string {
  return `${SUPABASE_URL}/functions/v1/${name}`;
}

/** Standard headers for Edge Function calls */
function edgeHeaders(extraHeaders?: Record<string, string>): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    ...extraHeaders,
  };
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CleengOffer {
  id: string;
  longId: string;
  title: string;
  description?: string;
  price: {
    amount: number;
    currency: string;
    taxIncluded?: boolean;
  };
  type: string;
  active?: boolean;
  tags?: string[];
  freeDays?: number;
  billingCycle?: {
    periodUnit: string;
    amount: number;
  };
}

export interface CleengCustomer {
  id: string;
  email: string;
  jwt?: string;
  refreshToken?: string;
}

export interface CleengConfig {
  publisherId: string;
  environment: "sandbox" | "production";
}

export interface CheckoutResponse {
  checkoutUrl: string;
  offerId: string;
  publisherId: string;
  environment: string;
}

// ─── Local Storage (unchanged) ───────────────────────────────────────────────

const CLEENG_CUSTOMER_KEY = "cleeng_customer";
const AUTH_CHANGE_EVENT = "cleeng_auth_change";

export function saveCleengCustomer(customer: CleengCustomer) {
  localStorage.setItem(CLEENG_CUSTOMER_KEY, JSON.stringify(customer));
  window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT));
}

export function getCleengCustomer(): CleengCustomer | null {
  try {
    const stored = localStorage.getItem(CLEENG_CUSTOMER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function clearCleengCustomer() {
  localStorage.removeItem(CLEENG_CUSTOMER_KEY);
  window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT));
}

export function onAuthChange(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(AUTH_CHANGE_EVENT, handler);
  return () => window.removeEventListener(AUTH_CHANGE_EVENT, handler);
}

// ─── Edge Function Calls ─────────────────────────────────────────────────────

export async function getCleengConfig(): Promise<CleengConfig> {
  const response = await fetch(edgeFunctionUrl("cleeng-config"), {
    headers: edgeHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch Cleeng config");
  return response.json();
}

export async function getOffers(): Promise<CleengOffer[]> {
  const response = await fetch(edgeFunctionUrl("cleeng-offers"), {
    headers: edgeHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch offers");
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function ssoLogin(email: string, externalId?: string) {
  const response = await fetch(edgeFunctionUrl("cleeng-sso"), {
    method: "POST",
    headers: edgeHeaders(),
    body: JSON.stringify({ email, externalId }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Cleeng SSO failed");
  }
  return response.json();
}

export async function getSubscriptions(customerId: string, jwt: string) {
  // Edge Function expects customerId in URL path and Cleeng JWT as Bearer token
  const response = await fetch(`${edgeFunctionUrl("cleeng-subscriptions")}/${customerId}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch subscriptions");
  }
  return response.json();
}

export async function createCheckout(offerId: string, customerJwt: string): Promise<CheckoutResponse> {
  const response = await fetch(edgeFunctionUrl("cleeng-checkout"), {
    method: "POST",
    headers: edgeHeaders(),
    body: JSON.stringify({ offerId, customerJwt }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to create checkout");
  }
  return response.json();
}

// ─── Utility (unchanged) ─────────────────────────────────────────────────────

export function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(price);
}

export function getCleengCheckoutUrl(
  orderId: string | number,
  publisherId: string,
  environment: string
): string {
  const baseUrl =
    environment === "sandbox"
      ? "https://checkout.sandbox.cleeng.com"
      : "https://checkout.cleeng.com";
  return `${baseUrl}/?orderId=${orderId}&publisherId=${publisherId}`;
}

// ─── Legacy Helpers (kept for AuthContext compatibility) ──────────────────────

export async function registerCustomer(email: string, password: string) {
  // Registration is handled by Supabase Auth, not Cleeng directly
  // This is kept for API compatibility but shouldn't be called
  console.warn("registerCustomer() is deprecated — use Supabase Auth signUp");
  return { error: "Use Supabase Auth" };
}

export async function loginCustomer(email: string, password: string) {
  // Login is handled by Supabase Auth, not Cleeng directly
  console.warn("loginCustomer() is deprecated — use Supabase Auth signIn");
  return { error: "Use Supabase Auth" };
}

