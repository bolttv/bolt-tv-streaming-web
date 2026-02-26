import { NextRequest, NextResponse } from "next/server";

const CLEENG_SANDBOX = process.env.CLEENG_SANDBOX === "true";
const CLEENG_CORE_API_URL = CLEENG_SANDBOX
  ? "https://api.sandbox.cleeng.com"
  : "https://api.cleeng.com";
const CLEENG_API_SECRET = process.env.CLEENG_API_SECRET || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { couponCode, offerId } = body;

    if (!couponCode || !offerId) {
      return NextResponse.json(
        { error: "Coupon code and offer ID are required" },
        { status: 400 }
      );
    }

    console.log("Validating coupon:", couponCode, "for offer:", offerId);

    const response = await fetch(`${CLEENG_CORE_API_URL}/3.0/json-rpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: "getOfferDetails",
        params: {
          publisherToken: CLEENG_API_SECRET,
          offerId: offerId,
          couponCode: couponCode,
        },
        jsonrpc: "2.0",
        id: 1,
      }),
    });

    const data = await response.json();
    console.log("Cleeng coupon/offer response: received");

    if (data.error) {
      const errorMsg = data.error.message || "Invalid promo code";
      return NextResponse.json({ error: errorMsg, valid: false }, { status: 400 });
    }

    const result = data.result;
    if (result) {
      const originalPrice =
        result.customerPriceExclTax ?? result.customerPriceInclTax ?? result.offerPrice;
      const discountedPrice =
        result.discountedCustomerPriceExclTax ?? result.discountedCustomerPriceInclTax;

      if (
        discountedPrice !== undefined &&
        discountedPrice !== null &&
        discountedPrice < originalPrice
      ) {
        const discountPercent =
          originalPrice > 0
            ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
            : 0;
        return NextResponse.json({
          valid: true,
          discount: {
            code: couponCode,
            discountPercent,
            originalPrice,
            discountedPrice,
            currency: result.customerCurrency || result.offerCurrency || "USD",
          },
        });
      } else {
        return NextResponse.json(
          { error: "This promo code is not valid for this offer", valid: false },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json({ error: "Invalid promo code", valid: false }, { status: 400 });
    }
  } catch (error) {
    console.error("Cleeng coupon error:", error);
    return NextResponse.json(
      { error: "Failed to validate promo code", valid: false },
      { status: 500 }
    );
  }
}
