import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

const CLEENG_SANDBOX = process.env.CLEENG_SANDBOX === "true";
const CLEENG_MEDIASTORE_URL = CLEENG_SANDBOX
  ? "https://mediastoreapi-sandbox.cleeng.com"
  : "https://mediastoreapi.cleeng.com";
const CLEENG_CORE_API_URL = CLEENG_SANDBOX
  ? "https://api.sandbox.cleeng.com"
  : "https://api.cleeng.com";
const CLEENG_PUBLISHER_ID = process.env.CLEENG_PUBLISHER_ID || "";
const CLEENG_API_SECRET = process.env.CLEENG_API_SECRET || "";

const extractCustomerIdFromJwt = (jwt: string): string | null => {
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3) return null;
    const decoded = Buffer.from(parts[1], "base64url").toString("utf-8");
    const data = JSON.parse(decoded);
    return String(data.customerId || data.cid || data.sub || data.customer_id || "");
  } catch {
    return null;
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, externalId, firstName, lastName } = body;

    if (!email) {
      return NextResponse.json({ errors: ["Email is required"] }, { status: 400 });
    }

    if (!CLEENG_API_SECRET || !CLEENG_PUBLISHER_ID) {
      return NextResponse.json({ errors: ["Cleeng not configured"] }, { status: 500 });
    }

    console.log("Cleeng SSO request received");

    const tokenResponse = await fetch(`${CLEENG_CORE_API_URL}/3.0/json-rpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: "generateCustomerToken",
        params: {
          publisherToken: CLEENG_API_SECRET,
          customerEmail: email,
        },
        jsonrpc: "2.0",
        id: 1,
      }),
    });
    const tokenData = await tokenResponse.json();

    if (tokenData.result?.token) {
      const customerId = tokenData.result.customerId;
      console.log("Existing Cleeng customer found, token generated");

      const jwt = tokenData.result.token;
      const extractedId = extractCustomerIdFromJwt(jwt) || String(customerId);

      if (supabaseAdmin && customerId) {
        await supabaseAdmin
          .from("profiles")
          .update({ cleeng_customer_id: String(customerId) })
          .eq("email", email);
      }

      return NextResponse.json({
        jwt,
        refreshToken: tokenData.result.refreshToken || "",
        customerId: extractedId,
        email,
      });
    }

    const registrationPassword = `CL_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}!A1`;

    const customerData: Record<string, string> = {
      email,
      password: registrationPassword,
      locale: "en_US",
      country: "US",
      currency: "USD",
      externalId: externalId || email,
    };
    if (firstName) customerData.firstName = firstName;
    if (lastName) customerData.lastName = lastName;

    const registerResponse = await fetch(`${CLEENG_CORE_API_URL}/3.0/json-rpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: "registerCustomer",
        params: { publisherToken: CLEENG_API_SECRET, customerData },
        jsonrpc: "2.0",
        id: 1,
      }),
    });
    const registerData = await registerResponse.json();
    console.log("Cleeng registration response received");

    const customerExists =
      registerData.error?.message?.includes("already") ||
      registerData.error?.message?.includes("exists") ||
      registerData.error?.code === 13;

    if (registerData.result || customerExists) {
      const retryTokenResponse = await fetch(`${CLEENG_CORE_API_URL}/3.0/json-rpc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "generateCustomerToken",
          params: {
            publisherToken: CLEENG_API_SECRET,
            customerEmail: email,
          },
          jsonrpc: "2.0",
          id: 1,
        }),
      });
      const retryTokenData = await retryTokenResponse.json();

      if (retryTokenData.result?.token) {
        const customerId = retryTokenData.result.customerId;
        const jwt = retryTokenData.result.token;
        const extractedId = extractCustomerIdFromJwt(jwt) || String(customerId);

        if (supabaseAdmin && customerId) {
          await supabaseAdmin
            .from("profiles")
            .update({ cleeng_customer_id: String(customerId) })
            .eq("email", email);
        }

        return NextResponse.json({
          jwt,
          refreshToken: retryTokenData.result.refreshToken || "",
          customerId: extractedId,
          email,
        });
      }

      if (registerData.result) {
        const loginResponse = await fetch(`${CLEENG_MEDIASTORE_URL}/auths`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: registrationPassword, publisherId: CLEENG_PUBLISHER_ID }),
        });
        const loginData = await loginResponse.json();
        const jwt = loginData.responseData?.jwt || loginData.jwt;

        if (jwt) {
          const customerId = extractCustomerIdFromJwt(jwt) || loginData.responseData?.customerId;
          if (supabaseAdmin && customerId) {
            await supabaseAdmin
              .from("profiles")
              .update({ cleeng_customer_id: String(customerId) })
              .eq("email", email);
          }
          return NextResponse.json({
            jwt,
            refreshToken: loginData.responseData?.refreshToken || loginData.refreshToken || "",
            customerId: customerId || email,
            email,
          });
        }
      }

      return NextResponse.json(
        { errors: ["Failed to authenticate with payment system. Please try again."] },
        { status: 400 }
      );
    }

    console.error("Cleeng registration error:", registerData);
    return NextResponse.json(
      { errors: [registerData.error?.message || "Registration with payment system failed"] },
      { status: 400 }
    );
  } catch (error) {
    console.error("Cleeng SSO error:", error);
    return NextResponse.json({ errors: ["Payment system login failed"] }, { status: 500 });
  }
}
