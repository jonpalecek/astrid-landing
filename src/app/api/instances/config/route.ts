import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { OpenClawSSHClient } from '@/lib/openclaw-client';

// GET /api/instances/config - Get current configuration from VM
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: instance, error } = await supabase
      .from('instances')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !instance) {
      return NextResponse.json({ error: 'No instance found' }, { status: 404 });
    }

    // If instance is not active, return cached data from Supabase
    if (instance.status !== 'active' || !instance.droplet_ip) {
      return NextResponse.json({
        assistantName: instance.assistant_name,
        assistantEmoji: instance.assistant_emoji,
        model: instance.model || 'anthropic/claude-sonnet-4-5',
        region: instance.region,
        status: instance.status,
        tunnelHostname: instance.tunnel_hostname,
        source: 'cache',
      });
    }

    // Try to fetch live config from VM
    try {
      const client = new OpenClawSSHClient(instance.droplet_ip);
      const config = await client.getConfig();
      const assistantInfo = OpenClawSSHClient.extractAssistantInfo(config);

      // Update Supabase cache with live data
      await supabase
        .from('instances')
        .update({
          assistant_name: assistantInfo.name,
          assistant_emoji: assistantInfo.emoji,
          model: assistantInfo.model,
        })
        .eq('id', instance.id);

      return NextResponse.json({
        assistantName: assistantInfo.name,
        assistantEmoji: assistantInfo.emoji,
        model: assistantInfo.model,
        region: instance.region,
        status: instance.status,
        tunnelHostname: instance.tunnel_hostname,
        source: 'live',
      });
    } catch (sshError) {
      console.error('Failed to fetch live config via SSH:', sshError);
      
      // Fall back to cached data
      return NextResponse.json({
        assistantName: instance.assistant_name,
        assistantEmoji: instance.assistant_emoji,
        model: instance.model || 'anthropic/claude-sonnet-4-5',
        region: instance.region,
        status: instance.status,
        tunnelHostname: instance.tunnel_hostname,
        source: 'cache',
        warning: 'Could not fetch live config from VM',
      });
    }

  } catch (error) {
    console.error('Config fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch configuration' 
    }, { status: 500 });
  }
}

// PATCH /api/instances/config - Update instance configuration
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's instance
    const { data: instance, error: instanceError } = await supabase
      .from('instances')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (instanceError || !instance) {
      return NextResponse.json({ error: 'No instance found' }, { status: 404 });
    }

    if (instance.status !== 'active') {
      return NextResponse.json({ 
        error: `Instance is not active (status: ${instance.status})` 
      }, { status: 400 });
    }

    if (!instance.droplet_ip) {
      return NextResponse.json({ error: 'No droplet IP found' }, { status: 400 });
    }

    // Parse the config updates
    const body = await request.json();
    const { assistantName, assistantEmoji, model } = body;

    // Update VM config
    try {
      const client = new OpenClawSSHClient(instance.droplet_ip);
      const updatedConfig = await client.updateConfig({
        assistantName,
        assistantEmoji,
        model,
      });

      // Extract the updated info
      const assistantInfo = OpenClawSSHClient.extractAssistantInfo(updatedConfig);

      // Update Supabase cache
      await supabase
        .from('instances')
        .update({
          assistant_name: assistantInfo.name,
          assistant_emoji: assistantInfo.emoji,
          model: assistantInfo.model,
        })
        .eq('id', instance.id);

      return NextResponse.json({ 
        success: true,
        message: 'Configuration updated and synced to VM',
        config: {
          assistantName: assistantInfo.name,
          assistantEmoji: assistantInfo.emoji,
          model: assistantInfo.model,
        },
      });

    } catch (sshError) {
      console.error('Failed to update config via SSH:', sshError);
      
      // Still update Supabase cache for eventual consistency
      const updates: Record<string, string> = {};
      if (assistantName) updates.assistant_name = assistantName;
      if (assistantEmoji) updates.assistant_emoji = assistantEmoji;
      if (model) updates.model = model;

      if (Object.keys(updates).length > 0) {
        await supabase
          .from('instances')
          .update(updates)
          .eq('id', instance.id);
      }

      return NextResponse.json({ 
        success: true,
        message: 'Configuration saved (VM sync pending)',
        warning: 'Could not push to VM immediately. Changes will apply on next restart.',
      });
    }

  } catch (error) {
    console.error('Config update error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to update configuration' 
    }, { status: 500 });
  }
}
