import { useEffect, useState, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { ssoLogin, saveCleengCustomer, getCleengCustomer, clearCleengCustomer, CleengCustomer } from "./cleeng";

export function useAuth() {
  const auth0 = useAuth0();
  const [cleengCustomer, setCleengCustomer] = useState<CleengCustomer | null>(() => getCleengCustomer());
  const [isLinking, setIsLinking] = useState(false);
  const [linkAttempted, setLinkAttempted] = useState(false);

  const linkToCleeng = useCallback(async () => {
    if (!auth0.isAuthenticated || !auth0.user?.email || auth0.isLoading) {
      return;
    }

    // Check if we already have a valid Cleeng customer
    const existingCustomer = getCleengCustomer();
    if (existingCustomer?.jwt && existingCustomer?.email === auth0.user.email) {
      if (!cleengCustomer) {
        setCleengCustomer(existingCustomer);
      }
      return;
    }

    setIsLinking(true);
    try {
      console.log("Linking Auth0 to Cleeng for:", auth0.user.email);
      const response = await ssoLogin(auth0.user.email, auth0.user.sub);
      
      if (response.jwt) {
        const customer: CleengCustomer = {
          id: response.customerId || response.email || auth0.user.email,
          email: response.email || auth0.user.email,
          jwt: response.jwt,
          refreshToken: response.refreshToken,
        };
        saveCleengCustomer(customer);
        setCleengCustomer(customer);
        console.log("Cleeng customer linked successfully");
      } else if (response.errors) {
        console.error("Cleeng SSO error:", response.errors);
      }
    } catch (error) {
      console.error("Failed to link Auth0 to Cleeng:", error);
    } finally {
      setIsLinking(false);
      setLinkAttempted(true);
    }
  }, [auth0.isAuthenticated, auth0.user?.email, auth0.user?.sub, auth0.isLoading, cleengCustomer]);

  useEffect(() => {
    if (auth0.isAuthenticated && !auth0.isLoading && !cleengCustomer && !isLinking && !linkAttempted) {
      linkToCleeng();
    }
  }, [auth0.isAuthenticated, auth0.isLoading, cleengCustomer, isLinking, linkAttempted, linkToCleeng]);

  useEffect(() => {
    if (!auth0.isAuthenticated && cleengCustomer) {
      clearCleengCustomer();
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

export { getCleengCustomer };
