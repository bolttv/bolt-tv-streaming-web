#!/bin/bash
export NEXT_TELEMETRY_DISABLED=1

if [ ! -d ".next" ]; then
  echo "No build found. Run: NODE_OPTIONS='--max-old-space-size=2048' npx next build"
  exit 1
fi

echo "Starting production server..."
exec node server.mjs
