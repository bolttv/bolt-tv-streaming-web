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
  - Library loaded via CDN in `index.html`
  - Playlists configured in `server/jwplayer.ts`
  - Environment variables: `JWPLAYER_SITE_ID`, `JWPLAYER_API_SECRET`

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