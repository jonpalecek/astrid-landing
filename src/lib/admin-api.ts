/**
 * Admin Agent API Client
 * 
 * Server-side helper to proxy requests to a user's Admin Agent.
 * Handles auth lookup and token management with caching.
 */

import { createClient } from '@/lib/supabase-server';

export interface AdminAPIConfig {
  tunnelUrl: string;
  gatewayToken: string;
}

export class AdminAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'AdminAPIError';
  }
}

// In-memory cache for instance config (per user)
// TTL: 5 minutes - user's VM config rarely changes
const CONFIG_CACHE_TTL_MS = 5 * 60 * 1000;

interface CachedConfig {
  config: AdminAPIConfig;
  expiresAt: number;
}

const configCache = new Map<string, CachedConfig>();

/**
 * Get the Admin Agent config for the current user (with caching)
 */
export async function getAdminConfig(): Promise<AdminAPIConfig> {
  const supabase = await createClient();
  
  // Get user first (required for cache key)
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new AdminAPIError('Unauthorized', 401, 'AUTH_ERROR');
  }

  // Check cache
  const cached = configCache.get(user.id);
  if (cached && cached.expiresAt > Date.now()) {
    console.log('[AdminAPI] Cache hit for user:', user.id.slice(0, 8));
    return cached.config;
  }

  console.log('[AdminAPI] Cache miss, fetching instance for:', user.id.slice(0, 8));

  // Fetch instance config
  const { data: instance, error: instanceError } = await supabase
    .from('instances')
    .select('tunnel_hostname, gateway_token, status')
    .eq('user_id', user.id)
    .single();

  if (instanceError || !instance) {
    throw new AdminAPIError('No VM found for user', 404, 'NO_INSTANCE');
  }

  if (instance.status !== 'active') {
    throw new AdminAPIError(`VM not active (status: ${instance.status})`, 503, 'INSTANCE_NOT_ACTIVE');
  }

  if (!instance.tunnel_hostname || !instance.gateway_token) {
    throw new AdminAPIError('VM not fully configured', 503, 'INSTANCE_NOT_CONFIGURED');
  }

  // Ensure URL format is correct
  let tunnelUrl = instance.tunnel_hostname;
  if (!tunnelUrl.startsWith('http://') && !tunnelUrl.startsWith('https://')) {
    tunnelUrl = `https://${tunnelUrl}`;
  }

  const config: AdminAPIConfig = {
    tunnelUrl,
    gatewayToken: instance.gateway_token,
  };

  // Cache it
  configCache.set(user.id, {
    config,
    expiresAt: Date.now() + CONFIG_CACHE_TTL_MS,
  });

  console.log('[AdminAPI] Cached config for:', user.id.slice(0, 8), '→', tunnelUrl);

  return config;
}

/**
 * Call the Admin Agent API
 */
export async function callAdminAPI<T = unknown>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: unknown;
    timeout?: number;
  } = {}
): Promise<T> {
  const { method = 'GET', body, timeout = 30000 } = options;
  
  const config = await getAdminConfig();
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const url = `${config.tunnelUrl}/api/admin${path}`;
  console.log('[AdminAPI] Calling:', url);
  
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${config.gatewayToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Astrid-Dashboard/1.0',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      cache: 'no-store',  // Disable Next.js fetch caching
    });

    clearTimeout(timeoutId);
    console.log('[AdminAPI] Response status:', res.status);

    if (!res.ok) {
      const errorBody = await res.text();
      throw new AdminAPIError(
        `Admin Agent error: ${res.status} ${errorBody}`,
        res.status,
        'ADMIN_API_ERROR'
      );
    }

    return res.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof AdminAPIError) {
      throw error;
    }
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AdminAPIError('Request timeout', 504, 'TIMEOUT');
    }

    // Include URL in error for debugging
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AdminAPI] Fetch error:', errMsg, 'URL:', url);
    throw new AdminAPIError(
      `Failed to reach Admin Agent at ${url}: ${errMsg}`,
      502,
      'CONNECTION_ERROR'
    );
  }
}

/**
 * Invalidate cached config for a user (call after VM changes)
 */
export function invalidateConfigCache(userId: string) {
  configCache.delete(userId);
  console.log('[AdminAPI] Cache invalidated for:', userId.slice(0, 8));
}

/**
 * Helper to create JSON response with proper error handling
 */
export function apiResponse<T>(data: T, status = 200) {
  return Response.json(data, { status });
}

export function apiError(error: unknown) {
  if (error instanceof AdminAPIError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.status }
    );
  }
  
  console.error('Unexpected error:', error);
  return Response.json(
    { error: 'Internal server error', code: 'INTERNAL_ERROR' },
    { status: 500 }
  );
}
