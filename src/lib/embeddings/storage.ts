export const DEFAULT_CHUNK_MAX_BYTES = 1024;
export const BYTES_PER_NUMBER = 8;
export const DEFAULT_CHUNK_SIZE = Math.floor(DEFAULT_CHUNK_MAX_BYTES / BYTES_PER_NUMBER);

export type EmbeddingChunk = number[];
export type StoredEmbedding = EmbeddingChunk[];

function sanitizeEmbedding(embedding: number[]): number[] {
  return embedding.filter((value) => Number.isFinite(value)).map((value) => Number(value));
}

export function chunkEmbedding(embedding: number[], chunkSize = DEFAULT_CHUNK_SIZE): StoredEmbedding {
  const sanitized = sanitizeEmbedding(embedding);

  if (chunkSize <= 0) {
    throw new Error('Chunk size must be greater than zero.');
  }

  const chunks: StoredEmbedding = [];
  for (let index = 0; index < sanitized.length; index += chunkSize) {
    const chunk = sanitized.slice(index, index + chunkSize);
    if (chunk.length) {
      chunks.push(chunk);
    }
  }

  return chunks;
}

export function flattenEmbedding(chunks: StoredEmbedding): number[] {
  if (!Array.isArray(chunks)) {
    return [];
  }

  return chunks.reduce<number[]>((accumulator, chunk) => {
    if (Array.isArray(chunk)) {
      for (const value of chunk) {
        if (Number.isFinite(value)) {
          accumulator.push(Number(value));
        }
      }
    }

    return accumulator;
  }, []);
}

export function serializeEmbedding(embedding: number[], chunkSize = DEFAULT_CHUNK_SIZE): StoredEmbedding {
  return chunkEmbedding(embedding, chunkSize);
}

export function deserializeEmbedding(stored: StoredEmbedding): number[] {
  return flattenEmbedding(stored);
}
