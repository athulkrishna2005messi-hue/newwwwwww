import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';

export const dynamic = 'force-dynamic';

function extractEmbedding(payload: unknown): number[] | null {
  if (!payload) {
    return null;
  }

  if (Array.isArray(payload)) {
    if (payload.length === 0) {
      return null;
    }

    const [first] = payload;

    if (Array.isArray(first)) {
      return first.filter((value) => Number.isFinite(value)).map((value) => Number(value));
    }

    if (first && typeof first === 'object' && Array.isArray((first as Record<string, unknown>).embedding)) {
      return (first as { embedding: number[] }).embedding
        .filter((value) => Number.isFinite(value))
        .map((value) => Number(value));
    }
  }

  if (typeof payload === 'object') {
    const data = payload as { embedding?: number[]; data?: Array<{ embedding?: number[] }> };

    if (Array.isArray(data.embedding)) {
      return data.embedding.filter((value) => Number.isFinite(value)).map((value) => Number(value));
    }

    if (Array.isArray(data.data)) {
      const first = data.data.find((item) => Array.isArray(item?.embedding));
      if (first && Array.isArray(first.embedding)) {
        return first.embedding.filter((value) => Number.isFinite(value)).map((value) => Number(value));
      }
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { input?: string };
    const input = body.input?.trim();

    if (!input) {
      return NextResponse.json({ error: 'Input text is required.' }, { status: 400 });
    }

    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Hugging Face API key is not configured.' }, { status: 500 });
    }

    const model = process.env.HF_EMBEDDING_MODEL ?? DEFAULT_MODEL;

    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: input }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: 'Failed to generate embedding from Hugging Face.',
          details: errorText,
        },
        { status: response.status }
      );
    }

    const payload = await response.json();
    const embedding = extractEmbedding(payload);

    if (!embedding || embedding.length === 0) {
      return NextResponse.json(
        {
          error: 'Embedding response from Hugging Face was empty.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ embedding });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Embedding generation failed.',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
