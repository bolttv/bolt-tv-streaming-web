# Bolt TV (StreamMax) - Streaming Entertainment Platform

## Overview

Bolt TV is a streaming entertainment platform built with Next.js 15 (App Router). The application features an HBO Max-style UI with a hero carousel, content rows, video playback using JWPlayer, and watch progress tracking. It integrates with JWPlayer's API for video content delivery, Supabase for authentication, Cleeng for subscription management, and PostgreSQL (via Supabase) for persistent storage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Framework
- **Next.js 15** with App Router and Turbopack (dev mode)
- **TypeScript** throughout
- **Production mode**: `next build` then `next start --port 5000`
- **Dev mode**: `next dev --port 5000 --turbopack`

### Frontend Architecture
- **Framework**: React 18 with Next.js App Router
- **Routing**: Next.js file-based routing (`app/` directory)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS v4 with custom dark theme optimized for streaming UI
- **UI Components**: shadcn/ui component library (Radix UI primitives)
- **Carousel**: Embla Carousel for hero banner and content scrolling
- **Client Components**: All pages use `"use client"` directive with dynamic imports (`ssr: false`)

### Backend Architecture
- **API Routes**: Next.js Route Handlers in `app/api/` directory
- **Video Integration**: JWPlayer API for video content and playback
- **Auth**: Supabase Auth with email/password
- **Subscriptions**: Cleeng MediaStore SDK with Adyen payment processing

### Data Storage
- **Database**: PostgreSQL via Supabase client (not Drizzle ORM)
- **Tables**: `watch_history` for video progress tracking, `profiles` for user data
- **Session Storage**: Client-side session ID stored in localStorage

### Key Design Patterns
- **Dynamic Imports**: All pages use `next/dynamic` with `ssr: false` to minimize server compilation memory
- **Client-Side Rendering**: Pages render loading spinners server-side, full content client-side
- **API Layer**: Storage abstraction in `lib/storage.ts` handles data operations
- **Path Aliases**: `@/` maps to project root

### Project Structure
```
app/
├── layout.tsx              # Root layout with providers, fonts, scripts
├── globals.css             # Tailwind CSS v4 global styles
├── page.tsx                # Landing page (/)
├── not-found.tsx           # 404 page
├── login/page.tsx          # Login page
├── signin/page.tsx         # Redirect to /login
├── create-account/page.tsx # Redirect to /subscribe
├── subscribe/page.tsx      # Subscription plans
├── checkout/page.tsx       # Cleeng checkout
├── home/page.tsx           # Browse/home (authenticated)
├── account/page.tsx        # Account settings
├── search/page.tsx         # Search page
├── content/[id]/page.tsx   # Content details
├── watch/[id]/page.tsx     # Video player
├── sport/[playlistId]/page.tsx # Sport category
└── api/
    ├── health/route.ts
    ├── player-config/route.ts
    ├── landing/content/route.ts
    ├── content/hero/route.ts
    ├── content/rows/route.ts
    ├── content/[id]/route.ts
    ├── series/[seriesId]/episodes/route.ts
    ├── series/[seriesId]/next-episode/route.ts
    ├── search/route.ts
    ├── sports/route.ts
    ├── sports/[playlistId]/content/route.ts
    ├── recommendations/[sessionId]/route.ts
    ├── watch-progress/route.ts
    ├── continue-watching/[sessionId]/route.ts
    ├── continue-watching/[sessionId]/[mediaId]/route.ts
    ├── migrate-watch-history/route.ts
    └── cleeng/
        ├── config/route.ts
        ├── offers/route.ts
        ├── register/route.ts
        ├── login/route.ts
        ├── sso/route.ts
        ├── subscriptions/[customerId]/route.ts
        ├── webhook/route.ts
        ├── register-webhooks/route.ts
        ├── tax/route.ts
        └── coupon/route.ts
components/
├── providers.tsx           # Client-side providers wrapper
├── Navbar.tsx
├── HeroCarousel.tsx
├── ContentRow.tsx
├── PosterCard.tsx
├── ContinueWatchingCard.tsx
├── SportCategoryCard.tsx
├── Footer.tsx
├── AuthGuard.tsx
├── SkeletonLoaders.tsx
├── LoadingSpinner.tsx
├── LandingPageContent.tsx
└── ui/                     # shadcn/ui components
lib/
├── auth-context.tsx        # Auth provider with Cleeng SSO
├── supabase.ts             # Client-side Supabase client
├── supabase-server.ts      # Server-side Supabase admin client
├── session.ts              # Session management
├── cleeng.ts               # Cleeng types and helpers
├── storage.ts              # Server-side storage (JWPlayer content, watch history)
├── jwplayer.ts             # JWPlayer API integration
├── queryClient.ts          # TanStack Query client
├── utils.ts                # Utility functions
├── mockData.ts             # Fallback mock data
└── types.ts                # TypeScript type definitions
hooks/
├── use-mobile.tsx
└── use-toast.ts
```

### Page Structure
- **Landing** (`/`): Marketing page with hero, content preview, pricing
- **Home** (`/home`): Hero carousel, content rows, sport categories, continue watching
- **Content Details** (`/content/[id]`): Detailed view of a show/movie
- **Watch** (`/watch/[id]`): JWPlayer video player with progress tracking
- **Sport Category** (`/sport/[playlistId]`): Sport-specific content grid
- **Search** (`/search`): Content search with results grid
- **Subscribe** (`/subscribe`): Plan selection and account creation
- **Checkout** (`/checkout`): Cleeng payment processing
- **Account** (`/account`): Profile, subscription, password management
- **Login** (`/login`): Email + password login

## External Dependencies

### Video Platform
- **JWPlayer**: Video hosting and playback
  - Library loaded via `next/script` in root layout
  - Player library URL configurable via `JWPLAYER_PLAYER_KEY` env var (defaults to `EBg26wOK`)
  - Watch page fetches player config from `/api/player-config`
  - Playlists configured in `lib/jwplayer.ts`
  - Environment variables: `JWPLAYER_SITE_ID`, `JWPLAYER_API_SECRET`, `JWPLAYER_PLAYER_KEY`

### Deployment
- **Build**: `NODE_OPTIONS='--max-old-space-size=2048' npx next build` (run manually from bash if .next/ is missing)
- **Serve**: `bash start.sh` (uses `node server.mjs` custom server on port 5000)
- **Custom Server**: `server.mjs` — ESM Node.js HTTP server wrapping Next.js request handler
- **Health check**: `/api/health`
- **Note**: Build requires ~5GB peak memory. Run build from bash, not from workflow, to avoid OOM.
- **Required env vars**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `JWPLAYER_SITE_ID`, `JWPLAYER_API_SECRET`
- **Optional**: `CLEENG_PUBLISHER_ID`, `CLEENG_API_SECRET`, `CLEENG_SANDBOX`, `JWPLAYER_PLAYER_KEY`

### Database
- **PostgreSQL** via Supabase client (not direct connection)
- Tables: `watch_history`, `profiles`

### UI/Styling
- **Google Fonts**: Inter (UI) and Outfit (headings)
- **Radix UI**: Accessible component primitives
- **Tailwind CSS v4**: Utility-first styling with custom dark theme

## Content Display Rules

### Motion Thumbnails for Banner Content
All media displayed in banners must follow motion thumbnail logic:
1. Check if motion thumbnail exists in JW Player's images array (type: `video/mp4`)
2. Fall back to checking direct URL: `poster.mp4?width=640`
3. Use largest available width (max 640px)
4. Frontend displays video element with autoplay/loop/muted when available
5. Falls back to static image if motion thumbnail fails

### Thumbnail Image Labels (JW Player)
- **Regular content cards**: Use `Vertical-Poster.jpg` label
- **Continue Watching rail**: Use `Horizontal-Poster-Logo.jpg` label
- Labels are case-sensitive

### Image Optimization
- Poster thumbnails: 480px width
- Hero images: 1280px width
- All images: `loading="eager"`, `decoding="async"`

### Hero Banner Logos
- Logo pattern: `{mediaId}/images/hero-banner-logo.png`
- Fallback to text title if logo fails

### Dynamic Watch Button
- Movies: "Watch Now"
- Series: "Watch S{X} E{Y}" based on user progress
- API: `GET /api/series/[seriesId]/next-episode`

## Supabase Authentication

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase public anonymous key

### Auth Flow
**Sign Up**: User selects plan → enters email/password → account created in Supabase → redirected to checkout → linked to Cleeng via SSO

**Sign In**: User enters email/password → authenticated immediately

### 3 User States
1. **No account**: Landing page, CTAs say "Get Started"/"Subscribe"
2. **Account, no subscription**: Can browse but not watch, CTAs say "Upgrade to Watch"
3. **Account, active subscription**: Full access, CTAs say "Watch Now"

### Key Files
- `lib/supabase.ts`: Client-side Supabase client
- `lib/auth-context.tsx`: Auth provider with Cleeng SSO and subscription state
- `app/login/page.tsx`: Sign in page
- `app/subscribe/page.tsx`: Plan selection → account creation → checkout redirect
- `app/account/page.tsx`: Account settings

## Cleeng Integration (Subscription Management)

### APIs
- **Core API** (`api.cleeng.com`): Publisher operations (JSON-RPC)
- **MediaStore API** (`mediastoreapi.cleeng.com`): Customer operations

### Environment Variables
- `CLEENG_PUBLISHER_ID`: Publisher ID
- `CLEENG_API_SECRET`: Publisher Token/API Key
- `CLEENG_SANDBOX`: Set to "true" for sandbox

### SSO Flow (Supabase → Cleeng)
1. User authenticates with Supabase
2. SSO endpoint registers customer in Cleeng via Core API
3. For existing customers, uses `generateCustomerToken`
4. JWT stored in localStorage for checkout

### Checkout Flow
1. User selects plan on `/subscribe`
2. Account created (Supabase), then SSO links to Cleeng
3. Redirected to `/checkout?offerId=...`
4. Cleeng MediaStore SDK handles payment (Adyen)
5. Webhook syncs subscription status to Supabase profiles

### Payment
- **SDK**: `@cleeng/mediastore-sdk`
- **CSS**: Adyen, react-loading-skeleton, and SDK font styles imported in globals.css
- **Sandbox Testing**: Visa 4111 1111 1111 1111, any future expiry, any 3-digit CVV
