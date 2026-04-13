import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const { recordingId, checklistId } = await request.json()

    if (!recordingId || !checklistId) {
      return NextResponse.json({ error: 'recordingId and checklistId are required' }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 })
    }

    // Fetch transcript + checklist in parallel
    const [recording, checklist] = await Promise.all([
      prisma.callRecording.findUnique({
        where: { id: recordingId },
        include: { transcript: true },
      }),
      prisma.checklist.findUnique({
        where: { id: checklistId },
        include: { items: { orderBy: { order: 'asc' } } },
      }),
    ])

    if (!recording) return NextResponse.json({ error: 'Recording not found' }, { status: 404 })
    if (!checklist) return NextResponse.json({ error: 'Checklist not found' }, { status: 404 })

    const transcriptLines = (recording.transcript?.lines as any[]) ?? []
    if (!transcriptLines.length) {
      return NextResponse.json({ error: 'No transcript available for this recording' }, { status: 422 })
    }

    const transcriptText = transcriptLines
      .map((l: any) => `[${l.speakerRole === 'rep' ? 'REP' : 'LEAD'} ${l.speaker} @ ${l.timestamp}s]: ${l.text}`)
      .join('\n')

    const checklistText = checklist.items
      .map((item) => `- ID: ${item.id}\n  Criterion: ${item.text}\n  Type: ${item.type}\n  Weight: ${item.weight}`)
      .join('\n')

    const systemPrompt = `You are a sales call quality reviewer. You will be given a call transcript and a checklist of quality criteria. Analyze the call and return a verdict for each checklist item.

For each item, provide:
- verdict: "pass" | "fail" | "unclear"
  - pass: the rep clearly did this
  - fail: the rep clearly did NOT do this
  - unclear: not enough evidence to judge
- reasoning: 1-2 sentences explaining your verdict (in the same language as the transcript — Uzbek or Russian)

Be objective and evidence-based. Quote or reference specific moments from the transcript in your reasoning.`

    const userPrompt = `TRANSCRIPT:
${transcriptText}

CHECKLIST CRITERIA TO EVALUATE:
${checklistText}

Return a JSON object with this exact structure:
{
  "verdicts": {
    "<item_id>": {
      "verdict": "pass" | "fail" | "unclear",
      "reasoning": "...",
      "manualOverride": false
    }
  },
  "overallSummary": "2-3 sentence overall assessment of the call"
}`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) || rawText.match(/(\{[\s\S]*\})/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI response was not valid JSON' }, { status: 500 })
    }

    const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0])
    return NextResponse.json({
      verdicts: parsed.verdicts ?? {},
      summary: parsed.overallSummary ?? '',
    })
  } catch (error: any) {
    console.error('POST /api/ai-review error:', error)
    if (error?.status === 401) return NextResponse.json({ error: 'Invalid Anthropic API key' }, { status: 401 })
    return NextResponse.json({ error: error?.message ?? 'Internal server error' }, { status: 500 })
  }
}
