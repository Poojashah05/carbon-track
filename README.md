# CO2Track

**Carbon Footprint Awareness Platform** — Hackathon submission for [Hack2Skill PromptWars](https://hack2skill.com/) by Google for Developers.

## Overview

CO2Track helps users track, understand, and reduce their monthly carbon footprint through data-forward visualisations, AI-powered personalised insights, and weekly eco-challenges.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite 6 |
| Styling | Tailwind CSS v3 |
| Database & Auth | Supabase (PostgreSQL + GitHub OAuth) |
| Charts | Recharts |
| AI | Groq API — llama-3.1-8b-instant |
| Icons | Lucide React |

## Features

- **Dashboard** — Animated CO₂ gauge, India/Global comparison bars, category breakdown donut chart
- **Log Activity** — 4-category form (Transport, Food, Energy, Shopping) with live emission preview
- **AI Insights** — Streamed, personalised advice via Groq API (2 generations/month rate limit)
- **Follow-up Chat** — 5-message chat history with your AI carbon advisor
- **Weekly Challenges** — 6 eco-challenges with points and Eco Champion badge
- **Profile** — Editable baseline preferences synced to Supabase

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/carbon-track.git
cd carbon-track
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
```

Fill in `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_GROQ_API_KEY=your_groq_api_key
```

### 3. Set Up Supabase

1. Create a new [Supabase](https://supabase.com) project
2. Run `supabase_schema.sql` in the SQL Editor
3. Enable GitHub OAuth under **Authentication → Providers**
4. Set redirect URL to `http://localhost:5173/auth/callback`

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Emission Factors

Based on IPCC AR6 and EPA data:
- **India Grid**: 0.82 kg CO₂/kWh
- **India Monthly Average**: 230 kg CO₂
- **Global Monthly Average**: 391.67 kg CO₂

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Jest unit tests
npm run test:coverage # Coverage report (target: >80%)
```

## License

MIT
