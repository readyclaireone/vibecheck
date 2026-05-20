import { vibeCheckWorkflow } from '@/workflows/vibe-check'

// Sandbox write/read is fast — 30s is plenty
export const maxDuration = 60

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)

  if (!body || typeof body.text !== 'string' || !body.text.trim()) {
    return Response.json({ error: 'Missing or invalid text field' }, { status: 400 })
  }

  const text = body.text.trim().slice(0, 500)

  try {
    const result = await vibeCheckWorkflow(text)
    return Response.json({
      vibeData: result.vibeData,
      html: result.html,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[vibe] workflow error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
