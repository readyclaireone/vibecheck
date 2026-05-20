'use client'

import { useState, useRef, FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { VibeData } from '@/workflows/vibe-check'

type VibeResult = {
  vibeData: VibeData
  screenshot: string
}

const LOADING_MESSAGES = [
  'Reading the vibes...',
  'Consulting the vibe oracle...',
  'Tuning into the frequency...',
  'Decoding the energy...',
  'Rendering your aura...',
]

export default function Home() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<VibeResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0])
  const msgIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    setLoading(true)
    setError(null)
    setResult(null)

    // Cycle through loading messages
    let i = 0
    msgIntervalRef.current = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length
      setLoadingMsg(LOADING_MESSAGES[i])
    }, 2800)

    try {
      const res = await fetch('/api/vibe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Something went wrong')
      }

      setResult(data)
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
      if (msgIntervalRef.current) clearInterval(msgIntervalRef.current)
    }
  }

  const vibeColor = result?.vibeData.color ?? '#8B5CF6'

  return (
    <main className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-start px-4 py-16 md:py-24">
      {/* Header */}
      <div className="text-center mb-12 space-y-3">
        <div className="text-5xl mb-2">✨</div>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
          Vibe Check Machine
        </h1>
        <p className="text-white/40 text-base max-w-xs mx-auto leading-relaxed">
          Drop a situation, feeling, or random thought. Get your vibe card.
        </p>
      </div>

      {/* Input form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl flex flex-col gap-4"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type anything... a mood, a moment, a vibe."
          disabled={loading}
          maxLength={500}
          className="text-lg"
          autoFocus
        />
        <Button
          type="submit"
          disabled={loading || !input.trim()}
          size="lg"
          className="w-full font-black text-lg tracking-wide"
        >
          {loading ? (
            <span className="flex items-center gap-3">
              <svg
                className="animate-spin h-5 w-5 text-black/50"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {loadingMsg}
            </span>
          ) : (
            'Check the Vibe ✨'
          )}
        </Button>
      </form>

      {/* Error state */}
      {error && (
        <div className="mt-8 w-full max-w-xl rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Loading shimmer card placeholder */}
      {loading && (
        <div className="mt-12 w-full max-w-2xl">
          <div
            className="rounded-2xl overflow-hidden"
            style={{ aspectRatio: '640/400' }}
          >
            <div className="w-full h-full bg-gradient-to-r from-white/5 via-white/10 to-white/5 animate-shimmer bg-[length:200%_100%] rounded-2xl" />
          </div>
          <p className="text-center text-white/30 text-sm mt-4">
            Spinning up a sandbox &amp; rendering your vibe card...
          </p>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div ref={resultRef} className="mt-12 w-full max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Vibe card image */}
          <div
            className="rounded-2xl overflow-hidden shadow-2xl ring-1"
            style={{
              boxShadow: `0 0 60px ${vibeColor}40, 0 0 120px ${vibeColor}20`,
              
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/png;base64,${result.screenshot}`}
              alt={`Vibe card: ${result.vibeData.mood}`}
              className="w-full h-auto block"
              style={{ imageRendering: 'auto' }}
            />
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Pill label="Mood" value={result.vibeData.mood} color={vibeColor} />
            <Pill label="Score" value={`${result.vibeData.score}/10`} color={vibeColor} />
            <Pill label="Color" value={result.vibeData.color} color={vibeColor} />
            <Pill label="Song" value={result.vibeData.theme_song} color={vibeColor} wide />
          </div>

          {/* Try again */}
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setResult(null)
                setInput('')
              }}
            >
              Check another vibe
            </Button>
          </div>
        </div>
      )}
    </main>
  )
}

function Pill({
  label,
  value,
  color,
  wide = false,
}: {
  label: string
  value: string
  color: string
  wide?: boolean
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm border border-white/10 bg-white/5 backdrop-blur-sm ${wide ? 'max-w-xs' : ''}`}
    >
      <span className="text-white/40 text-xs uppercase tracking-wider font-semibold">{label}</span>
      <span className="text-white font-medium truncate">{value}</span>
    </div>
  )
}
