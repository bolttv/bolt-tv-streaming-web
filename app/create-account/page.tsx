"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreateAccount() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/subscribe");
  }, [router]);

  return null;
}
