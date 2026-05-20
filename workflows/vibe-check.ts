import { generateObject } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { z } from 'zod'
import { Sandbox } from '@vercel/sandbox'

const gateway = createOpenAI({
  baseURL: process.env.AI_GATEWAY_URL ?? 'https://ai-gateway.vercel.sh/v1',
  apiKey: process.env.AI_GATEWAY_API_KEY ?? '',
})

export const VibeSchema = z.object({
  mood: z.string().describe('A single evocative word capturing the emotional vibe'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).describe('A hex color that captures this vibe'),
  score: z.number().min(1).max(10).describe('Vibe score from 1 (dread) to 10 (pure euphoria)'),
  haiku: z.object({
    line1: z.string(),
    line2: z.string(),
    line3: z.string(),
  }).describe('Three haiku lines inspired by this vibe'),
  theme_song: z.string().describe('Artist - Song Title that matches this vibe'),
})

export type VibeData = z.infer<typeof VibeSchema>

export interface VibeCheckResult {
  vibeData: VibeData
  html: string
}

// ─── helpers ────────────────────────────────────────────────────────────────

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 155
}

function adjustColor(hex: string, amount: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, n))
  const r = clamp(parseInt(hex.slice(1, 3), 16) + amount)
  const g = clamp(parseInt(hex.slice(3, 5), 16) + amount)
  const b = clamp(parseInt(hex.slice(5, 7), 16) + amount)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildVibeCardHTML(vibeData: VibeData, inputText: string): string {
  const light = isLightColor(vibeData.color)
  const textColor = light ? '#1a1a2e' : '#ffffff'
  const subColor = light ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)'
  const barTrack = light ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)'
  const barFill = light ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)'
  const gradientEnd = adjustColor(vibeData.color, light ? -30 : -50)

  const truncatedInput = escapeHtml(
    inputText.length > 70 ? inputText.slice(0, 70) + '…' : inputText
  )

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: 100%;
    height: 100%;
  }
  body {
    background: linear-gradient(135deg, ${vibeData.color} 0%, ${gradientEnd} 100%);
    font-family: 'Inter', -apple-system, sans-serif;
    color: ${textColor};
    position: relative;
    overflow: hidden;
  }
  .noise {
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none;
    opacity: 0.3;
  }
  .card {
    position: relative;
    padding: 5% 7%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .top { display: flex; flex-direction: column; gap: 0.3em; }
  .label {
    font-size: clamp(9px, 1.5vw, 11px);
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: ${subColor};
  }
  .input-text {
    font-size: clamp(11px, 2vw, 14px);
    color: ${subColor};
    font-style: italic;
    max-width: 80%;
  }
  .middle { display: flex; flex-direction: column; gap: 0.6em; }
  .mood {
    font-size: clamp(32px, 9vw, 56px);
    font-weight: 900;
    letter-spacing: -0.05em;
    line-height: 1;
    text-transform: uppercase;
    color: ${textColor};
  }
  .score-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .score-bar-wrap {
    flex: 1;
    height: 5px;
    background: ${barTrack};
    border-radius: 999px;
    overflow: hidden;
  }
  .score-bar-fill {
    height: 100%;
    background: ${barFill};
    border-radius: 999px;
    width: ${vibeData.score * 10}%;
  }
  .score-num {
    font-size: clamp(10px, 1.8vw, 13px);
    font-weight: 700;
    color: ${subColor};
    white-space: nowrap;
  }
  .haiku {
    font-size: clamp(12px, 2.5vw, 16px);
    line-height: 1.9;
    font-style: italic;
    color: ${textColor};
    opacity: 0.88;
  }
  .bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .song {
    font-size: clamp(10px, 2vw, 13px);
    color: ${subColor};
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .badge {
    font-size: clamp(8px, 1.4vw, 10px);
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 3px 9px;
    border-radius: 999px;
    background: ${barTrack};
    color: ${subColor};
  }
</style>
</head>
<body>
<div class="noise"></div>
<div class="card">
  <div class="top">
    <span class="label">Vibe Check Machine</span>
    <span class="input-text">"${truncatedInput}"</span>
  </div>
  <div class="middle">
    <div class="mood">${escapeHtml(vibeData.mood)}</div>
    <div class="score-row">
      <div class="score-bar-wrap"><div class="score-bar-fill"></div></div>
      <span class="score-num">${vibeData.score}/10</span>
    </div>
    <div class="haiku">
      ${escapeHtml(vibeData.haiku.line1)}<br>
      ${escapeHtml(vibeData.haiku.line2)}<br>
      ${escapeHtml(vibeData.haiku.line3)}
    </div>
  </div>
  <div class="bottom">
    <div class="song">
      <span>♫</span>
      <span>${escapeHtml(vibeData.theme_song)}</span>
    </div>
    <span class="badge">✦ ${vibeData.color}</span>
  </div>
</div>
</body>
</html>`
}

// ─── Step 1 — analyze the vibe with AI ──────────────────────────────────────

async function analyzeVibe(text: string): Promise<VibeData> {
  'use step'

  const { object } = await generateObject({
    model: gateway('openai/gpt-4o-mini'),
    schema: VibeSchema,
    prompt: `You are a vibe analyst. Analyze the vibe of the following text and return a JSON.

Text: "${text}"

Rules:
- mood: one vivid, evocative word (e.g. "Melancholy", "Electric", "Cozy", "Unhinged", "Serene")
- color: a single hex color that perfectly captures this vibe (e.g. #FF6B9D for pink energy)
- score: integer 1-10 where 1 = pure dread, 5 = neutral, 10 = euphoric
- haiku: 3 lines of haiku (5-7-5 syllables) that poetically capture this exact vibe
- theme_song: one perfect song in format "Artist - Title"`,
  })

  return object
}

// ─── Step 2 — render the vibe card HTML inside a Vercel Sandbox ─────────────
// The sandbox writes the HTML to its filesystem and returns the string.
// No screenshot / browser needed — the frontend renders it in an iframe.

async function renderVibeCard(vibeData: VibeData, inputText: string): Promise<string> {
  'use step'

  const html = buildVibeCardHTML(vibeData, inputText)

  const sandbox = await Sandbox.create({ runtime: 'node24', timeout: 30_000 })
  try {
    await sandbox.writeFiles([
      { path: '/vercel/sandbox/vibe.html', content: html },
    ])

    const buf = await sandbox.readFileToBuffer({ path: '/vercel/sandbox/vibe.html' })
    return buf?.toString('utf8') ?? html
  } finally {
    await sandbox.stop()
  }
}

// ─── Workflow ────────────────────────────────────────────────────────────────

export async function vibeCheckWorkflow(text: string): Promise<VibeCheckResult> {
  'use workflow'

  const vibeData = await analyzeVibe(text)
  const html = await renderVibeCard(vibeData, text)

  return { vibeData, html }
}
