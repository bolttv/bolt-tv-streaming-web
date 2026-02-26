import { NextRequest, NextResponse } from "next/server";

const CLEENG_SANDBOX = process.env.CLEENG_SANDBOX === "true";
const CLEENG_CORE_API_URL = CLEENG_SANDBOX
  ? "https://api.sandbox.cleeng.com"
  : "https://api.cleeng.com";
const CLEENG_API_SECRET = process.env.CLEENG_API_SECRET || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { offerId } = body;

    if (!offerId) {
      return NextResponse.json({ error: "Offer ID is required" }, { status: 400 });
    }

    if (!CLEENG_API_SECRET) {
      return NextResponse.json({ error: "Cleeng API not configured" }, { status: 500 });
    }

    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";

    console.log("Tax calculation request - offerId:", offerId, "clientIp:", clientIp);

    const response = await fetch(`${CLEENG_CORE_API_URL}/3.0/json-rpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: "getOfferDetails",
        params: {
          publisherToken: CLEENG_API_SECRET,
          offerId: offerId,
          customerIP: clientIp,
        },
        jsonrpc: "2.0",
        id: 1,
      }),
    });

    const data = await response.json();
    console.log("Cleeng tax/offer response: received");

    if (data.error) {
      return NextResponse.json(
        { error: data.error.message || "Failed to get offer details" },
        { status: 400 }
      );
    }

    const result = data.result;
    if (result) {
      const priceExclTax = result.customerPriceExclTax ?? result.offerPrice ?? 0;
      const priceInclTax = result.customerPriceInclTax ?? result.offerPrice ?? 0;
      const taxAmount = priceInclTax - priceExclTax;
      const taxRate = result.taxRate ?? 0;

      return NextResponse.json({
        taxRate,
        taxAmount: Math.max(0, parseFloat(taxAmount.toFixed(2))),
        priceExclTax: parseFloat(priceExclTax.toFixed(2)),
        priceInclTax: parseFloat(priceInclTax.toFixed(2)),
        currency: result.customerCurrency || result.offerCurrency || "USD",
      });
    } else {
      return NextResponse.json({ error: "No offer details returned" }, { status: 400 });
    }
  } catch (error) {
    console.error("Tax calculation error:", error);
    return NextResponse.json({ error: "Failed to calculate tax" }, { status: 500 });
  }
}
