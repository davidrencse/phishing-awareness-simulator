import { ApiErrorShape } from '../types';

const API_BASE_URL = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env
  .VITE_API_BASE_URL || 'http://localhost:3000';

function buildUrl(path: string, query?: Record<string, string | undefined>) {
  const url = new URL(path, API_BASE_URL);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, value);
      }
    });
  }
  return url.toString();
}

export async function apiRequest<T>(path: string, options?: RequestInit, query?: Record<string, string | undefined>): Promise<T> {
  const response = await fetch(buildUrl(path, query), {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  const parsed = text ? (JSON.parse(text) as T | ApiErrorShape) : undefined;

  if (!response.ok) {
    const error = (parsed as ApiErrorShape | undefined)?.error;
    throw {
      error: {
        code: error?.code || `HTTP_${response.status}`,
        message: error?.message || `Request failed with status ${response.status}.`,
        details: error?.details,
      },
    } satisfies ApiErrorShape;
  }

  return parsed as T;
}
