# CLAUDE.md — Side A Codebase Guide

## Project Overview

**Side A** is a Progressive Web App (PWA) for managing a personal vinyl record collection. Users authenticate via Supabase OTP email, then can add albums (manually or auto-filled from MusicBrainz), browse their collection wall, view album details with a vinyl disc visual, and read track lyrics fetched on-demand.

- **Live URL:** `https://notdiogo.github.io/SideA/`
- **Stack:** React 19 + Vite 6 + Tailwind CSS 4 + Supabase + Framer Motion
- **Deployment:** GitHub Pages via GitHub Actions CI/CD

---

## Repository Structure

```
SideA/
├── src/
│   ├── components/
│   │   ├── forms/
│   │   │   ├── ImageUpload.jsx       # Drag-drop + client-side image compression
│   │   │   └── TrackListEditor.jsx   # Drag-reorderable track list with lyrics expansion
│   │   ├── layout/
│   │   │   ├── AppShell.jsx          # Fixed nav header (back button, add button)
│   │   │   └── PageTransition.jsx    # Framer Motion page animation wrapper
│   │   └── ui/
│   │       ├── Button.jsx            # CVA-based button with tap animation
│   │       ├── EmptyState.jsx        # "Your wall is empty" state with rotating disc
│   │       └── GrainOverlay.jsx      # Film grain texture overlay
│   ├── hooks/
│   │   ├── useCollection.js          # Album collection state + CRUD operations
│   │   └── useSwipe.js               # Touch swipe gesture detection
│   ├── lib/
│   │   ├── supabase.js               # Supabase client initialization
│   │   ├── musicbrainz.js            # MusicBrainz API: album search + metadata
│   │   ├── lyrics.js                 # Lyrics.ovh API: track lyrics fetching
│   │   └── utils.js                  # cn() helper (clsx + tailwind-merge)
│   ├── pages/
│   │   ├── Auth.jsx                  # OTP email authentication page
│   │   ├── Wall.jsx                  # Home gallery — horizontal scrolling album wall
│   │   ├── AddRecord.jsx             # Add/edit album form with MusicBrainz auto-fill
│   │   ├── AlbumDetail.jsx           # Album detail with vinyl disc visual + tracklist
│   │   └── Lyrics.jsx                # Track lyrics with swipe navigation
│   ├── store/
│   │   ├── collection.js             # localStorage implementation (legacy/backup)
│   │   └── supabaseCollection.js     # Supabase backend (primary, user-scoped)
│   ├── App.jsx                       # Root: auth state, CollectionContext, routes
│   ├── main.jsx                      # Entry point
│   └── index.css                     # Tailwind v4 config + CSS custom properties
├── public/
│   ├── icons/                        # PWA icons (192px, 512px, maskable variants)
│   ├── favicon.svg
│   └── 404.html                      # GitHub Pages SPA routing fallback
├── .github/workflows/
│   └── deploy.yml                    # CI/CD: build + deploy to gh-pages branch
├── vite.config.js                    # Vite + PWA + Tailwind config, base=/SideA/
├── index.html                        # HTML entry with GitHub Pages redirect script
└── package.json                      # Scripts: dev, build, preview
```

---

## Development Setup

### Prerequisites
- Node.js 22+
- npm

### Environment Variables
Create a `.env` file in the project root (not committed):

```
VITE_SUPABASE_URL=<your-supabase-project-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

These are accessed via `import.meta.env.VITE_SUPABASE_URL` etc. (Vite convention).

### Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server (hot reload)
npm run build     # Production build → ./dist
npm run preview   # Preview production build locally
```

> **Note:** There are currently no automated tests. Do not add a test runner unless explicitly requested.

---

## Routing

Routes are defined in `src/App.jsx` using React Router DOM v7:

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `Wall` | Album gallery (home) |
| `/add` | `AddRecord` | Add new album |
| `/album/:id` | `AlbumDetail` | Album detail view |
| `/album/:id/edit` | `AddRecord` | Edit existing album |
| `/album/:id/track/:trackId` | `Lyrics` | Track lyrics view |

Auth is handled before routing — if the user is not authenticated, only `Auth.jsx` is rendered (no public routes).

---

## Data Architecture

### State Management
- Global state lives in `CollectionContext` (defined in `App.jsx`)
- Consumed via the `useCollection` hook (`src/hooks/useCollection.js`)
- Context provides: `{ albums, loading, addAlbum, updateAlbum, removeAlbum }`

### Storage
Two implementations with identical interfaces (`getAll`, `getById`, `save`, `remove`):

| Module | Backend | Status |
|--------|---------|--------|
| `src/store/collection.js` | `localStorage` | Legacy/backup |
| `src/store/supabaseCollection.js` | Supabase (Postgres) | **Primary** |

The app uses the Supabase implementation. Albums are scoped to the authenticated user via `user_id`.

### Data Models

**Album:**
```js
{
  id: string,          // UUID
  title: string,       // required
  artist: string,      // required
  year: string,        // optional, YYYY
  coverImage: string,  // base64 data URL (JPEG, client-compressed)
  tracks: Track[],
  createdAt: number,   // timestamp
  updatedAt: number    // timestamp
}
```

**Track:**
```js
{
  id: string,      // UUID or MusicBrainz recording ID
  title: string,
  lyrics: string   // optional, fetched on-demand via Lyrics.ovh
}
```

---

## External API Integrations

### MusicBrainz (`src/lib/musicbrainz.js`)
- Used in `AddRecord.jsx` to auto-fill album metadata
- Endpoints: `/ws/2/release` (search), `/ws/2/release/:id` (detail with recordings)
- Cover art: Cover Art Archive (`coverartarchive.org`)
- Always includes `User-Agent` header (required by MusicBrainz policy)

### Lyrics.ovh (`src/lib/lyrics.js`)
- Fetches lyrics on-demand in `Lyrics.jsx`
- Endpoint: `https://api.lyrics.ovh/v1/{artist}/{title}`
- Graceful fallback: shows "Lyrics not available" on error or missing data

---

## UI Conventions

### Design System
The app uses a **soft neumorphism / iOS-inspired** aesthetic defined in `src/index.css`:

- **Background:** `#EFEFEF` (light grey)
- **Cards/surfaces:** `#FFFFFF` with subtle shadows
- **Shadow scale:**
  - Subtle: `0 1px 6px rgba(0,0,0,0.06)`
  - Medium: `0 4px 16px rgba(0,0,0,0.08)`
  - Elevated: `0 8px 32px rgba(0,0,0,0.12)`
- **Border radii:** sm (0.5rem), md (0.875rem), lg (1.25rem), xl (1.75rem)
- **Font:** Inter (Google Fonts), weights 300/400/500/600
- **Letter spacing:** -0.01em to -0.03em for headings

### Animations (Framer Motion)
- Standard easing: `[0.16, 1, 0.3, 1]` (expo ease-out)
- Durations: 0.2s–0.45s for transitions
- Page transitions: `AnimatePresence` with `PageTransition` wrapper
- Tap feedback: scale to 0.95–0.97
- Drag reordering: `Reorder.Group` from `framer-motion`

### Tailwind Usage
- Tailwind v4 with `@import "tailwindcss"` and `@theme` block (not `tailwind.config.js`)
- Use `cn()` from `src/lib/utils.js` for conditional class merging (clsx + tailwind-merge)
- Avoid inline styles for colors/spacing that can be expressed with Tailwind utilities

### Component Patterns
- Functional components with hooks only
- `Button.jsx` uses CVA (`class-variance-authority`) for variants — extend it rather than creating ad-hoc styled buttons
- Prefer Radix UI primitives for accessible interactive components (dialogs, separators)

---

## Image Handling

Client-side image compression is applied in `ImageUpload.jsx` before storing:
- Max dimension: **600px** (width or height)
- Format: **JPEG** at quality **0.82**
- Stored as base64 data URL in Supabase

Do not increase these limits without considering Supabase storage capacity and load time.

---

## Authentication

- Provider: Supabase Auth with **OTP (magic link) email**
- No password UI — user enters email, receives a one-time code
- Session managed by Supabase SDK via `onAuthStateChange`
- All album operations require an authenticated session
- Supabase row-level security (RLS) is expected to enforce user data isolation server-side

---

## CI/CD & Deployment

**Workflow:** `.github/workflows/deploy.yml`

Triggers on push to:
- `main`
- `claude/side-a-web-app-Sn0jY`

Steps:
1. `npm ci`
2. `npm run build` (with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` injected from GitHub secrets)
3. Deploy `./dist` to `gh-pages` branch via `peaceiris/actions-gh-pages`

**Base path:** `/SideA/` — this is set in `vite.config.js` and must be maintained for GitHub Pages subdirectory hosting. All asset and route references must be relative to this base.

The `public/404.html` and the redirect script in `index.html` handle SPA routing on GitHub Pages (redirect all 404s to the app root).

---

## PWA Configuration

Configured via `vite-plugin-pwa` in `vite.config.js`:
- **Name:** "Side A"
- **Display:** `standalone` (full-screen, no browser chrome)
- **Theme color:** `#1a1208` (dark warm brown)
- **Offline support:** Workbox caches JS, CSS, HTML, images, and fonts
- **Auto-update:** Service worker auto-reloads on new build

When changing the app name, theme color, or icons, update both the PWA manifest in `vite.config.js` and the `<meta>` tags in `index.html`.

---

## Key Conventions for AI Assistants

1. **No tests exist** — do not add test infrastructure unless explicitly asked.
2. **No linter/formatter config** — follow existing code style (2-space indent, single quotes, no semicolons where omitted).
3. **Tailwind v4 syntax** — use `@theme` block in CSS, not `tailwind.config.js`. Check `src/index.css` before adding new tokens.
4. **Base path is `/SideA/`** — never hardcode absolute paths starting from `/` for assets.
5. **Images are base64** — do not introduce file upload to external storage without discussion.
6. **Supabase is the source of truth** — the localStorage store is a legacy fallback; don't use it for new features.
7. **Auth is required** — there are no public/unauthenticated pages beyond the login screen; don't add routes that bypass auth.
8. **Framer Motion for all animations** — don't mix in CSS transitions or other animation libraries.
9. **Use `cn()` for classnames** — always import from `src/lib/utils.js` rather than using clsx or tailwind-merge directly.
10. **MusicBrainz User-Agent header** — always include it in requests to avoid rate limiting.
