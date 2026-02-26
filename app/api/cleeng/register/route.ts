import { NextRequest, NextResponse } from "next/server";

const CLEENG_SANDBOX = process.env.CLEENG_SANDBOX === "true";
const CLEENG_MEDIASTORE_URL = CLEENG_SANDBOX
  ? "https://mediastoreapi-sandbox.cleeng.com"
  : "https://mediastoreapi.cleeng.com";
const CLEENG_PUBLISHER_ID = process.env.CLEENG_PUBLISHER_ID || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, locale = "en_US", country = "US", currency = "USD" } = body;

    if (!email || !password) {
      return NextResponse.json({ errors: ["Email and password are required"] }, { status: 400 });
    }

    const response = await fetch(`${CLEENG_MEDIASTORE_URL}/customers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        locale,
        country,
        currency,
        publisherId: CLEENG_PUBLISHER_ID,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Cleeng registration error:", error);
    return NextResponse.json({ errors: ["Registration failed"] }, { status: 500 });
  }
}
