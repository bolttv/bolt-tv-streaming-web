import { NextResponse } from "next/server";

const CLEENG_SANDBOX = process.env.CLEENG_SANDBOX === "true";
const CLEENG_CORE_API_URL = CLEENG_SANDBOX
  ? "https://api.sandbox.cleeng.com"
  : "https://api.cleeng.com";
const CLEENG_API_SECRET = process.env.CLEENG_API_SECRET || "";

export async function GET() {
  try {
    if (!CLEENG_API_SECRET) {
      return NextResponse.json({ error: "Cleeng API not configured" }, { status: 500 });
    }

    const apiUrl = `${CLEENG_CORE_API_URL}/3.1/offers?active=true`;
    console.log(`Cleeng offers request to ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Publisher-Token": CLEENG_API_SECRET,
      },
    });

    const data = await response.json();
    console.log("Cleeng offers response: received", Array.isArray(data) ? data.length : (data?.items?.length || 0), "items");

    if (!response.ok) {
      console.error("Cleeng offers error:", data);
      return NextResponse.json(
        { error: data.message || "Failed to fetch offers" },
        { status: response.status }
      );
    }

    const offers = data.items || data.responseData?.items || data || [];
    return NextResponse.json(Array.isArray(offers) ? offers : []);
  } catch (error) {
    console.error("Cleeng offers error:", error);
    return NextResponse.json({ error: "Failed to fetch offers" }, { status: 500 });
  }
}
