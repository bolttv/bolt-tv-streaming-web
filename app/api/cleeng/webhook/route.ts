import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

const CLEENG_SANDBOX = process.env.CLEENG_SANDBOX === "true";
const CLEENG_CORE_API_URL = CLEENG_SANDBOX
  ? "https://api.sandbox.cleeng.com"
  : "https://api.cleeng.com";
const CLEENG_PUBLISHER_ID = process.env.CLEENG_PUBLISHER_ID || "";
const CLEENG_API_SECRET = process.env.CLEENG_API_SECRET || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { broadcasterId, topic, data } = body;
    console.log("Cleeng webhook received:", { topic, broadcasterId, data: JSON.stringify(data, null, 2) });

    if (broadcasterId && String(broadcasterId) !== CLEENG_PUBLISHER_ID) {
      console.warn("Webhook from unknown publisher:", broadcasterId);
      return NextResponse.json({ received: true });
    }

    if (!supabaseAdmin) {
      console.error("Supabase admin client not configured - cannot sync subscription");
      return NextResponse.json({ received: true, warning: "Supabase not configured" });
    }

    if (topic === "transactionCreated" || topic === "subscriptionRenewed" || topic === "subscriptionSwitched") {
      const customerEmail = data?.customerEmail || data?.email;
      const customerId = data?.customerId;
      const offerId = data?.offerId || data?.offer?.id;
      const period = data?.period || data?.billingPeriod || data?.subscriptionPeriod;

      console.log("Processing subscription event:", { topic, customerEmail, customerId, offerId, period });

      if (customerEmail) {
        let subscriptionTier: "free" | "basic" | "premium" = "basic";
        let billingPeriodValue: "monthly" | "annual" | "none" = "monthly";

        if (offerId && CLEENG_API_SECRET) {
          try {
            const offerResponse = await fetch(`${CLEENG_CORE_API_URL}/3.1/offers/${offerId}`, {
              headers: { "X-Publisher-Token": CLEENG_API_SECRET },
            });
            if (offerResponse.ok) {
              const offerData = await offerResponse.json();
              console.log("Fetched offer details:", JSON.stringify(offerData, null, 2));

              const offerPeriod = offerData.period || offerData.freePeriod || "";
              if (offerPeriod.toLowerCase().includes("year")) {
                billingPeriodValue = "annual";
              } else if (offerPeriod.toLowerCase().includes("month")) {
                billingPeriodValue = "monthly";
              }

              const offerTitle = (offerData.title || "").toLowerCase();
              if (offerTitle.includes("premium") || offerTitle.includes("pro")) {
                subscriptionTier = "premium";
              }
            }
          } catch (offerError) {
            console.error("Error fetching offer details:", offerError);
          }
        }

        if (period && billingPeriodValue === "monthly") {
          const periodLower = String(period).toLowerCase();
          if (
            periodLower.includes("year") ||
            periodLower.includes("annual") ||
            periodLower === "year" ||
            periodLower === "yearly"
          ) {
            billingPeriodValue = "annual";
          }
        }

        if (offerId) {
          const offerIdStr = String(offerId).toLowerCase();
          if (offerIdStr.includes("premium")) {
            subscriptionTier = "premium";
          }
        }

        const { data: profiles, error: findError } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("email", customerEmail);

        if (findError) {
          console.error("Error finding profile by email:", findError);
        } else if (profiles && profiles.length > 0) {
          const profileId = profiles[0].id;

          const { error: updateError } = await supabaseAdmin
            .from("profiles")
            .update({
              subscription_tier: subscriptionTier,
              billing_period: billingPeriodValue,
              cleeng_customer_id: customerId ? String(customerId) : undefined,
              updated_at: new Date().toISOString(),
            })
            .eq("id", profileId);

          if (updateError) {
            console.error("Error updating profile from webhook:", updateError);
          } else {
            console.log(
              `Successfully synced subscription to Supabase: ${customerEmail} -> ${subscriptionTier}/${billingPeriodValue}`
            );
          }
        } else {
          console.log("No Supabase profile found for email:", customerEmail);
        }
      }
    }

    if (topic === "subscriptionCanceled" || topic === "subscriptionTerminated") {
      const customerEmail = data?.customerEmail || data?.email;

      if (customerEmail && supabaseAdmin) {
        const { data: profiles } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("email", customerEmail);

        if (profiles && profiles.length > 0) {
          await supabaseAdmin
            .from("profiles")
            .update({
              subscription_tier: "free",
              billing_period: "none",
              updated_at: new Date().toISOString(),
            })
            .eq("id", profiles[0].id);

          console.log(`Subscription cancelled for ${customerEmail}`);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Cleeng webhook error:", error);
    return NextResponse.json({ received: true, error: "Processing error" });
  }
}
