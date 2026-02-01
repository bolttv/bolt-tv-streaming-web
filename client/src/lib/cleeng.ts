export interface CleengOffer {
  id: string;
  offerId: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  period?: string;
  periodUnit?: string;
  freePeriods?: number;
  active?: boolean;
  tags?: string[];
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
    return data.map((offer: any) => ({
      id: offer.id || offer.offerId,
      offerId: offer.offerId || offer.id,
      title: offer.title || offer.offerTitle,
      description: offer.description,
      price: offer.price || 0,
      currency: offer.currency || "USD",
      period: offer.period,
      periodUnit: offer.periodUnit,
      active: offer.active,
      tags: offer.tags || [],
    }));
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
