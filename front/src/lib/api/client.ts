const PROD_API_URL = 'https://api.notfounds.dev'

const isLocalHost =
  typeof window !== 'undefined' &&
  /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(window.location.hostname)

const API_BASE_URL = isLocalHost
  ? import.meta.env.VITE_API_URL || 'http://localhost:1488'
  : PROD_API_URL

export class ApiClient {
  private static getAuthToken(): string | null {
    return localStorage.getItem('auth_token') || localStorage.getItem('inspector_token')
  }

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken()
    const headers: HeadersInit = {
      // Required to bypass localtunnel's confirmation page
      'bypass-tunnel-reminder': 'true',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    }

    // Only set application/json if Content-Type is not explicitly overridden or deleted
    if (!('Content-Type' in (options.headers || {}))) {
      (headers as Record<string, string>)['Content-Type'] = 'application/json'
    } else if ((headers as Record<string, string>)['Content-Type'] === 'multipart/form-data') {
      // Remove it so the browser sets it with the correct boundary
      delete (headers as Record<string, string>)['Content-Type']
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      let body = ''
      try { body = await response.text() } catch { /* ignore */ }
      throw new Error(`${response.status}::${body}`)
    }

    return response.json()
  }

  static get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  static post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  static postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    // Let the browser set Content-Type with the correct boundary
    // by explicitly setting Content-Type to a sentinel value we handle or omitting it
    // Wait, since request() adds application/json if Content-Type is missing, we must pass it and then intercept?
    // Actually our previous change checks if 'Content-Type' is in options.headers.
    // If we pass an empty string, or some placeholder, fetch might override it or we just don't set it.
    // Let's modify request() slightly, or just use a trick.
    // But since we just modified request(), let's pass a special object or just rely on fetch overriding it if we don't set it in headers here, but request() will set it to json.
    // Actually, setting it to undefined doesn't work if it's an object property check.
    // Wait, let's fix request() again or just use fetch directly.
    // Let's just pass `headers: { 'Content-Type': '' }` and in request() we check if it's empty we delete it.
    // No, let's pass a Headers object? No, headers is Record<string, string>.
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': 'multipart/form-data' } // We will intercept this in request() to remove it
    })
  }

  static patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }
}
