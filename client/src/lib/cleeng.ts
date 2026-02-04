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

const CLEENG_CUSTOMER_KEY = "cleeng_customer";
const AUTH_CHANGE_EVENT = "cleeng_auth_change";

export function saveCleengCustomer(customer: CleengCustomer) {
  localStorage.setItem(CLEENG_CUSTOMER_KEY, JSON.stringify(customer));
  if (customer.jwt) {
    localStorage.setItem("cleeng_jwt", customer.jwt);
  }
  if (customer.refreshToken) {
    localStorage.setItem("cleeng_refresh_token", customer.refreshToken);
  }
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
  localStorage.removeItem("cleeng_jwt");
  localStorage.removeItem("cleeng_refresh_token");
  window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT));
}

export function onAuthChange(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(AUTH_CHANGE_EVENT, handler);
  return () => window.removeEventListener(AUTH_CHANGE_EVENT, handler);
}

export async function getCleengConfig(): Promise<CleengConfig> {
  const response = await fetch("/api/cleeng/config");
  return response.json();
}

export async function getOffers(): Promise<CleengOffer[]> {
  const response = await fetch("/api/cleeng/offers");
  if (!response.ok) {
    throw new Error("Failed to fetch offers");
  }
  const data = await response.json();
  
  if (Array.isArray(data)) {
    return data as CleengOffer[];
  }
  return [];
}

export async function registerCustomer(email: string, password: string) {
  const response = await fetch("/api/cleeng/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
}

export async function loginCustomer(email: string, password: string) {
  const response = await fetch("/api/cleeng/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
}

export async function ssoLogin(email: string, externalId?: string) {
  const response = await fetch("/api/cleeng/sso", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, externalId }),
  });
  return response.json();
}

export async function getSubscriptions(customerId: string, jwt: string) {
  const response = await fetch(`/api/cleeng/subscriptions/${customerId}`, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${jwt}`,
    },
  });
  return response.json();
}

export function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(price);
}

export interface CheckoutResponse {
  checkoutUrl: string;
  offerId: string;
  publisherId: string;
  environment: string;
}

export async function createCheckout(offerId: string, customerJwt: string): Promise<CheckoutResponse> {
  const response = await fetch("/api/cleeng/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ offerId, customerJwt }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to create checkout");
  }
  
  return response.json();
}

export function getCleengCheckoutUrl(orderId: string | number, publisherId: string, environment: string): string {
  const baseUrl = environment === "sandbox" 
    ? "https://checkout.sandbox.cleeng.com"
    : "https://checkout.cleeng.com";
  return `${baseUrl}/?orderId=${orderId}&publisherId=${publisherId}`;
}
