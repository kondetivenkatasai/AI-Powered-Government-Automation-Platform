export const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '');
  }
  return '/api/v1';
};

const fetchWithRetry = async (url: string, options: RequestInit = {}, retries: number = 3, delayMs: number = 3000): Promise<Response> => {
  let lastError: any = null;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (err: any) {
      lastError = err;
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
};

export const apiFetch = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = localStorage.getItem('govflow_token');
  const baseUrl = getApiBaseUrl();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  try {
    const response = await fetchWithRetry(`${baseUrl}${cleanEndpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Session expired or invalid authentication token (401). Please log in again.');
      }
      throw new Error(data.detail || 'An unexpected API error occurred');
    }

    return data as T;
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error('Unable to connect to backend server. Please ensure the backend service is running.');
    }
    throw err;
  }
};

export const apiFormUpload = async <T>(endpoint: string, formData: FormData): Promise<T> => {
  const token = localStorage.getItem('govflow_token');
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetchWithRetry(`${baseUrl}${cleanEndpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Session expired or invalid authentication token (401). Please log in again.');
      }
      throw new Error(data.detail || 'An unexpected API error occurred during file upload');
    }

    return data as T;
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error('Unable to connect to backend server. Please ensure the backend service is running.');
    }
    throw err;
  }
};
