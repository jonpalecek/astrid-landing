'use client';

import { useState, useEffect, useCallback } from 'react';

interface Instance {
  id: string;
  user_id: string;
  droplet_id: string | null;
  droplet_name: string | null;
  droplet_ip: string | null;
  region: string;
  size: string;
  gateway_port: number;
  gateway_token: string;
  tunnel_id: string | null;
  tunnel_hostname: string | null;
  status: 'pending' | 'provisioning' | 'configuring' | 'active' | 'stopped' | 'error' | 'destroying';
  status_message: string | null;
  last_health_check: string | null;
  health_status: 'healthy' | 'unhealthy' | 'unknown' | null;
  assistant_name: string;
  assistant_emoji: string;
  created_at: string;
  updated_at: string;
  provisioned_at: string | null;
}

interface CreateInstanceOptions {
  region?: string;
  size?: string;
  assistantName?: string;
  assistantEmoji?: string;
  anthropicKey?: string;
  setupToken?: string;
  telegramToken?: string;
}

export function useInstance() {
  const [instance, setInstance] = useState<Instance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch instance status
  const fetchInstance = useCallback(async () => {
    try {
      const response = await fetch('/api/instances');
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        setInstance(null);
      } else {
        setInstance(data.instance);
        setError(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch instance');
      setInstance(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new instance
  const createInstance = useCallback(async (options: CreateInstanceOptions) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create instance');
      }

      // Refresh to get full instance data
      await fetchInstance();
      return data;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to create instance';
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [fetchInstance]);

  // Delete instance
  const deleteInstance = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/instances', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete instance');
      }

      setInstance(null);
      return data;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to delete instance';
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  // Check gateway health
  const checkHealth = useCallback(async () => {
    if (!instance?.droplet_ip) return null;

    try {
      const response = await fetch('/api/instances/health', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.instance) {
        setInstance(data.instance);
      }
      
      return data.healthy;
    } catch {
      return false;
    }
  }, [instance?.droplet_ip]);

  // Initial fetch
  useEffect(() => {
    fetchInstance();
  }, [fetchInstance]);

  // Poll for status updates during provisioning
  useEffect(() => {
    if (!instance) return;
    
    const shouldPoll = ['pending', 'provisioning', 'configuring'].includes(instance.status);
    if (!shouldPoll) return;

    const interval = setInterval(fetchInstance, 5000);
    return () => clearInterval(interval);
  }, [instance?.status, fetchInstance]);

  return {
    instance,
    loading,
    error,
    createInstance,
    deleteInstance,
    checkHealth,
    refresh: fetchInstance,
  };
}
