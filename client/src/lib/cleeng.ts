export interface CleengCustomer {
  id: string;
  email: string;
  locale: string;
  country: string;
  currency: string;
  firstName?: string;
  lastName?: string;
}

export interface CleengAuthResponse {
  responseData: {
    jwt: string;
    refreshToken: string;
    customerId?: string;
  };
  errors: string[];
}

export interface CleengCustomerResponse {
  responseData: CleengCustomer & {
    jwt: string;
    refreshToken: string;
  };
  errors: string[];
}

export interface CleengOffer {
  offerId: string;
  offerTitle: string;
  offerDescription?: string;
  price: number;
  currency: string;
  period?: string;
  freePeriods?: number;
}

const CLEENG_AUTH_KEY = "cleeng_auth";
const AUTH_CHANGE_EVENT = "cleeng_auth_change";

export function saveCleengAuth(jwt: string, refreshToken: string, customer: CleengCustomer) {
  localStorage.setItem(CLEENG_AUTH_KEY, JSON.stringify({ jwt, refreshToken, customer }));
  window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT));
}

export function getCleengAuth(): { jwt: string; refreshToken: string; customer: CleengCustomer } | null {
  const stored = localStorage.getItem(CLEENG_AUTH_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function clearCleengAuth() {
  localStorage.removeItem(CLEENG_AUTH_KEY);
  window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT));
}

export function isLoggedIn(): boolean {
  return getCleengAuth() !== null;
}

export function onAuthChange(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(AUTH_CHANGE_EVENT, handler);
  return () => window.removeEventListener(AUTH_CHANGE_EVENT, handler);
}

export async function registerCustomer(email: string, password: string): Promise<CleengCustomerResponse> {
  const response = await fetch("/api/cleeng/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
}

export async function loginCustomer(email: string, password: string): Promise<CleengAuthResponse> {
  const response = await fetch("/api/cleeng/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
}

export async function getCustomerSubscriptions(customerId: string, jwt: string) {
  const response = await fetch(`/api/cleeng/subscriptions/${customerId}`, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${jwt}`,
    },
  });
  return response.json();
}

export async function getOffers(): Promise<{ responseData: { items: CleengOffer[] }; errors: string[] }> {
  const response = await fetch("/api/cleeng/offers");
  return response.json();
}
