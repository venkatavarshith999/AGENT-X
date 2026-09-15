function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If not running on local development (e.g. vercel.app), ALWAYS use relative '/api'
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return '/api';
    }
  }

  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    if (typeof window !== 'undefined' && envUrl.includes('localhost') && window.location.hostname !== 'localhost') {
      return '/api';
    }
    return envUrl;
  }

  return '/api';
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('agentx_token');
  }
  return null;
}

export function setAuthToken(token: string | null) {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('agentx_token', token);
    } else {
      localStorage.removeItem('agentx_token');
    }
  }
}

export function getUser(): any | null {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('agentx_user');
    return raw ? JSON.parse(raw) : null;
  }
  return null;
}

export function setUser(user: any | null) {
  if (typeof window !== 'undefined') {
    if (user) {
      localStorage.setItem('agentx_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('agentx_user');
    }
  }
}

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const baseUrl = getApiBaseUrl();
  let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (baseUrl === '/api' && cleanEndpoint.startsWith('/api/')) {
    cleanEndpoint = cleanEndpoint.substring(4);
  }

  const targetUrl = baseUrl.endsWith('/')
    ? `${baseUrl.slice(0, -1)}${cleanEndpoint}`
    : `${baseUrl}${cleanEndpoint}`;

  const response = await fetch(targetUrl, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP error! Status: ${response.status}`);
  }

  return data;
}
