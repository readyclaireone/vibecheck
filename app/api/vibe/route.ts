import { start } from 'workflow/api'
import { vibeCheckWorkflow } from '@/workflows/vibe-check'

export const maxDuration = 60

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)

  if (!body || typeof body.text !== 'string' || !body.text.trim()) {
    return Response.json({ error: 'Missing or invalid text field' }, { status: 400 })
  }

  const text = body.text.trim().slice(0, 500)

  try {
    // start() registers the run with Vercel Workflows and returns a Run handle.
    // run.returnValue polls until the workflow completes and returns the result.
    const run = await start(vibeCheckWorkflow, [text])
    const result = await run.returnValue

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
