const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP error! Status: ${response.status}`);
  }

  return data;
}
