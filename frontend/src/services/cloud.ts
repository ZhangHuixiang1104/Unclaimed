import type { SavedProgress } from './progress'

export interface CloudSave {
  progress: SavedProgress | null
  revision: number
  updatedAt: number | null
}

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message) }
}

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  let response: Response
  try {
    response = await fetch(`/api/v1${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...init,
    })
  } catch {
    throw new ApiError('无法连接存档服务，请确认后端已启动。', 0)
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string } | null
    throw new ApiError(typeof body?.detail === 'string' ? body.detail : '请求失败，请稍后重试。', response.status)
  }
  return response.json() as Promise<T>
}

export const cloudApi = {
  me: () => request<{ username: string }>('/auth/me'),
  register: (username: string, password: string) => request<{ username: string }>('/auth/register', {
    method: 'POST', body: JSON.stringify({ username, password }),
  }),
  login: (username: string, password: string) => request<{ username: string }>('/auth/login', {
    method: 'POST', body: JSON.stringify({ username, password }),
  }),
  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  getSave: () => request<CloudSave>('/save'),
  putSave: (progress: SavedProgress, baseRevision: number) => request<CloudSave>('/save', {
    method: 'PUT', body: JSON.stringify({ progress, baseRevision }),
  }),
}
