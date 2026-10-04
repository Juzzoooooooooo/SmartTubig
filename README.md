# SmarTubig

SmarTubig is a responsive water-tank monitoring and assisted distribution-control prototype for Barangay Hinanggayon, Mogpog, Marinduque. It was developed from the project requirements in the capstone paper.

## Features

- Real-time tank level and water-quality dashboard
- pH, TDS, and turbidity indicators
- Schedule-aware assisted valve controls with confirmation
- Distribution schedules for barangay puroks
- Alerts, monitoring history, and CSV export interaction
- Responsive glass-style interface for desktop and mobile
- Supabase-ready PostgreSQL schema with row-level security
- Demo mode when Supabase credentials are not configured

## Requirements

- Node.js 22.13 or newer
- npm
- A Supabase project for persistent production data

## Run locally

```bash
npm ci
npm run dev
```

Open the local URL printed by the development server, normally `http://localhost:5173`.

To verify a production build:

```bash
npm run build
npm start
```

## Configure Supabase

1. Create a Supabase project.
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor.
3. Copy `.env.example` to `.env.local`.
4. Add your project URL and anonymous key:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

The application intentionally falls back to demo data when these variables are absent. Environment files and secrets are excluded from Git.

## Main source files

- `app/page.tsx` — dashboard and interactions
- `app/globals.css` — glass UI and responsive styling
- `lib/supabase.ts` — Supabase REST integration
- `supabase/schema.sql` — database tables, policies, and initial records

## ESP32 firmware

The [`firmware/`](firmware/README.md) folder has four independent ESP32 projects: ultrasonic level, pH, TDS, and turbidity. Each can be built and flashed separately to read its sensor over serial. The current dashboard remains a demo until a device API is implemented.

## Current prototype

The private hosted prototype is available at:

<https://smartubig-hinanggayon.maximilianblanda.chatgpt.site>
