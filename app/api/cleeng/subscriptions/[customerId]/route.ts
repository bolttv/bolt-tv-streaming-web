import { NextRequest, NextResponse } from "next/server";

const CLEENG_SANDBOX = process.env.CLEENG_SANDBOX === "true";
const CLEENG_MEDIASTORE_URL = CLEENG_SANDBOX
  ? "https://mediastoreapi-sandbox.cleeng.com"
  : "https://mediastoreapi.cleeng.com";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params;
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(
      `${CLEENG_MEDIASTORE_URL}/customers/${customerId}/subscriptions`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Cleeng subscriptions error:", error);
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
  }
}
