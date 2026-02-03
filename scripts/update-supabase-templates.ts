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
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #1a1a1a; margin-bottom: 16px;">Sign in to Bolt TV</h2>

  <p style="color: #333; font-size: 16px; margin-bottom: 24px;">
    Click the button below to sign in to your account. This link will expire in 60 minutes.
  </p>

  <div style="text-align: center; margin: 32px 0;">
    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
      Sign in to Bolt TV
    </a>
  </div>

  <p style="color: #666; font-size: 14px; margin-top: 24px;">
    If the button doesn't work, copy and paste this link into your browser:
  </p>
  <p style="color: #7c3aed; font-size: 12px; word-break: break-all;">
    {{ .ConfirmationURL }}
  </p>

  <p style="color: #999; font-size: 12px; margin-top: 24px;">
    If you didn't request this email, you can safely ignore it.
  </p>
</div>
`.trim();

const confirmationTemplate = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #1a1a1a; margin-bottom: 16px;">Confirm your Bolt TV account</h2>

  <p style="color: #333; font-size: 16px; margin-bottom: 24px;">
    Click the button below to confirm your email address and complete your registration.
  </p>

  <div style="text-align: center; margin: 32px 0;">
    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
      Confirm Email
    </a>
  </div>

  <p style="color: #666; font-size: 14px; margin-top: 24px;">
    If the button doesn't work, copy and paste this link into your browser:
  </p>
  <p style="color: #7c3aed; font-size: 12px; word-break: break-all;">
    {{ .ConfirmationURL }}
  </p>

  <p style="color: #999; font-size: 12px; margin-top: 24px;">
    If you didn't request this email, you can safely ignore it.
  </p>
</div>
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
      mailer_subjects_magic_link: "Sign in to Bolt TV",
      mailer_templates_magic_link_content: magicLinkTemplate,
      mailer_subjects_confirmation: "Confirm your Bolt TV account",
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
