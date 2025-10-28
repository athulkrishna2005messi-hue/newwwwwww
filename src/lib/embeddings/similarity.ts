import { StoredEmbedding, flattenEmbedding } from './storage';

export function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (!Array.isArray(vectorA) || !Array.isArray(vectorB)) {
    return 0;
  }

  const length = Math.min(vectorA.length, vectorB.length);
  if (length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let index = 0; index < length; index += 1) {
    const valueA = Number(vectorA[index]);
    const valueB = Number(vectorB[index]);

    if (!Number.isFinite(valueA) || !Number.isFinite(valueB)) {
      continue;
    }

    dotProduct += valueA * valueB;
    magnitudeA += valueA * valueA;
    magnitudeB += valueB * valueB;
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

export interface SimilarityCandidate<T> {
  item: T;
  embedding: StoredEmbedding | number[];
}

export interface SimilarityMatch<T> {
  item: T;
  score: number;
}

function normalizeEmbedding(embedding: StoredEmbedding | number[]): number[] {
  if (!embedding) {
    return [];
  }

  if (Array.isArray(embedding) && embedding.length > 0 && Array.isArray(embedding[0])) {
    return flattenEmbedding(embedding as StoredEmbedding);
  }

  return (embedding as number[]).filter((value) => Number.isFinite(value)).map((value) => Number(value));
}

export function rankByCosineSimilarity<T>(
  queryEmbedding: number[],
  candidates: Array<SimilarityCandidate<T>>,
  topN = 3
): Array<SimilarityMatch<T>> {
  if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
    return [];
  }

  const results = candidates
    .map<SimilarityMatch<T>>((candidate) => ({
      item: candidate.item,
      score: cosineSimilarity(queryEmbedding, normalizeEmbedding(candidate.embedding)),
    }))
    .filter((match) => Number.isFinite(match.score))
    .sort((a, b) => b.score - a.score);

  return results.slice(0, topN);
}
