import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// POST /api/instances/health - Check instance health
export async function POST() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: instance } = await supabase
      .from('instances')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!instance) {
      return NextResponse.json({ error: 'No instance found' }, { status: 404 });
    }

    if (!instance.droplet_ip) {
      return NextResponse.json({ 
        healthy: false, 
        reason: 'No IP address yet',
        instance,
      });
    }

    // Try to connect to the OpenClaw gateway
    // Note: In production, this would go through a secure tunnel
    // For now, we'll try a direct HTTP connection to check if gateway is up
    const gatewayUrl = `http://${instance.droplet_ip}:${instance.gateway_port}`;
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      // The gateway doesn't have an HTTP health endpoint by default,
      // but we can check if the port is responding
      // In practice, we'd use WebSocket connect or a custom health endpoint
      const response = await fetch(gatewayUrl, {
        method: 'GET',
        signal: controller.signal,
      }).catch(() => null);
      
      clearTimeout(timeout);

      // Even a failed response means the server is up
      const isUp = response !== null;
      
      // Update instance health status
      const healthStatus = isUp ? 'healthy' : 'unhealthy';
      const newStatus = isUp && instance.status === 'configuring' ? 'active' : instance.status;
      
      await supabase
        .from('instances')
        .update({
          last_health_check: new Date().toISOString(),
          health_status: healthStatus,
          status: newStatus,
          status_message: isUp ? 'OpenClaw is running' : 'Waiting for OpenClaw to start...',
        })
        .eq('id', instance.id);

      // Return updated instance
      const { data: updatedInstance } = await supabase
        .from('instances')
        .select('*')
        .eq('id', instance.id)
        .single();

      return NextResponse.json({ 
        healthy: isUp,
        instance: updatedInstance,
      });

    } catch (e) {
      // Connection failed - gateway not ready yet
      await supabase
        .from('instances')
        .update({
          last_health_check: new Date().toISOString(),
          health_status: 'unhealthy',
          status_message: 'Waiting for OpenClaw to start...',
        })
        .eq('id', instance.id);

      return NextResponse.json({ 
        healthy: false,
        reason: 'Gateway not responding',
        instance,
      });
    }

  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Health check failed' 
    }, { status: 500 });
  }
}
