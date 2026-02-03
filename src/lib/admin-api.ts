/**
 * Admin Agent API Client
 * 
 * Server-side helper to proxy requests to a user's Admin Agent.
 * Handles auth lookup and token management.
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

/**
 * Get the Admin Agent config for the current user
 */
export async function getAdminConfig(): Promise<AdminAPIConfig> {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('[AdminAPI] User lookup:', user?.id || 'none', authError?.message || 'ok');
  
  if (authError || !user) {
    throw new AdminAPIError('Unauthorized', 401, 'AUTH_ERROR');
  }

  const { data: instance, error: instanceError } = await supabase
    .from('instances')
    .select('tunnel_hostname, gateway_token, status')
    .eq('user_id', user.id)
    .single();

  console.log('[AdminAPI] Instance lookup:', instance?.tunnel_hostname || 'none', instanceError?.message || 'ok');

  if (instanceError || !instance) {
    throw new AdminAPIError('No VM found for user', 404, 'NO_INSTANCE');
  }

  if (instance.status !== 'active') {
    throw new AdminAPIError(`VM not active (status: ${instance.status})`, 503, 'INSTANCE_NOT_ACTIVE');
  }

  if (!instance.tunnel_hostname || !instance.gateway_token) {
    throw new AdminAPIError('VM not fully configured', 503, 'INSTANCE_NOT_CONFIGURED');
  }

  // Ensure URL format is correct (some values may already have https://)
  let tunnelUrl = instance.tunnel_hostname;
  if (!tunnelUrl.startsWith('http://') && !tunnelUrl.startsWith('https://')) {
    tunnelUrl = `https://${tunnelUrl}`;
  }
  
  console.log('[AdminAPI] Tunnel URL:', tunnelUrl);

  return {
    tunnelUrl,
    gatewayToken: instance.gateway_token,
  };
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
