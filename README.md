# AIVIDEO — Nexus Video AI Generation Dashboard

Premium text-to-video dashboard built with **Next.js 15**, **Tailwind CSS 4**, and **Framer Motion**, powered by [SiliconFlow](https://siliconflow.com) (`Wan-AI/Wan2.1-T2V-14B`).

## Features

- Dark glassmorphism UI with sidebar navigation
- Prompt-based video generation with quality presets (Cinematic, Realistic, Anime, 3D Render)
- Live task feed with status polling (Generating, Downloading, Ready, Failed)
- Video gallery with hover preview and download
- JSON persistence (structured for easy Supabase migration)

## Quick Start

```bash
npm install
cp .env.example .env.local
# Add your SILICONFLOW_API_KEY to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SILICONFLOW_API_KEY` | Your SiliconFlow API key |

## Deploy to Netlify

1. Push this repo to GitHub.
2. Connect the repo in [Netlify](https://app.netlify.com).
3. Set **Environment variable**: `SILICONFLOW_API_KEY`
4. Build settings (auto-detected with `netlify.toml`):
   - Build command: `npm run build`
   - Plugin: `@netlify/plugin-nextjs`

> **Note:** Netlify serverless functions use an ephemeral filesystem. Task history in `data/tasks.json` persists locally but may reset between deploys on Netlify. Swap `src/lib/db.ts` to Supabase for production persistence.

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/generate` | POST | Submit a new video generation job |
| `/api/tasks` | GET | List all tasks |
| `/api/tasks/poll` | POST | Poll SiliconFlow for pending tasks |
| `/api/tasks/[id]` | GET | Get / refresh a single task |

## Tech Stack

- Next.js App Router
- Tailwind CSS 4
- Framer Motion
- Lucide Icons
- SiliconFlow Video API
