# StreamMax - Streaming Entertainment Platform

## Overview

StreamMax is a streaming entertainment platform built with a React frontend and Express backend. The application features an HBO Max-style UI with a hero carousel, content rows, video playback using JWPlayer, and watch progress tracking. It integrates with JWPlayer's API for video content delivery and uses PostgreSQL for persistent storage of user watch history.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with custom dark theme optimized for streaming UI
- **UI Components**: shadcn/ui component library (Radix UI primitives)
- **Carousel**: Embla Carousel for hero banner and content scrolling
- **Build Tool**: Vite

### Backend Architecture
- **Framework**: Express 5 running on Node.js
- **API Design**: RESTful endpoints under `/api/` prefix
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Video Integration**: JWPlayer API for video content and playback

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts`
- **Tables**: 
  - `users` - User authentication (id, username, password)
  - `watch_history` - Video progress tracking (session-based)
- **Session Storage**: Client-side session ID stored in localStorage

### Key Design Patterns
- **Shared Schema**: Database schema defined in `shared/` directory, accessible by both frontend (for types) and backend
- **API Layer**: Storage abstraction in `server/storage.ts` handles data operations
- **Type Safety**: Zod schemas generated from Drizzle for validation (`drizzle-zod`)
- **Path Aliases**: `@/` for client source, `@shared/` for shared modules

### Page Structure
- **Home** (`/`): Hero carousel, content rows, sport categories, continue watching
- **Content Details** (`/content/:id`): Detailed view of a show/movie
- **Watch** (`/watch/:id`): JWPlayer video player with progress tracking
- **Sport Category** (`/sport/:playlistId`): Sport-specific content grid

## External Dependencies

### Video Platform
- **JWPlayer**: Video hosting and playback
  - Library loaded via CDN in `index.html` (injected at runtime in production via `server/static.ts`)
  - Player library URL is configurable via `JWPLAYER_PLAYER_KEY` env var (defaults to `EBg26wOK`)
  - Watch page fetches player config from `/api/player-config` for dynamic library loading
  - Playlists configured in `server/jwplayer.ts`
  - Environment variables: `JWPLAYER_SITE_ID`, `JWPLAYER_API_SECRET`, `JWPLAYER_PLAYER_KEY`

### Railway Deployment
- **Config**: `railway.toml` with build and start commands
- **Build**: `npm install && npm run build`
- **Start**: `npm run start` (serves from `dist/`)
- **Health check**: `/api/health`
- **Required env vars on Railway**: `DATABASE_URL`, `JWPLAYER_SITE_ID`, `JWPLAYER_API_SECRET`
- **Optional**: `JWPLAYER_PLAYER_KEY` (if different from default), `PORT` (Railway sets automatically)

### Database
- **PostgreSQL**: Primary data store
  - Connection via `DATABASE_URL` environment variable
  - Migrations stored in `/migrations` directory
  - Push schema with `npm run db:push`

### UI/Styling
- **Google Fonts**: Inter (UI) and Outfit (headings)
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling with custom dark theme

### Development Tools
- **Replit Plugins**: Dev banner, cartographer, runtime error overlay (dev mode only)
- **Custom Vite Plugin**: `vite-plugin-meta-images.ts` for OpenGraph image handling

## Content Display Rules

### Motion Thumbnails for Banner Content
**Rule**: All media displayed in banners (hero carousel, content rows, sport pages, content details) must follow the same motion thumbnail logic:
1. First check if motion thumbnail exists in JW Player's images array (type: `video/mp4`)
2. If not found, fall back to checking the direct URL: `poster.mp4?width=640`
3. Use the largest available width (max 640px - JW Player limitation)
4. Frontend displays video element with autoplay/loop/muted when motion thumbnail is available
5. Falls back to static image if motion thumbnail fails to load

**Implementation**: 
- `extractMotionThumbnailFromImages()` - checks images array
- `checkMotionThumbnailExists()` - async fallback URL check
- `enrichItemsWithMotionThumbnails()` - applies to all content arrays

### Thumbnail Image Labels (JW Player)
**Rule**: All thumbnails must use specific JW Player image labels from the media's additional images:

1. **Regular content cards** (Featured rows, Popular, New Movies, etc.): Use `Vertical-Poster.jpg` label
   - URL pattern: `https://cdn.jwplayer.com/v2/media/{mediaId}/images/Vertical-Poster.jpg`
   - Fallback: Standard poster image (`poster.jpg?width=720`)

2. **Continue Watching rail**: Use `Horizontal-Poster-Logo.jpg` label
   - URL pattern: `https://cdn.jwplayer.com/v2/media/{mediaId}/images/Horizontal-Poster-Logo.jpg`
   - Fallback: Standard poster image (`poster.jpg?width=480`)

**Important**: JW Player image labels are case-sensitive. Use exact capitalization.

**Implementation**:
- `getJWPlayerVerticalPoster()` - returns Vertical-Poster.jpg URL
- `getJWPlayerHorizontalPosterLogo()` - returns Horizontal-Poster-Logo.jpg URL
- Frontend components include onError fallback handlers

### Hero Banner Logos
- Logo images use pattern: `{mediaId}/images/hero-banner-logo.png`
- Frontend falls back to text title if logo doesn't exist or fails to load
- Logo sizing: `h-20 sm:h-28 md:h-48` for hero banners

### Dynamic Watch Button
**Rule**: The watch button text changes based on content type and user's watch progress:

1. **Movies/Documentaries** (single content): Button says "Watch Now"
2. **Series** (multiple episodes): Button says "Watch S{X} E{Y}" where X and Y are dynamic based on:
   - If user hasn't watched any episode: Shows "Watch S1 E1"
   - If user is currently watching an episode (progress 1-95%): Shows that episode
   - If user finished an episode: Shows the next episode in sequence
   - If user finished the last episode: Shows the last episode (for rewatching)

**Implementation**:
- API endpoint: `GET /api/series/:seriesId/next-episode` (requires `x-session-id` header)
- Returns: `{ seasonNumber, episodeNumber, mediaId }` or `null`
- Frontend uses this to determine button text and link destination

## Supabase Authentication

### Overview
Authentication uses Supabase Auth with email/password authentication and email verification. New users must verify their email before creating a password.

### Environment Variables
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase public anonymous key

### Auth Flow
**Sign Up (New Users via Subscribe):**
1. User selects a plan on `/subscribe` page
2. User enters email and password (account created immediately in Supabase)
3. Verification email sent in background (does NOT block access)
4. User is redirected to `/checkout?offerId=...` to complete payment
5. AuthContext automatically links user to Cleeng customer via SSO

**Sign In (Existing Users):**
1. User enters email and password on `/login` page
2. User is authenticated immediately

**Supabase Settings:**
- "Confirm email" is DISABLED in Authentication → Providers → Email
- Users can sign in immediately without email verification
- Verification emails are still sent but don't block access

### 3 User States
1. **No account** — sees landing page, CTAs say "Get Started"/"Subscribe"
2. **Account, no subscription** — can browse content but can't watch. CTAs say "Upgrade to Watch", redirect to /subscribe
3. **Account, active subscription** — full access. CTAs say "Watch Now" and play content

### Key Files
- `client/src/lib/supabase.ts`: Supabase client initialization
- `client/src/lib/AuthContext.tsx`: Auth provider with Cleeng SSO integration and subscription state
- `client/src/pages/Login.tsx`: Sign in page for returning users
- `client/src/pages/Subscribe.tsx`: Plan selection → account creation (email+password) → checkout redirect
- `client/src/pages/AccountSettings.tsx`: Account settings with profile, subscription, password, email verification
- `client/src/pages/CreateAccount.tsx`: Redirects to /subscribe (legacy route)

### AuthContext Features
- Manages Supabase auth state (simplified: "email" | "authenticated")
- Automatically links authenticated users to Cleeng customers
- Stores Cleeng customer ID in `profiles.cleeng_customer_id`
- Provides: `user`, `profile`, `isAuthenticated`, `isLoading`, `hasActiveSubscription`, `cleengCustomer`, `isLinking`, `signUp`, `signIn`, `logout`
- `hasActiveSubscription` derived from `profile.subscription_tier !== "free"`

## Cleeng Integration (Subscription Management)

### Overview
Cleeng is integrated for subscription management and payment processing. The integration uses two separate APIs:
- **Core API** (`api.cleeng.com`): For publisher operations like listing offers and server-side customer registration (JSON-RPC)
- **MediaStore API** (`mediastoreapi.cleeng.com`): For customer operations like login and checkout

### Environment Variables
- `CLEENG_PUBLISHER_ID`: Publisher ID from Cleeng Dashboard
- `CLEENG_API_SECRET`: Publisher Token/API Key from Dashboard > Admin & Tools > API Keys
- `CLEENG_SANDBOX`: Set to "true" to use sandbox environment (optional)

### API Endpoints
- `GET /api/cleeng/config`: Returns publisher ID and environment
- `GET /api/cleeng/offers`: Lists active subscription offers (Core API 3.1)
- `POST /api/cleeng/register`: Customer registration (MediaStore API)
- `POST /api/cleeng/login`: Customer login (MediaStore API)
- `POST /api/cleeng/sso`: SSO login to link Supabase users (Core API JSON-RPC with publisherToken)
- `GET /api/cleeng/subscriptions/:customerId`: Get customer subscriptions (MediaStore API)
- `POST /api/cleeng/webhook`: Receives Cleeng subscription lifecycle events and syncs to Supabase

### SSO Flow (Supabase → Cleeng)
1. User authenticates with Supabase (email OTP)
2. SSO endpoint registers customer in Cleeng using Core API `registerCustomer` method (bypasses reCAPTCHA)
3. For existing customers, uses `generateCustomerToken` to get a JWT
4. JWT is stored in localStorage and used for checkout operations

### Frontend Integration
- `client/src/lib/cleeng.ts`: Type definitions and API helper functions
- `client/src/lib/AuthContext.tsx`: Context that links Supabase users to Cleeng customers via SSO
- `client/src/pages/Subscribe.tsx`: Subscription page with checkout flow

### Checkout Flow (MediaStore SDK)
1. User selects a plan on `/subscribe` page
2. Account is created first (Supabase), then plan selection, then checkout
3. After Supabase authentication, SSO creates/links Cleeng customer via `registerCustomer` method
4. User is redirected to in-app checkout page at `/checkout?offerId=...`
5. Checkout page renders Cleeng MediaStore SDK `Purchase` component
6. SDK handles payment form (Adyen), order creation, and payment processing client-side (PCI compliant)
7. On success, user is shown confirmation and redirected to streaming

### Pages
- `/login`: Email + password login page
- `/subscribe`: Account creation → plan selection flow
- `/checkout`: Cleeng MediaStore SDK Purchase component (handles payment via Adyen)

### Important Notes
- Subscription offers must be created in the Cleeng Dashboard before they appear
- Payment methods must be configured in Cleeng Dashboard (Settings → Payment Methods) and Adyen must be enabled
- Supabase users are automatically registered/linked as Cleeng customers on login via SSO
- Payment is handled entirely client-side by Cleeng's MediaStore SDK (no card data passes through our server)
- Webhook endpoint syncs subscription events to Supabase profiles

### Payment Integration
- **SDK**: `@cleeng/mediastore-sdk` (installed with `legacy-peer-deps=true` for React 19 compatibility)
- **CSS Dependencies**: `@adyen/adyen-web/dist/adyen.css`, `react-loading-skeleton/dist/skeleton.css`, `@cleeng/mediastore-sdk/dist/styles/msdFont.css` (imported in `main.tsx`)
- **SDK Config**: Environment and publisher ID fetched from `/api/cleeng/config`, JWT set from Cleeng SSO
- **Dark Theme**: CSS overrides in `index.css` under `.cleeng-checkout-container` class
- **Sandbox Testing**: Use Adyen test cards (Visa 4111 1111 1111 1111, any future expiry, any 3-digit CVV)
- **Production**: Contact Cleeng support to enable payment methods and whitelist domains for Adyen