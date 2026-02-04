#!/usr/bin/env npx tsx

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;

if (!SUPABASE_ACCESS_TOKEN || !PROJECT_REF) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const SITE_URL = "https://bolt-tv.replit.app";

async function updateSiteUrl() {
  console.log(`Updating Supabase Site URL to: ${SITE_URL}`);
  
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;
  
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      site_url: SITE_URL,
      uri_allow_list: [
        SITE_URL,
        `${SITE_URL}/*`,
        "https://*.replit.dev",
        "https://*.replit.dev/*",
        "https://*.replit.app",
        "https://*.replit.app/*"
      ].join(","),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to update Site URL:", response.status, error);
    process.exit(1);
  }

  console.log("Site URL updated successfully!");
  console.log("Redirect URLs whitelist updated!");
}

updateSiteUrl().catch(console.error);
