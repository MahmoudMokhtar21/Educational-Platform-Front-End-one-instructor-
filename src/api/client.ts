import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import type { LoginResponse } from '../types/api'

// Production is served by the ASP.NET host, so the API shares the page origin.
// The absolute URL keeps the existing Vite dev server talking to the API directly.
const apiBaseUrl = import.meta.env.VITE_API_URL?.trim() || (import.meta.env.PROD ? '/api' : 'https://localhost:7031/api')
const staticOrigin = /^https?:\/\//i.test(apiBaseUrl) ? apiBaseUrl.replace(/\/api\/?$/, '') : ''
const mediaFields = new Set(['thumbnailUrl', 'trailerUrl', 'courseThumbnail', 'logoUrl', 'profilePictureUrl', 'authorProfilePictureUrl'])
const accessTokenKey = 'edu_token'
const csrfTokenKey = 'edu_csrf'

type RefreshAwareConfig = InternalAxiosRequestConfig & {
  _refreshAttempted?: boolean
  skipAuthRefresh?: boolean
}

type RefreshRequestConfig = AxiosRequestConfig & {
  skipAuthRefresh?: boolean
}

/** Resolves API-provided static paths (for example /uploads/thumbnails/a.jpg) against the API host, never the Vite host. */
export const resolveMediaUrl = (value: string) => {
  if (/^https?:\/\//i.test(value) || value.startsWith('blob:') || value.startsWith('data:')) return value
  const path = value.startsWith('/') ? value : `/${value}`
  return staticOrigin ? new URL(path, staticOrigin).toString() : path
}

const normalizeMediaUrls = <T,>(data: T): T => {
  if (Array.isArray(data)) return data.map(normalizeMediaUrls) as T
  if (!data || typeof data !== 'object') return data

  return Object.fromEntries(Object.entries(data as Record<string, unknown>).map(([key, value]) => {
    if (mediaFields.has(key) && typeof value === 'string' && value) return [key, resolveMediaUrl(value)]
    return [key, normalizeMediaUrls(value)]
  })) as T
}

const getAccessToken = () => localStorage.getItem(accessTokenKey)
const getCsrfToken = () => sessionStorage.getItem(csrfTokenKey)

export const persistAuthSession = (session: Pick<LoginResponse, 'token' | 'csrfToken'>) => {
  localStorage.setItem(accessTokenKey, session.token)
  sessionStorage.setItem(csrfTokenKey, session.csrfToken)
}

export const clearAuthSession = () => {
  localStorage.removeItem(accessTokenKey)
  sessionStorage.removeItem(csrfTokenKey)
}

const isRefreshOrLogoutRequest = (url?: string) => /\/authentication\/(refresh|logout)(?:[/?]|$)/i.test(url ?? '')
const isAuthenticationRequest = (url?: string) => /\/authentication\/(?:login|register|resend-verification|forgot-password|reset-password|verify-email|refresh|logout)(?:[/?]|$)/i.test(url ?? '')

const client = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000,
  withCredentials: true,
  headers: { Accept: 'application/json' }
})

client.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`

  if (isRefreshOrLogoutRequest(config.url)) {
    const csrfToken = getCsrfToken()
    if (csrfToken) config.headers['X-CSRF-Token'] = csrfToken
  }

  return config
})

let refreshPromise: Promise<LoginResponse> | null = null

/**
 * Uses the HttpOnly refresh-cookie flow. The opaque refresh token is never
 * exposed to, stored in, or logged by browser JavaScript.
 */
export const refreshSession = () => {
  if (!refreshPromise) {
    refreshPromise = client.post<LoginResponse>('/Authentication/refresh', undefined, { skipAuthRefresh: true } as RefreshRequestConfig)
      .then(({ data }) => {
        persistAuthSession(data)
        return data
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

/** Sends an explicitly CSRF-protected logout request before local state is cleared. */
export const logoutSession = () => {
  const csrfToken = getCsrfToken()
  return client.post('/Authentication/logout', undefined, {
    skipAuthRefresh: true,
    headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : undefined
  } as RefreshRequestConfig)
}

const dispatchUnauthorized = () => window.dispatchEvent(new Event('edu:unauthorized'))

client.interceptors.response.use(
  (response) => {
    response.data = normalizeMediaUrls(response.data)
    return response
  },
  async (error: AxiosError) => {
    const request = error.config as RefreshAwareConfig | undefined
    const canRefresh = error.response?.status === 401 &&
      request &&
      !request._refreshAttempted &&
      !request.skipAuthRefresh &&
      !isAuthenticationRequest(request.url) &&
      Boolean(getAccessToken())

    if (canRefresh) {
      request._refreshAttempted = true

      try {
        const refreshed = await refreshSession()
        request.headers.Authorization = `Bearer ${refreshed.token}`
        return client.request(request)
      } catch {
        clearAuthSession()
        dispatchUnauthorized()
      }
    } else if (error.response?.status === 401 && request && !isAuthenticationRequest(request.url)) {
      clearAuthSession()
      dispatchUnauthorized()
    }

    return Promise.reject(error)
  }
)

export const getErrorMessage = (error: unknown) => {
  if (!axios.isAxiosError(error)) return 'Something went wrong. Please try again.'
  if (error.code === 'ECONNABORTED') return 'The request timed out. Please try again.'
  if (!error.response) return 'Unable to reach the server. Confirm that the API is running, then try again.'
  const validationErrors = error.response.data?.errors as Record<string, string[]> | undefined
  if (validationErrors) return Object.values(validationErrors).flat().find(Boolean) ?? 'Please check the submitted values and try again.'
  return error.response.data?.message ?? 'Something went wrong. Please try again.'
}

/** A machine-readable Paymob validation response; never infer this from translated text. */
export const isPaymobPhoneRequiredError = (error: unknown) => {
  if (!axios.isAxiosError(error)) return false
  const response = error.response?.data as { code?: unknown; errorCode?: unknown; requiresPhone?: unknown } | undefined
  const code = String(response?.code ?? response?.errorCode ?? '').toLowerCase()
  return response?.requiresPhone === true || code === 'paymob_phone_required' || code === 'payment_phone_required'
}
export default client
