#!/usr/bin/env npx tsx

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;

if (!SUPABASE_ACCESS_TOKEN || !PROJECT_REF) {
  console.error("Missing required environment variables:");
  console.error("  SUPABASE_ACCESS_TOKEN - Get from https://supabase.com/dashboard/account/tokens");
  console.error("  SUPABASE_PROJECT_REF - Your project reference ID from the Supabase URL");
  process.exit(1);
}

const magicLinkTemplate = `
<h2 style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a;">Your Bolt TV Verification Code</h2>

<p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; font-size: 16px;">
  Enter this code to sign in:
</p>

<div style="background: #f5f5f5; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
  <span style="font-size: 36px; letter-spacing: 8px; font-family: 'SF Mono', Monaco, 'Courier New', monospace; font-weight: bold; color: #000;">{{ .Token }}</span>
</div>

<p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #666; font-size: 14px;">
  This code expires in 60 minutes.
</p>

<p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #999; font-size: 12px;">
  If you didn't request this code, you can safely ignore this email.
</p>
`.trim();

const confirmationTemplate = `
<h2 style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a;">Your Bolt TV Verification Code</h2>

<p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; font-size: 16px;">
  Enter this code to verify your email:
</p>

<div style="background: #f5f5f5; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
  <span style="font-size: 36px; letter-spacing: 8px; font-family: 'SF Mono', Monaco, 'Courier New', monospace; font-weight: bold; color: #000;">{{ .Token }}</span>
</div>

<p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #666; font-size: 14px;">
  This code expires in 60 minutes.
</p>

<p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #999; font-size: 12px;">
  If you didn't request this code, you can safely ignore this email.
</p>
`.trim();

async function updateTemplates() {
  console.log("Updating Supabase email templates...");
  
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;
  
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mailer_subjects_magic_link: "Your Bolt TV Verification Code",
      mailer_templates_magic_link_content: magicLinkTemplate,
      mailer_subjects_confirmation: "Your Bolt TV Verification Code",
      mailer_templates_confirmation_content: confirmationTemplate,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to update templates:", response.status, error);
    process.exit(1);
  }

  const data = await response.json();
  console.log("Email templates updated successfully!");
  console.log("Updated fields:");
  console.log("  - Magic Link subject and template");
  console.log("  - Confirmation subject and template");
}

updateTemplates().catch(console.error);
