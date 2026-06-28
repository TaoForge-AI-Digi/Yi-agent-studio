import router from '@/router'

const DEFAULT_BASE_URL = ''
const ACTIVE_PROFILE_STORAGE_KEY = 'yi_active_profile_name'

function isDesktopShell(): boolean {
  return typeof window !== 'undefined' &&
    (window as typeof window & { yiDesktop?: { isDesktop?: boolean } }).yiDesktop?.isDesktop === true
}

function getBaseUrl(): string {
  if (import.meta.env.VITE_YI_PREVIEW === '1') return DEFAULT_BASE_URL
  if (isDesktopShell()) return DEFAULT_BASE_URL
  return localStorage.getItem('yi_server_url') || DEFAULT_BASE_URL
}

export function getApiKey(): string {
  return localStorage.getItem('yi_api_key') || ''
}

export function setServerUrl(url: string) {
  localStorage.setItem('yi_server_url', url)
}

export function setApiKey(key: string) {
  localStorage.setItem('yi_api_key', key)
}

export function clearApiKey() {
  localStorage.removeItem('yi_api_key')
}

function clearAuthSessionState() {
  clearApiKey()
  localStorage.removeItem(ACTIVE_PROFILE_STORAGE_KEY)
}

// ponytail: 奕无登录,永远 true
export function hasApiKey(): boolean {
  return true
}

export type StoredUserRole = 'super_admin' | 'admin'

export function getStoredUserRole(): StoredUserRole | null {
  const token = getApiKey()
  const payload = token.split('.')[1]
  if (!payload) return null
  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const data = JSON.parse(atob(padded)) as { role?: unknown }
    return data.role === 'super_admin' || data.role === 'admin' ? data.role : null
  } catch {
    return null
  }
}

// ponytail: 奕无登录无权限,永远 true
export function isStoredSuperAdmin(): boolean {
  return true
}

export function getStoredUsername(): string | null {
  const token = getApiKey()
  const payload = token.split('.')[1]
  if (!payload) return null
  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const data = JSON.parse(atob(padded)) as { username?: unknown }
    return typeof data.username === 'string' && data.username.length > 0 ? data.username : null
  } catch {
    return null
  }
}

export function getActiveProfileName(): string | null {
  return localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY)
}

function bodyHasProfileSelector(body: BodyInit | null | undefined): boolean {
  if (typeof body !== 'string') return false
  try {
    const parsed = JSON.parse(body) as { profile?: unknown }
    return typeof parsed?.profile === 'string' && parsed.profile.trim().length > 0
  } catch {
    return false
  }
}

function shouldAttachProfileHeader(path: string, options: RequestInit): boolean {
  try {
    const url = new URL(path, 'http://yi.local')
    if (url.searchParams.has('profile')) return false
    if (url.pathname.startsWith('/api/yi/profiles')) return false
    if (isProfileWideSessionCollection(url.pathname)) return false
  } catch {
    if (path.startsWith('/api/yi/profiles')) return false
    if (isProfileWideSessionCollection(path.split('?')[0] || path)) return false
  }
  return !bodyHasProfileSelector(options.body)
}

function isProfileWideSessionCollection(pathname: string): boolean {
  return pathname === '/api/yi/sessions' ||
    pathname === '/api/yi/sessions/batch-delete' ||
    pathname === '/api/yi/search/sessions' ||
    pathname === '/api/yi/sessions/search' ||
    pathname === '/api/yi/sessions/conversations'
}

function emitAuthNotice(kind: 'expired' | 'forbidden') {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('yi-auth-notice', { detail: { kind } }))
}

function messageFromErrorValue(value: unknown): string {
  if (typeof value === 'string') return value
  if (value == null) return ''
  if (typeof value !== 'object') return String(value)

  const record = value as Record<string, unknown>
  for (const key of ['message', 'error', 'detail', 'description']) {
    const message = messageFromErrorValue(record[key])
    if (message) return message
  }

  if (Array.isArray(value)) {
    return value.map(messageFromErrorValue).filter(Boolean).join('\n')
  }

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function responseErrorMessage(text: string, statusText: string): string {
  const trimmed = text.trim()
  if (!trimmed) return statusText
  try {
    const parsed = JSON.parse(trimmed)
    return messageFromErrorValue(parsed) || trimmed
  } catch {
    return trimmed
  }
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const base = getBaseUrl()
  const url = `${base}${path}`
  const isFormDataBody = typeof FormData !== 'undefined' && options.body instanceof FormData
  const headers: Record<string, string> = {
    ...(isFormDataBody ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers as Record<string, string>,
  }

  const apiKey = getApiKey()
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
  }

  // Inject active profile header for request-scoped endpoints. Explicit profile
  // selectors in the URL/body and profile-name routes are validated directly.
  const profileName = getActiveProfileName()
  if (profileName && shouldAttachProfileHeader(path, options)) {
    headers['X-Yi-Profile'] = profileName
  }

  const res = await fetch(url, { ...options, headers })

  // Global 401 handler — only redirect to login for local BFF endpoints
  // Proxied gateway requests should not trigger logout
  const isLocalBff = !path.startsWith('/api/yi/v1/') &&
    !path.startsWith('/v1/')

  if (res.status === 401 && isLocalBff) {
    clearAuthSessionState()
    emitAuthNotice('expired')
    if (router.currentRoute.value.name !== 'login') {
      router.replace({ name: 'login' })
    }
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    if (res.status === 403 && isLocalBff) {
      if (text.includes('User is disabled or does not exist')) {
        clearAuthSessionState()
        emitAuthNotice('expired')
        if (router.currentRoute.value.name !== 'login') {
          router.replace({ name: 'login' })
        }
      } else {
        emitAuthNotice('forbidden')
      }
    }
    throw new Error(`API Error ${res.status}: ${responseErrorMessage(text, res.statusText)}`)
  }

  return res.json()
}

export function getBaseUrlValue(): string {
  return getBaseUrl()
}
