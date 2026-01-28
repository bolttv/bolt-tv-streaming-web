import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";

interface CleengCustomer {
  id: string;
  email: string;
  jwt?: string;
  refreshToken?: string;
}

const CLEENG_CUSTOMER_KEY = "cleeng_customer";

export function useAuth() {
  const auth0 = useAuth0();
  const [cleengCustomer, setCleengCustomer] = useState<CleengCustomer | null>(() => {
    try {
      const stored = localStorage.getItem(CLEENG_CUSTOMER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLinking, setIsLinking] = useState(false);

  useEffect(() => {
    async function linkToCleeng() {
      if (auth0.isAuthenticated && auth0.user?.email && !cleengCustomer) {
        setIsLinking(true);
        try {
          const response = await fetch("/api/cleeng/sso-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: auth0.user.email,
              auth0Id: auth0.user.sub,
            }),
          });

          const data = await response.json();
          
          if (data.responseData) {
            const customer: CleengCustomer = {
              id: data.responseData.customerId || data.responseData.id,
              email: auth0.user.email,
              jwt: data.responseData.jwt,
              refreshToken: data.responseData.refreshToken,
            };
            localStorage.setItem(CLEENG_CUSTOMER_KEY, JSON.stringify(customer));
            setCleengCustomer(customer);
          }
        } catch (error) {
          console.error("Failed to link Auth0 to Cleeng:", error);
        } finally {
          setIsLinking(false);
        }
      }
    }

    linkToCleeng();
  }, [auth0.isAuthenticated, auth0.user?.email, auth0.user?.sub, cleengCustomer]);

  useEffect(() => {
    if (!auth0.isAuthenticated && cleengCustomer) {
      localStorage.removeItem(CLEENG_CUSTOMER_KEY);
      setCleengCustomer(null);
    }
  }, [auth0.isAuthenticated, cleengCustomer]);

  return {
    ...auth0,
    cleengCustomer,
    isLinking,
    isFullyAuthenticated: auth0.isAuthenticated && !!cleengCustomer,
  };
}

export function getCleengCustomer(): CleengCustomer | null {
  try {
    const stored = localStorage.getItem(CLEENG_CUSTOMER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}
