import { useAuth0 } from "@auth0/auth0-react";

export function useAuth() {
  const auth0 = useAuth0();

  return {
    ...auth0,
    isFullyAuthenticated: auth0.isAuthenticated,
  };
}
