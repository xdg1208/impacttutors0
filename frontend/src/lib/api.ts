// Helper to ensure the base URL ends with /api (but not /api/)
const getBaseUrl = () => {
  let base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  // If the user provided the base domain without /api, add it
  if (!base.includes('/api')) {
    base = base.endsWith('/') ? `${base}api` : `${base}/api`;
  }
  // Trim trailing slash for consistent concatenation
  return base.endsWith('/') ? base.slice(0, -1) : base;
};

export const API_BASE_URL = getBaseUrl();

export type FetchOptions = RequestInit & {
  params?: Record<string, string | number>;
  token?: string;
};

export async function betterFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, token, ...init } = options;
  
  // Ensure endpoint starts with a slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let url = `${API_BASE_URL}${cleanEndpoint}`;
  
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    url += `?${searchParams.toString()}`;
  }

  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const statusCode = response.status;
      
      // Handle field-level errors (e.g. {"email": ["Already exists"]})
      if (typeof errorData === 'object' && !errorData.error && !errorData.detail) {
        const firstField = Object.keys(errorData)[0];
        if (firstField) {
          const fieldError = errorData[firstField];
          const rawMessage = Array.isArray(fieldError) ? fieldError[0] : fieldError;
          
          // Map common field names to friendly names
          const fieldMap: Record<string, string> = {
            email: "Email",
            full_name: "Full Name",
            invite_code: "Registration Code",
            password: "Password",
            phone: "Phone Number",
            preferred_contact_method: "Preferred Contact Method",
            contact_detail: "Contact Detail",
            non_field_errors: "Error",
          };

          const fieldName = fieldMap[firstField] || firstField;
          
          if (firstField === 'non_field_errors') {
            throw new Error(rawMessage);
          }
          
          throw new Error(`${fieldName}: ${rawMessage}`);
        }
      }

      // Friendly mapping for specific status codes if no detail is provided
      const defaultErrors: Record<number, string> = {
        400: "We couldn't process this request. Please double-check your information and try again.",
        401: "You need to be logged in to do that. Please sign in and try again.",
        403: "You don't have permission to perform this action.",
        404: "We couldn't find what you're looking for. The link might be broken or outdated.",
        500: "Our server is acting up right now. Please wait a moment and try again.",
      };

      const message = errorData.error || errorData.detail || defaultErrors[statusCode] || 'Something went wrong. Please try again later.';
      throw new Error(message);
    }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string, options?: FetchOptions) => 
    betterFetch<T>(endpoint, { ...options, method: 'GET' }),
  
  post: <T>(endpoint: string, body?: any, options?: FetchOptions) => 
    betterFetch<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  
  put: <T>(endpoint: string, body?: any, options?: FetchOptions) => 
    betterFetch<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  
  patch: <T>(endpoint: string, body?: any, options?: FetchOptions) => 
    betterFetch<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  
  delete: <T>(endpoint: string, options?: FetchOptions) => 
    betterFetch<T>(endpoint, { ...options, method: 'DELETE' }),
};
