import { CONTENT_VERSION, type SavedProgress } from './progress'

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
    const body = await response.json().catch(() => null) as { detail?: unknown } | null
    const validation = Array.isArray(body?.detail)
      ? body.detail.slice(0, 3).map((issue: { loc?: unknown; msg?: unknown }) => {
        const location = Array.isArray(issue.loc) ? issue.loc.filter((part) => part !== 'body').join('.') : '存档内容'
        return `${location}: ${typeof issue.msg === 'string' ? issue.msg : '格式不符合要求'}`
      }).join('；')
      : null
    const fallback = response.status >= 500
      ? `存档服务处理失败（HTTP ${response.status}）。账号不会因此删除；请确认后端正在运行，检查服务日志后重试。`
      : `请求未完成（HTTP ${response.status}），请稍后重试。`
    throw new ApiError(typeof body?.detail === 'string' ? body.detail
      : validation ? `存档校验失败（HTTP ${response.status}）：${validation}` : fallback, response.status)
  }
  return response.json() as Promise<T>
}

export const cloudApi = {
  checkCompatibility: async () => {
    const health = await request<{ status?: string; saveContract?: string; identityContract?: string }>('/health')
    if (health.status !== 'ok' || health.saveContract !== CONTENT_VERSION || health.identityContract !== 'account-bound-v1') {
      throw new ApiError('存档服务版本与当前页面不一致。请关闭旧的前后端进程，再从项目根目录重新启动。', 426)
    }
  },
  me: () => request<{ username: string }>('/auth/me'),
  register: (username: string, password: string) => request<{ username: string }>('/auth/register', {
    method: 'POST', body: JSON.stringify({ username, password }),
  }),
  login: (username: string, password: string) => request<{ username: string }>('/auth/login', {
    method: 'POST', body: JSON.stringify({ username, password }),
  }),
  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  getSave: (username: string) => request<CloudSave>('/save', {
    headers: { 'Content-Type': 'application/json', 'X-Archive-Username': username },
  }),
  putSave: (progress: SavedProgress, baseRevision: number, username: string) => request<CloudSave>('/save', {
    method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Archive-Username': username },
    body: JSON.stringify({ progress, baseRevision }),
  }),
}
