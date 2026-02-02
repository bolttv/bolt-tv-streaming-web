import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { ssoLogin, saveCleengCustomer, getCleengCustomer, clearCleengCustomer, CleengCustomer } from "./cleeng";

export function useAuth() {
  const auth0 = useAuth0();
  const [cleengCustomer, setCleengCustomer] = useState<CleengCustomer | null>(() => getCleengCustomer());
  const [isLinking, setIsLinking] = useState(false);

  useEffect(() => {
    async function linkToCleeng() {
      if (auth0.isAuthenticated && auth0.user?.email && !cleengCustomer) {
        setIsLinking(true);
        try {
          const response = await ssoLogin(auth0.user.email, auth0.user.sub);
          
          // Response now returns jwt, customerId, email at top level
          if (response.jwt) {
            const customer: CleengCustomer = {
              id: response.customerId || response.email || auth0.user.email,
              email: response.email || auth0.user.email,
              jwt: response.jwt,
              refreshToken: response.refreshToken,
            };
            saveCleengCustomer(customer);
            setCleengCustomer(customer);
          } else if (response.errors) {
            console.error("Cleeng SSO error:", response.errors);
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
