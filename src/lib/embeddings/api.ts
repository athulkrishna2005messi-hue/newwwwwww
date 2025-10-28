const EMBEDDINGS_ENDPOINT = '/api/hf/embeddings';

export async function requestEmbedding(text: string, signal?: AbortSignal): Promise<number[]> {
  const sanitized = text.trim();

  if (!sanitized) {
    throw new Error('Embedding input cannot be empty.');
  }

  const response = await fetch(EMBEDDINGS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input: sanitized }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to generate embedding.');
  }

  const payload = (await response.json()) as { embedding?: number[] };

  if (!payload.embedding || !Array.isArray(payload.embedding)) {
    throw new Error('Embedding response was invalid.');
  }

  return payload.embedding.map((value) => Number(value)).filter((value) => Number.isFinite(value));
}
