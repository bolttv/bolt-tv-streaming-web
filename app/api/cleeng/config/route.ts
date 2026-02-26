import { NextResponse } from "next/server";

const CLEENG_SANDBOX = process.env.CLEENG_SANDBOX === "true";
const CLEENG_PUBLISHER_ID = process.env.CLEENG_PUBLISHER_ID || "";

export async function GET() {
  return NextResponse.json({
    publisherId: CLEENG_PUBLISHER_ID,
    environment: CLEENG_SANDBOX ? "sandbox" : "production",
  });
}
