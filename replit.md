# Bolt TV - Premium Sports Documentaries Streaming Platform

## Overview

Bolt TV is a streaming entertainment platform built with Next.js 15 (App Router). The application features a premium dark-themed UI with a hero carousel, content rows, video playback using JWPlayer, and watch progress tracking. It integrates with JWPlayer's API for video content delivery, Supabase for authentication, Cleeng for subscription management, and PostgreSQL (via Supabase) for persistent storage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Framework
- **Next.js 15** with App Router
- **TypeScript** throughout
- **Dev mode**: `next dev --port 5000`
- **Production**: `next build` then `next start --port 5000`

### Frontend Architecture
- **Framework**: React 18 with Next.js App Router
- **Routing**: Next.js file-based routing (`app/` directory)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS v4 with custom dark theme optimized for streaming UI
- **UI Components**: shadcn/ui component library (Radix UI primitives)
- **Carousel**: Embla Carousel for hero banner and content scrolling
- **SSR Strategy**: Content-browsing pages (landing, home, content, sport) use SSR with dynamic imports and loading states. Auth/interactive pages (login, subscribe, checkout, account, search, watch) use `ssr: false` for client-only rendering.
- **Auth Middleware**: Server-side route protection via `middleware.ts` redirects unauthenticated users from protected routes to `/login`

### Backend Architecture
- **API Routes**: Next.js Route Handlers in `app/api/` directory (27 routes)
- **Video Integration**: JWPlayer API for video content and playback
- **Auth**: Supabase Auth with email/password
- **Subscriptions**: Cleeng MediaStore SDK with Adyen payment processing

### Data Storage
- **Database**: PostgreSQL via Supabase client (not Drizzle ORM)
- **Tables**: `watch_history` for video progress tracking, `profiles` for user data
- **Session Storage**: Client-side session ID stored in localStorage

### Key Design Patterns
- **Dynamic Imports**: Pages use `next/dynamic` — content pages with SSR, auth pages with `ssr: false`
- **Loading States**: All pages show branded gold spinner (#D4AF37) while loading
- **API Layer**: Storage abstraction in `lib/storage.ts` handles data operations
- **Path Aliases**: `@/` maps to project root
- **Cleeng SSO**: Uses `generateCustomerToken` publisher API (no plaintext password storage)

### Project Structure
```
middleware.ts               # Auth middleware for route protection
app/
├── layout.tsx              # Root layout with providers, fonts
├── globals.css             # Tailwind CSS v4 global styles
├── page.tsx                # Landing page (/) — SSR enabled
├── not-found.tsx           # 404 page
├── login/page.tsx          # Login page — ssr:false
├── signin/page.tsx         # Redirect to /login
├── create-account/page.tsx # Redirect to /subscribe
├── subscribe/page.tsx      # Subscription plans — ssr:false
├── checkout/page.tsx       # Cleeng checkout — ssr:false
├── home/page.tsx           # Browse/home (auth required) — SSR enabled
├── account/page.tsx        # Account settings — ssr:false
├── search/page.tsx         # Search page — ssr:false
├── content/[id]/page.tsx   # Content details — SSR enabled
├── watch/[id]/page.tsx     # Video player — ssr:false
├── sport/[playlistId]/page.tsx # Sport category — SSR enabled
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
├── providers.tsx           # Client-side providers (QueryClient, Auth, external scripts)
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

## External Dependencies

### Video Platform
- **JWPlayer**: Video hosting and playback
  - Player library ID: `xQRl7M0d` (Site ID: `dbT1F4Hr`)
  - Library loaded dynamically via `useExternalScript` in providers.tsx
  - Watch page fetches player config from `/api/player-config`
  - Playlists configured in `lib/jwplayer.ts`
  - Environment variables: `JWPLAYER_SITE_ID`, `JWPLAYER_API_SECRET`, `JWPLAYER_PLAYER_KEY`

### Deployment
- **Vercel**: Primary deployment target
- **Replit**: Development environment (dev mode on port 5000)
- **Build**: `NODE_OPTIONS='--max-old-space-size=2048' npx next build`
- **Health check**: `/api/health`
- **Required env vars**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `JWPLAYER_SITE_ID`, `JWPLAYER_API_SECRET`
- **Optional**: `CLEENG_PUBLISHER_ID`, `CLEENG_API_SECRET`, `CLEENG_SANDBOX`, `JWPLAYER_PLAYER_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### Database
- **PostgreSQL** via Supabase client (not direct connection)
- Tables: `watch_history`, `profiles`

### UI/Styling
- **Google Fonts**: Inter (UI) and Outfit (headings)
- **Radix UI**: Accessible component primitives
- **Tailwind CSS v4**: Utility-first styling with custom dark theme
- **Brand Color**: Gold (#D4AF37) for loading spinners and accents

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
- `SUPABASE_SERVICE_ROLE_KEY`: Server-side admin operations

### Auth Flow
**Sign Up**: User selects plan → enters email/password → account created in Supabase → redirected to checkout → linked to Cleeng via SSO

**Sign In**: User enters email/password → authenticated immediately

### 3 User States
1. **No account**: Landing page, CTAs say "Get Started"/"Subscribe"
2. **Account, no subscription**: Can browse but not watch, CTAs say "Upgrade to Watch"
3. **Account, active subscription**: Full access, CTAs say "Watch Now"

### Route Protection
- **Middleware** (`middleware.ts`): Server-side check for auth cookies on protected routes
- **Protected routes**: `/home`, `/search`, `/account`, `/checkout`, `/watch`, `/content`, `/sport`
- **Public routes**: `/`, `/login`, `/signin`, `/subscribe`, `/create-account`
- Unauthenticated users are redirected to `/login?returnTo=<path>`

## Cleeng Integration (Subscription Management)

### APIs
- **Core API** (`api.cleeng.com`): Publisher operations (JSON-RPC)
- **MediaStore API** (`mediastoreapi.cleeng.com`): Customer operations

### Environment Variables
- `CLEENG_PUBLISHER_ID`: Publisher ID (`870553921`)
- `CLEENG_API_SECRET`: Publisher Token/API Key
- `CLEENG_SANDBOX`: Set to "true" for sandbox

### SSO Flow (Supabase → Cleeng)
1. User authenticates with Supabase
2. SSO endpoint tries `generateCustomerToken` for existing customers (no password needed)
3. If customer doesn't exist, registers with random password (never stored)
4. JWT returned for checkout — `cleeng_customer_id` saved to profiles

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
