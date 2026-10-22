# AI Description Generator

An AI-powered content generation platform built with **Next.js 16 App Router**, **TypeScript**, and the **Groq API** (`openai/gpt-oss-120b`). Features 7 specialized generators for e-commerce, marketing, SEO, and social media content — with multilingual output, privacy-conscious analytics, server-side rate limiting, and comprehensive automated testing.

---

## ✨ Features

### 🤖 7 AI Generators
| # | Generator | Route | Description |
|---|-----------|-------|-------------|
| 01 | Product Description | `/generate/product-description` | E-commerce product listing copy with image upload |
| 02 | Marketplace Description | `/generate/marketplace-description` | Marketplace-optimized descriptions |
| 03 | SEO Description | `/generate/seo-description` | SEO meta descriptions and keyword-rich copy |
| 04 | Advertisement | `/generate/advertisement-generator` | Ad copy for campaigns |
| 05 | Hook | `/generate/hook-generator` | Attention-grabbing hooks and openers |
| 06 | Social Media Caption | `/generate/social-media-caption` | Platform-specific social captions with video upload |
| 07 | Title Generator | `/generate/title-generator` | Product/content titles and headlines |

### 🌐 Multilingual Output
- **8 output languages**: Auto-detect, English, Indonesian, Spanish, French, Portuguese, Japanese, Korean
- Auto-detect mode infers the dominant language from user input
- Consistent language instruction injection across all generators

### 🔒 Security & Rate Limiting
- **Server-side anonymous identity** via signed HttpOnly cookies + IP hashing
- **Dual rate limiting**: 10 requests/day per visitor + 5 requests/minute burst protection
- **Upstash Redis** for persistent rate limiting in production (in-memory fallback for dev)
- **CSRF/Origin validation** on all API endpoints
- **Input validation** with size limits, abuse detection, and prompt injection prevention
- **Automatic quota refund** on AI errors (5xx) — users don't lose quota on service failures
- **Fail-closed** behavior: if Redis is unavailable in production, requests are rejected (503)

### 📊 Privacy-Conscious Analytics
- **Google Analytics 4** with cookie consent gating
- Strict data sanitization — NO prompts, AI outputs, images, or personal data sent to GA4
- Controlled event schema: `generator_open`, `generate_attempt`, `generate_success`, `generate_error`, `copy_result`, `output_language_selected`, `quota_exhausted`
- Google AdSense integration with separate advertising consent

### 📈 Operational Monitoring
- Server-side AI usage aggregation (Redis or in-memory)
- Privacy-safe structured JSON logging (zero user data)
- Configurable alert thresholds for volume, failure rate, latency, and cost
- Token counting and cost estimation
- `GET /api/monitoring/usage` endpoint with optional secret key authentication

### 🧪 Comprehensive Testing
- **209 automated tests** across 13 test files
- **Vitest** for unit and integration tests
- **Playwright** for E2E browser tests
- Coverage for: input validation, rate limiting, analytics, pricing, monitoring, visitor identity, cookies, session storage, fingerprinting, media handling, output language, API guards

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **npm** ≥ 9
- A **Groq API key** ([console.groq.com](https://console.groq.com/))
- An **Upstash Redis** instance for production rate limiting ([console.upstash.com](https://console.upstash.com/))

### Installation

```bash
# Clone the repository
git clone https://github.com/MhmdFahreza/ai-description-generator.git
cd ai-description-generator

# Install dependencies
npm install

# Copy environment template and fill in your keys
cp .env.example .env
```

### Environment Variables

See [`.env.example`](.env.example) for the full list. At minimum, set:

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | ✅ | Groq API key for AI generation |
| `NEXT_PUBLIC_APP_URL` | ✅ | Your app URL (e.g. `http://localhost:3000`) |
| `UPSTASH_REDIS_REST_URL` | Production | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Production | Upstash Redis REST token |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional | Google Analytics 4 Measurement ID |
| `MONITORING_SECRET_KEY` | Optional | Bearer token for monitoring endpoint |

### Development

```bash
# Start the development server
npm run dev

# Open in browser
open http://localhost:3000
```

### Testing

```bash
# Run all unit & integration tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run E2E browser tests (requires the dev server to be running)
npm run test:e2e
```

### Production Build

```bash
# Build for production
npm run build

# Start the production server
npm start
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── generate/             # 7 AI generator API routes + quota endpoint
│   │   │   ├── product-description/
│   │   │   ├── marketplace-description/
│   │   │   ├── seo-description/
│   │   │   ├── advertisement/
│   │   │   ├── hook/
│   │   │   ├── social-media-caption/
│   │   │   ├── title-generator/
│   │   │   └── quota/
│   │   └── monitoring/usage/     # Operational usage monitoring API
│   ├── generate/                 # 7 generator UI pages
│   ├── layout.tsx                # Root layout with providers, GA4, AdSense, cookie banner
│   └── page.tsx                  # Home page
├── componenets/
│   ├── cookies/                  # Cookie banner, GA4, AdSense components
│   ├── sections/                 # Shared page sections (header, etc.)
│   ├── language-select.tsx       # Output language dropdown with analytics
│   ├── rate-limit-provider.tsx   # Client-side quota state & UI provider
│   └── icons.tsx                 # SVG icon components
├── config/
│   ├── ai-pricing.ts             # Token cost estimation models
│   └── ai-alerts.ts              # Operational alert thresholds
├── constants/                    # Tones, languages, etc.
├── hooks/
│   ├── use-generator-analytics.ts # Privacy-safe analytics hook for generators
│   └── useInView.ts
├── lib/
│   ├── ai-monitor.ts             # Server-side AI usage monitoring & callGroqAi
│   ├── analytics.ts              # GA4 tracking with consent & sanitization
│   ├── api-guard.ts              # Unified API protection wrapper
│   ├── rate-limiter.ts           # Dual rate limiting (daily + burst)
│   ├── visitor-identity.ts       # Anonymous visitor identity management
│   ├── input-validation.ts       # Server-side input validation & anti-abuse
│   ├── output-language.ts        # Multilingual output language system
│   ├── generators/               # Client-side generator fetch functions
│   ├── cookies.ts                # Cookie consent preferences
│   ├── session-storage.ts        # sessionStorage draft persistence
│   ├── indexed-db.ts             # IndexedDB for image/video draft persistence
│   ├── fingerprint.ts            # Browser fingerprinting utilities
│   ├── media.ts                  # Media file validation
│   └── image.ts                  # Image file validation
└── types/                        # Shared TypeScript types

tests/
├── unit/                         # 11 unit test files
├── integration/                  # API guard integration tests
├── e2e/                          # Playwright E2E tests
└── setup.ts                      # Test setup & environment config
```

---

## 🏗️ Architecture

### Request Flow

```
Client (Browser)
  ↓ POST /api/generate/{generator}
API Guard (api-guard.ts)
  ├── 0. Origin / CSRF validation
  ├── 1. Content-Type check
  ├── 2. Body parsing (50KB limit)
  ├── 3. Input validation & anti-abuse
  ├── 4. Anonymous identity (signed cookie + IP)
  ├── 5. Rate limiting (daily + burst)
  ├── 6. Execute AI handler
  │     ├── callGroqAi() → Groq API
  │     ├── Record usage metrics (privacy-safe)
  │     └── Auto-refund quota on 5xx errors
  └── 7. Attach rate-limit headers + visitor cookie
  ↓
Client receives response
```

### Privacy Guarantees
The system enforces strict privacy boundaries at every layer:
- **Server-side monitoring**: No prompts, completions, images, visitor IDs, or IP addresses in usage records
- **Client-side analytics**: Forbidden params (`prompt`, `text`, `result`, `image`, `cookie`, `ip`, etc.) are stripped before GA4
- **Cookie consent**: GA4 scripts only load after explicit user consent; cookies are deleted on rejection

---

## 📜 Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Dev server | `npm run dev` | Start Next.js development server |
| Build | `npm run build` | Production build |
| Start | `npm start` | Start production server |
| Lint | `npm run lint` | Run ESLint |
| Test | `npm test` | Run all Vitest tests |
| Test (watch) | `npm run test:watch` | Vitest in watch mode |
| Test (coverage) | `npm run test:coverage` | Generate coverage report |
| Test (E2E) | `npm run test:e2e` | Run Playwright browser tests |

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript 5
- **AI Provider**: [Groq](https://groq.com/) (`openai/gpt-oss-120b`)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Rate Limiting**: [Upstash Redis](https://upstash.com/) + in-memory fallback
- **Analytics**: Google Analytics 4 (consent-gated)
- **Testing**: Vitest + Playwright
- **Fonts**: Geist Sans & Geist Mono

---

## 📄 License

This project is private.
