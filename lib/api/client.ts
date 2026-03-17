const getBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || ''

export async function apiClient<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, ...init } = options
  const base = getBaseUrl().replace(/\/$/, '')
  const pathStr = path.startsWith('/') ? path : `/${path}`
  const url =
    path.startsWith('http') ? path : base ? `${base}${pathStr}` : `/api${pathStr}`
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(url, { ...init, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error((err as { message?: string }).message || `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export function getAuthHeaders(token: string | null): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
}
