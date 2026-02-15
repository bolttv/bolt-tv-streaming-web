import { useEffect } from "react";
import { useLocation } from "wouter";

export default function CreateAccount() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation("/subscribe");
  }, [setLocation]);

  return null;
}
