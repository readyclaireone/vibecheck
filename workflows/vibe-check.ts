import { generateObject } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

const gateway = createOpenAI({ baseURL: process.env.AI_GATEWAY_URL ?? 'https://ai-gateway.vercel.sh/v1', apiKey: process.env.AI_GATEWAY_API_KEY ?? '' })
import { z } from 'zod'
import { Sandbox } from '@vercel/sandbox'

export const VibeSchema = z.object({
  mood: z.string().describe('A single evocative word capturing the emotional vibe'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).describe('A hex color that captures this vibe'),
  score: z.number().min(1).max(10).describe('Vibe score from 1 (dread) to 10 (pure euphoria)'),
  haiku: z.object({ line1: z.string(), line2: z.string(), line3: z.string() }).describe('Three haiku lines inspired by this vibe'),
  theme_song: z.string().describe('Artist - Song Title that matches this vibe'),
})

export type VibeData = z.infer<typeof VibeSchema>

export interface VibeCheckResult {
  vibeData: VibeData
  screenshotBase64: string
}

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

function buildVibeCardHTML(vibeData: VibeData, inputText: string): string {
  const light = isLightColor(vibeData.color)
  const textColor = light ? '#1a1a2e' : '#ffffff'
  const subColor = light ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)'
  const barTrack = light ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)'
  const barFill = light ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)'
  const accent = adjustColor(vibeData.color, light ? -60 : 60)
  const gradientEnd = adjustColor(vibeData.color, light ? -30 : -50)

  const truncatedInput = inputText.length > 70
    ? inputText.slice(0, 70) + '…'
    : inputText

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
  body {
    width: 640px;
    height: 400px;
    overflow: hidden;
    background: linear-gradient(135deg, ${vibeData.color} 0%, ${gradientEnd} 100%);
    font-family: 'Inter', -apple-system, sans-serif;
    color: ${textColor};
    position: relative;
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
    padding: 36px 44px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .top { display: flex; flex-direction: column; gap: 4px; }
  .label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: ${subColor};
  }
  .input-text {
    font-size: 14px;
    color: ${subColor};
    font-style: italic;
    max-width: 460px;
  }
  .middle { display: flex; flex-direction: column; gap: 10px; }
  .mood {
    font-size: 56px;
    font-weight: 900;
    letter-spacing: -3px;
    line-height: 1;
    text-transform: uppercase;
    color: ${textColor};
  }
  .score-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .score-bar-wrap {
    flex: 1;
    height: 6px;
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
    font-size: 13px;
    font-weight: 700;
    color: ${subColor};
    white-space: nowrap;
  }
  .haiku {
    font-size: 16px;
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
    font-size: 13px;
    color: ${subColor};
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .song-icon { font-size: 14px; }
  .badge {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 4px 10px;
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
    <div class="mood">${vibeData.mood}</div>
    <div class="score-row">
      <div class="score-bar-wrap"><div class="score-bar-fill"></div></div>
      <span class="score-num">${vibeData.score}/10</span>
    </div>
    <div class="haiku">
      ${vibeData.haiku[0]}<br>
      ${vibeData.haiku[1]}<br>
      ${vibeData.haiku[2]}
    </div>
  </div>
  <div class="bottom">
    <div class="song">
      <span class="song-icon">♫</span>
      <span>${vibeData.theme_song}</span>
    </div>
    <span class="badge">✦ ${vibeData.color}</span>
  </div>
</div>
</body>
</html>`
}

const SCREENSHOT_SCRIPT = `
import puppeteer from 'puppeteer'
import fs from 'fs'

const html = fs.readFileSync('/vercel/sandbox/vibe.html', 'utf8')

const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--window-size=640,400',
  ],
})

const page = await browser.newPage()
await page.setViewport({ width: 640, height: 400, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'domcontentloaded' })
// small delay for font rendering
await new Promise(r => setTimeout(r, 500))
await page.screenshot({ path: '/vercel/sandbox/output.png', type: 'png', clip: { x: 0, y: 0, width: 640, height: 400 } })
await browser.close()
process.exit(0)
`

// Step 1 — analyze the vibe with AI
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

// Step 2 — spin up a Vercel Sandbox, render the card HTML, and screenshot it
async function renderVibeCard(vibeData: VibeData, inputText: string): Promise<string> {
  'use step'

  const html = buildVibeCardHTML(vibeData, inputText)

  const sandbox = await Sandbox.create({
    runtime: 'node24',
    timeout: 180_000,
  })

  try {
    await sandbox.writeFiles([
      {
        path: '/vercel/sandbox/vibe.html',
        content: html,
      },
      {
        path: '/vercel/sandbox/package.json',
        content: JSON.stringify({ type: 'module', dependencies: { puppeteer: '^22.0.0' } }),
      },
      {
        path: '/vercel/sandbox/screenshot.mjs',
        content: SCREENSHOT_SCRIPT,
      },
    ])

    // Install puppeteer (downloads Chromium ~170 MB — takes ~60s first run)
    const install = await sandbox.runCommand({
      cmd: 'npm',
      args: ['install', '--prefer-offline'],
      cwd: '/vercel/sandbox',
    })

    if (install.exitCode !== 0) {
      const stderr = await install.stderr()
      throw new Error(`npm install failed: ${stderr}`)
    }

    // Take the screenshot
    const screenshot = await sandbox.runCommand({
      cmd: 'node',
      args: ['screenshot.mjs'],
      cwd: '/vercel/sandbox',
    })

    if (screenshot.exitCode !== 0) {
      const stderr = await screenshot.stderr()
      throw new Error(`Screenshot failed: ${stderr}`)
    }

    const pngBuffer = await sandbox.readFileToBuffer({ path: '/vercel/sandbox/output.png' })

    if (!pngBuffer) {
      throw new Error('Screenshot file not found')
    }

    return pngBuffer.toString('base64')
  } finally {
    await sandbox.stop()
  }
}

// Main workflow — orchestrates the two steps
export async function vibeCheckWorkflow(text: string): Promise<VibeCheckResult> {
  'use workflow'

  const vibeData = await analyzeVibe(text)
  const screenshotBase64 = await renderVibeCard(vibeData, text)

  return { vibeData, screenshotBase64 }
}
