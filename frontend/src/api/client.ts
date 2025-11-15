// Base API client with fetch wrapper

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  status: number;
  statusText: string;
  data?: unknown;

  constructor(
    message: string,
    status: number,
    statusText: string,
    data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  if (!response.ok) {
    let errorData: unknown;
    let errorMessage = `Request failed: ${response.statusText}`;

    if (isJson) {
      try {
        errorData = await response.json();
        // Try to extract error message from common formats
        if (typeof errorData === 'object' && errorData !== null) {
          const data = errorData as Record<string, unknown>;
          errorMessage = (data.message || data.error || data.title || errorMessage) as string;
        }
      } catch {
        // Failed to parse JSON error
      }
    } else {
      try {
        errorMessage = await response.text();
      } catch {
        // Failed to read text
      }
    }

    throw new ApiError(errorMessage, response.status, response.statusText, errorData);
  }

  // Handle empty responses
  if (response.status === 204 || !isJson) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(`${API_BASE_URL}${endpoint}`, window.location.origin);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

export async function apiGet<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  const url = buildUrl(endpoint, options?.params);
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  return handleResponse<T>(response);
}

export async function apiPost<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
  const url = buildUrl(endpoint, options?.params);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });

  return handleResponse<T>(response);
}

export async function apiPut<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
  const url = buildUrl(endpoint, options?.params);
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });

  return handleResponse<T>(response);
}

export async function apiDelete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  const url = buildUrl(endpoint, options?.params);
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  return handleResponse<T>(response);
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}
