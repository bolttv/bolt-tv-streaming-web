import { NextRequest, NextResponse } from "next/server";

const CLEENG_SANDBOX = process.env.CLEENG_SANDBOX === "true";
const CLEENG_CORE_API_URL = CLEENG_SANDBOX
  ? "https://api.sandbox.cleeng.com"
  : "https://api.cleeng.com";
const CLEENG_API_SECRET = process.env.CLEENG_API_SECRET || "";

export async function POST(request: NextRequest) {
  try {
    if (!CLEENG_API_SECRET) {
      return NextResponse.json({ error: "Cleeng API not configured" }, { status: 500 });
    }

    const host = request.headers.get("host") || "";
    const publicDomain = process.env.VERCEL_URL || process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS?.split(",")[0] || host;
    const webhookUrl = `https://${publicDomain}/api/cleeng/webhook`;
    console.log("Registering Cleeng webhook URL:", webhookUrl);

    const topics = [
      "transactionCreated",
      "subscriptionRenewed",
      "subscriptionSwitched",
      "subscriptionCanceled",
      "subscriptionTerminated",
    ];
    const results = [];

    for (const topic of topics) {
      const response = await fetch(
        `${CLEENG_CORE_API_URL}/3.1/webhook_subscriptions/${topic}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Publisher-Token": CLEENG_API_SECRET,
          },
          body: JSON.stringify([{ url: webhookUrl }]),
        }
      );

      const data = await response.json();
      results.push({ topic, status: response.status, data });
      console.log(`Registered webhook for ${topic}:`, data);
    }

    return NextResponse.json({ success: true, webhookUrl, results });
  } catch (error) {
    console.error("Error registering webhooks:", error);
    return NextResponse.json({ error: "Failed to register webhooks" }, { status: 500 });
  }
}
