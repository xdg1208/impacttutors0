import { cookies } from "next/headers";
import { FetchOptions, betterFetch } from "./api";

export const serverApi = {
  // Helper for server components
  auth: async () => {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    return {
      get: <T>(endpoint: string, options?: FetchOptions) => 
        betterFetch<T>(endpoint, { ...options, token, method: 'GET' }),
      post: <T>(endpoint: string, body?: any, options?: FetchOptions) => 
        betterFetch<T>(endpoint, { ...options, token, method: 'POST', body: JSON.stringify(body) }),
      put: <T>(endpoint: string, body?: any, options?: FetchOptions) => 
        betterFetch<T>(endpoint, { ...options, token, method: 'PUT', body: JSON.stringify(body) }),
      patch: <T>(endpoint: string, body?: any, options?: FetchOptions) => 
        betterFetch<T>(endpoint, { ...options, token, method: 'PATCH', body: JSON.stringify(body) }),
      delete: <T>(endpoint: string, options?: FetchOptions) => 
        betterFetch<T>(endpoint, { ...options, token, method: 'DELETE' }),
    };
  }
};
