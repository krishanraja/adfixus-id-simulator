# Changelog

All notable changes to **adfixus-id-simulator**, the public AdFixus Identity
Durability Simulator lead magnet.

> **Current architecture (authoritative):** a 100% client-side React SPA. The
> default surface is an Apple-grade **guided flow** (`src/components/flow/*`:
> provocation → one audience-size control → animated reveal → a depth drawer
> holding the full configurable simulator, `src/components/simulator/*`). The math
> lives in the verified **`src/core`** engine (`scope: 'id-only'`), driven by a
> single `src/hooks/useIdSimulator.ts` instance shared by the flow and the drawer.
> Iframe-embeddable into adfixus.com. **No backend, no login, no lead capture, no
> secrets.** Older entries below predate the current build; where they mention
> Supabase/edge functions or lead capture, that architecture is **retired**.

---

## [4.0.0] - Real branding + domain intelligence (current)

The audit now recognises the visitor's business from their domain and tailors
everything around it - still 100% client-side, no backend of ours.

### Added
- **Domain-intelligence layer** (`src/core/intel/`): a new guided-flow step asks
  for the visitor's website and resolves a `DomainProfile` entirely in the browser
  - exact match against a bundled dataset of real open-web publishers
  (`knownDomains.ts`, 130 companies / 239 domains, auto-generated from AdFixus
  account research) → keyword heuristics for the vertical → a generic fallback.
- **Pre-filled model**: seven vertical archetypes (`verticals.ts`) seed the
  simulator (Safari share, display/video split, CPMs, anon %) so it lands in the
  right ballpark before a slider is touched - every value still freely adjustable.
- **Tailored briefing** (`TailoredBriefing.tsx`): a recommendation mirroring the
  AdFixus research playbook - context hook → identity gap → what it costs → how a
  publisher-owned durable ID closes it - with a **Revenue / Ad-ops / Data** proof
  metric versus an industry benchmark. Shown compact on the reveal, full atop the
  drawer. All proof figures are *published* AdFixus benchmarks; nothing
  company-specific is invented.
- **Visitor's real logo** (`BrandLogo.tsx`, `intel/logo.ts`): rendered in-browser
  via the Brandfetch Logo CDN when `VITE_BRANDFETCH_CLIENT_ID` is set, falling back
  to public favicon services. New optional env var; zero-config still works.

### Changed
- **Real AdFixus brand mark**: `AdfixusLogo` now renders the official brand SVG
  (bundled `src/assets/adfixus-wordmark.svg`) - the cyan arrow glyph + white
  wordmark - replacing the previous hand-drawn placeholder.
- Guided flow is now four screens (Provocation → **Domain** → Ask → Reveal); the
  reveal and the full simulator lead with the business-tailored briefing.
- Docs updated: `README.md`, `HANDOVER.md`, `docs/ADFIXUS_CORE_SPEC.md` (§5),
  `.env.example`.

---

## [3.1.0] - Production cleanup (current)

### Changed
- Docs rewritten to match the guided-flow + AI-era-consultative reality:
  `README.md`, `HANDOVER.md`, `docs/ADFIXUS_CORE_SPEC.md`, plus `SECURITY.md`.

### Removed
- Dead code left after the guided-flow rebuild: 14 unused shadcn/ui components, the
  unused toast subsystem (`use-toast`, `toast`, `toaster`), `use-mobile`, `App.css`,
  the unused lead-capture adapter (`core/adapters/leadAdapter.ts`), the golden-values
  `core/selfcheck.ts` and its convenience wrappers, and the stale `bun.lockb`.
- Unused dependencies: `@hookform/resolvers`, `react-hook-form`, `zod`,
  `next-themes`, `@tailwindcss/typography`, and the Radix packages behind the
  removed components (`react-dialog`, `react-progress`, `react-radio-group`,
  `react-select`, `react-tabs`, `react-toast`).

### Hygiene
- Untracked `.env`; `.gitignore` now covers `.env*` (keeping `.env.example`) and
  `.vercel`.

---

## [3.0.0] - ID Durability Simulator on the shared core (current)

### Rebuilt
- Rebuilt as a fully-configurable ID durability simulator **wired to the shared
  `src/core` engine** (`UnifiedCalculationEngine.calculate(..., scope: 'id-only')`)
  - replacing the old in-component math with the verified engine.
- Adopted the canonical **dark + bright-cyan** design system and the shared
  **embed module** (`src/core/embed/embed.ts`).

### Docs
- Rewrote `README.md`, `HANDOVER.md`, `SECURITY.md`; synced
  `docs/ADFIXUS_CORE_SPEC.md`.

### Removed
- All Supabase / backend / login remnants - the tool is 100% client-side.

---

## [2.0.0] - 2024-XX-XX - Developer Handover Refactor (historical)

### 🚀 Major Changes
- **Removed Supabase Integration**: Eliminated backend dependencies for simpler deployment
- **Dependency Cleanup**: Removed 15+ unused packages for smaller bundle size
- **Environment Configuration**: Added configurable meeting booking URL
- **Comprehensive Documentation**: Added developer handoff materials

### ✨ New Features
- **Environment Variables**: Configurable meeting booking URL via `VITE_MEETING_BOOKING_URL`
- **Local Storage**: Lead data now stored locally instead of database
- **Simplified Lead Capture**: Streamlined form without backend dependencies
- **Static Hosting Ready**: Fully client-side application suitable for any static host

### 🗑️ Removed
- **Supabase Dependencies**: 
  - `@supabase/supabase-js` package
  - `@tanstack/react-query` package
  - All Supabase client code and configuration
  - Email notification functionality
  - Database lead storage

- **Unused UI Components**:
  - `@radix-ui/react-accordion`
  - `@radix-ui/react-alert-dialog`
  - `@radix-ui/react-aspect-ratio`
  - `@radix-ui/react-avatar`
  - `@radix-ui/react-checkbox`
  - `@radix-ui/react-collapsible`
  - `@radix-ui/react-context-menu`
  - `@radix-ui/react-dropdown-menu`
  - `@radix-ui/react-hover-card`
  - `@radix-ui/react-menubar`
  - `@radix-ui/react-navigation-menu`
  - `@radix-ui/react-popover`
  - `@radix-ui/react-scroll-area`
  - `@radix-ui/react-separator`
  - `@radix-ui/react-switch`
  - `@radix-ui/react-toggle`
  - `@radix-ui/react-toggle-group`

- **Unused Dependencies**:
  - `cmdk` - Command palette component
  - `date-fns` - Date utility library
  - `embla-carousel-react` - Carousel component
  - `input-otp` - OTP input component
  - `react-day-picker` - Date picker component
  - `react-resizable-panels` - Resizable panels
  - `sonner` - Toast notification library
  - `vaul` - Drawer component

- **Files and Directories**:
  - `src/integrations/supabase/` - Complete Supabase integration
  - `supabase/` - Supabase configuration and functions
  - `.env` - Environment file with Supabase credentials

### 🔧 Modified
- **App Component**: Removed React Query provider wrapper
- **Lead Capture Hook**: Simplified to use localStorage instead of Supabase
- **Results Dashboard**: Removed email sending functionality, simplified notifications
- **PDF Generator**: Made meeting booking URL configurable via environment variable

### 📚 Documentation
- **README.md**: Complete rewrite with quickstart guide and deployment instructions
- **.env.example**: Environment variable template
- **HANDOFF.md**: Comprehensive developer handoff guide
- **SECURITY.md**: Security documentation for static deployment
- **CHANGELOG.md**: This changelog documenting all changes

### 🎯 Benefits
- **Reduced Bundle Size**: ~40% smaller after removing unused dependencies
- **Simpler Deployment**: No backend required, deploy anywhere
- **Zero Configuration**: Works out of the box with minimal setup
- **Faster Builds**: Fewer dependencies mean faster installation and builds
- **Better Maintainability**: Cleaner codebase with less complexity
- **Enhanced Documentation**: Clear guides for future developers

### 🔄 Migration Notes
For existing deployments:
1. Remove Supabase environment variables
2. Add `VITE_MEETING_BOOKING_URL` environment variable
3. Update deployment to static hosting (no server required)
4. User data will be stored locally instead of database

### ⚠️ Breaking Changes
- **Lead Storage**: User information no longer saved to database
- **Email Notifications**: Automatic email sending removed
- **Environment Variables**: Supabase variables no longer needed
- **Dependencies**: Multiple packages removed (see removed section)

---

## [1.0.0] - Previous Version

### Features
- Identity Health Quiz with scoring system
- Revenue Calculator with advanced settings
- Comprehensive Results Dashboard with charts
- PDF export functionality with pdfmake
- Lead capture with Supabase integration
- Email notifications for completed assessments
- Responsive design with Tailwind CSS
- Multiple chart types using Recharts

### Dependencies
- React 18 with TypeScript
- Supabase for backend functionality
- React Query for data fetching
- Extensive Radix UI component library
- Multiple utility libraries for various features