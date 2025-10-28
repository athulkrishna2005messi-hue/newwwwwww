'use server';

const DEFAULT_ENDPOINT = 'https://api-inference.huggingface.co';

export interface HuggingFaceClientConfig {
  apiKey: string | null;
  endpoint: string;
}

export function getHuggingFaceClientConfig(): HuggingFaceClientConfig {
  const apiKey = process.env.HUGGINGFACE_API_KEY ?? null;
  const endpoint = process.env.HUGGINGFACE_INFERENCE_BASE_URL ?? DEFAULT_ENDPOINT;

  return {
    apiKey,
    endpoint,
  };
}

export function isHuggingFaceConfigured(): boolean {
  return Boolean(process.env.HUGGINGFACE_API_KEY);
}
