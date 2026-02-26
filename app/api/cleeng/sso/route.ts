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
    const payload = parts[1];
    const decoded = Buffer.from(payload, "base64url").toString("utf-8");
    const data = JSON.parse(decoded);
    const customerId = data.customerId || data.cid || data.sub || data.customer_id;
    console.log("Decoded JWT - customerId:", customerId || "not found");
    return customerId ? String(customerId) : null;
  } catch (error) {
    console.error("Error decoding JWT:", error);
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

    console.log("Cleeng SSO request for email:", email, "firstName:", firstName, "lastName:", lastName);

    const generatePassword = () =>
      `CL_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}!A1`;

    const getStoredPassword = async (): Promise<string | null> => {
      if (!supabaseAdmin) return null;
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("cleeng_password")
        .eq("email", email)
        .maybeSingle();
      return data?.cleeng_password || null;
    };

    const storePassword = async (password: string) => {
      if (!supabaseAdmin) {
        console.log("No supabaseAdmin client, cannot store password");
        return;
      }
      await supabaseAdmin
        .from("profiles")
        .update({ cleeng_password: password })
        .eq("email", email);
    };

    const loginWithMediaStore = async (password: string) => {
      const loginResponse = await fetch(`${CLEENG_MEDIASTORE_URL}/auths`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          publisherId: CLEENG_PUBLISHER_ID,
        }),
      });
      return loginResponse.json();
    };

    const storedPassword = await getStoredPassword();

    const extractJwtFromLogin = (loginData: any) => {
      const jwt = loginData.responseData?.jwt || loginData.jwt;
      const refreshToken = loginData.responseData?.refreshToken || loginData.refreshToken;
      const rawCustomerId = loginData.responseData?.customerId || loginData.customerId;
      if (!jwt) return null;
      const extractedCustomerId = extractCustomerIdFromJwt(jwt);
      return { jwt, refreshToken, customerId: extractedCustomerId || rawCustomerId };
    };

    if (storedPassword) {
      console.log("Found stored Cleeng password, attempting MediaStore login...");
      const loginData = await loginWithMediaStore(storedPassword);
      console.log("Cleeng MediaStore login response: received");

      const result = extractJwtFromLogin(loginData);
      if (result) {
        console.log("Cleeng customer ID from MediaStore login:", result.customerId);
        return NextResponse.json({ ...result, email });
      }
      console.log("Stored password login failed, will try re-registering...");
    }

    const newPassword = generatePassword();

    const customerData: any = {
      email,
      password: newPassword,
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
        params: {
          publisherToken: CLEENG_API_SECRET,
          customerData,
        },
        jsonrpc: "2.0",
        id: 1,
      }),
    });

    const registerData = await registerResponse.json();
    console.log("Cleeng Core API register response: received");

    const customerExists =
      registerData.error?.message?.includes("already") ||
      registerData.error?.message?.includes("exists") ||
      registerData.error?.code === 13;

    if (registerData.result || customerExists) {
      if (registerData.result) {
        await storePassword(newPassword);
        console.log("New customer registered, password stored. Logging in via MediaStore...");
      }

      if (!customerExists) {
        const loginData = await loginWithMediaStore(newPassword);
        console.log("Cleeng MediaStore login (new customer):", JSON.stringify(loginData, null, 2));

        const result = extractJwtFromLogin(loginData);
        if (result) {
          console.log("Cleeng customer ID from MediaStore login:", result.customerId);
          return NextResponse.json({ ...result, email });
        }
      }

      console.log("Customer exists, updating password via Core API 3.1...");

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
      const cleengCustomerId = tokenData.result?.customerId;
      console.log("Cleeng customer ID for password update:", cleengCustomerId);

      if (cleengCustomerId) {
        const updateResponse = await fetch(
          `${CLEENG_CORE_API_URL}/3.1/customers/${cleengCustomerId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "X-Publisher-Token": CLEENG_API_SECRET,
            },
            body: JSON.stringify({ password: newPassword }),
          }
        );

        const updateData = await updateResponse.json();
        console.log("Cleeng password update response: received");

        if (updateData.success) {
          await storePassword(newPassword);

          const loginData = await loginWithMediaStore(newPassword);
          console.log("Cleeng MediaStore login after password update: received");

          const result = extractJwtFromLogin(loginData);
          if (result) {
            console.log("Cleeng customer ID from login:", result.customerId);
            return NextResponse.json({ ...result, email });
          }
        }
      }

      console.error("Password update + login failed for existing customer");
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
