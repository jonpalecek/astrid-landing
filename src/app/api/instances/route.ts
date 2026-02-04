import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createDroplet, getDroplet } from '@/lib/digitalocean';
import { createTunnel, deleteTunnel } from '@/lib/cloudflare';
import crypto from 'crypto';

// Send welcome message to new user via OpenClaw webhook
async function sendWelcomeMessage(tunnelHostname: string, gatewayToken: string, assistantName: string, telegramUserId?: string): Promise<boolean> {
  try {
    const webhookUrl = `${tunnelHostname}/hooks/agent`;
    
    const welcomePrompt = `This is your FIRST message to your new user! They just finished setting you up and are excited to meet you. Make this moment special.

You are ${assistantName}, their personal AI executive assistant. You're not just a chatbot — you're here to make them superhuman.

Write a warm, enthusiastic welcome message that:
- Greets them with genuine excitement (you've been waiting to meet them!)
- Introduces yourself as ${assistantName}, their personal executive assistant
- Conveys that you're here to take the mental load off their shoulders — you'll remember everything, think ahead, and make sure nothing falls through the cracks
- Emphasize that you don't just help them plan — you can actually DO things for them. They can offload tasks to you and you'll handle them.
- Mention you'll keep everything organized (projects, tasks, ideas) but frame it naturally, not as a feature list
- Let them know they can message you anytime — you're always here, always ready
- Ask what's on their mind or what they'd like to tackle together

Tone: Warm, confident, slightly playful. Like a brilliant friend who just joined their team and is ready to roll up their sleeves.
Length: 3-4 short paragraphs max. Don't use bullet points or feature lists — this should feel personal, not like a product tour.
DO NOT mention: markdown, files, workspaces, technical details, or implementation specifics.`;

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${gatewayToken}`,
      },
      body: JSON.stringify({
        message: welcomePrompt,
        name: 'Welcome',
        deliver: true,
        channel: 'telegram',
        to: telegramUserId, // Target user for message delivery
      }),
    });

    if (!response.ok) {
      console.error('Failed to send welcome message:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending welcome message:', error);
    return false;
  }
}

// Generate a secure random token for gateway auth
function generateGatewayToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Generate a unique droplet name
function generateDropletName(userId: string): string {
  const short = userId.slice(0, 8);
  const timestamp = Date.now().toString(36);
  return `astrid-${short}-${timestamp}`;
}

// POST /api/instances - Create a new instance
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has an instance
    const { data: existing } = await supabase
      .from('instances')
      .select('id, status')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json({ 
        error: 'Instance already exists',
        instance: existing,
      }, { status: 409 });
    }

    // Parse request body
    const body = await request.json();
    const {
      region = 'sfo3',
      size = 's-1vcpu-2gb',
      assistantName = 'Astrid',
      assistantEmoji = '✨',
      anthropicKey,
      setupToken,
      telegramToken,
      telegramUserId,
      // User customization
      userName,
      userTimezone,
      userAbout,
      // Personality customization
      personalityTraits = [],
      personalityContext,
    } = body;

    // Require either anthropicKey or setupToken
    if (!anthropicKey && !setupToken) {
      return NextResponse.json({ 
        error: 'Either anthropicKey or setupToken is required' 
      }, { status: 400 });
    }

    // Generate gateway token
    const gatewayToken = generateGatewayToken();
    const dropletName = generateDropletName(user.id);

    // Create Cloudflare tunnel first
    let tunnel;
    try {
      tunnel = await createTunnel(user.id);
    } catch (tunnelError) {
      console.error('Failed to create tunnel:', tunnelError);
      return NextResponse.json({ 
        error: 'Failed to create secure tunnel' 
      }, { status: 500 });
    }

    // Create instance record (status: pending)
    const { data: instance, error: insertError } = await supabase
      .from('instances')
      .insert({
        user_id: user.id,
        droplet_name: dropletName,
        region,
        size,
        gateway_token: gatewayToken,
        tunnel_id: tunnel.tunnelId,
        tunnel_hostname: tunnel.hostname,
        status: 'pending',
        status_message: 'Spinning up your private server...',
        assistant_name: assistantName,
        assistant_emoji: assistantEmoji,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create instance record:', insertError);
      // Clean up the tunnel we created
      await deleteTunnel(tunnel.tunnelId).catch(console.error);
      return NextResponse.json({ 
        error: 'Failed to create instance record' 
      }, { status: 500 });
    }

    // Create DigitalOcean droplet
    try {
      const droplet = await createDroplet({
        name: dropletName,
        region,
        size,
        gatewayToken,
        assistantName,
        assistantEmoji,
        anthropicKey,
        setupToken,
        telegramToken,
        telegramUserId,
        userEmail: user.email || '',
        userName,
        userTimezone,
        userAbout,
        personalityTraits,
        personalityContext,
        tunnelCredentialsJson: tunnel.credentialsJson,
        tunnelHostname: tunnel.hostname,
      });

      // Update instance with droplet ID
      await supabase
        .from('instances')
        .update({
          droplet_id: droplet.dropletId.toString(),
          status: 'provisioning',
          status_message: 'Applying security patches and installing software...',
        })
        .eq('id', instance.id);

      return NextResponse.json({
        success: true,
        instance: {
          id: instance.id,
          dropletId: droplet.dropletId,
          name: dropletName,
          status: 'provisioning',
        },
      });

    } catch (doError) {
      // Failed to create droplet - mark instance as error
      await supabase
        .from('instances')
        .update({
          status: 'error',
          status_message: `Failed to create droplet: ${doError instanceof Error ? doError.message : 'Unknown error'}`,
        })
        .eq('id', instance.id);

      throw doError;
    }

  } catch (error) {
    console.error('Instance creation error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create instance' 
    }, { status: 500 });
  }
}

// GET /api/instances - Get current user's instance
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

    if (error && error.code !== 'PGRST116') {
      console.error('Failed to fetch instance:', error);
      return NextResponse.json({ error: 'Failed to fetch instance' }, { status: 500 });
    }

    if (!instance) {
      return NextResponse.json({ instance: null });
    }

    // If provisioning, check droplet status
    if (instance.status === 'provisioning' && instance.droplet_id) {
      try {
        const droplet = await getDroplet(parseInt(instance.droplet_id));
        
        if (droplet.status === 'active' && droplet.ip) {
          // Droplet is ready, update instance
          await supabase
            .from('instances')
            .update({
              droplet_ip: droplet.ip,
              status: 'configuring',
              status_message: 'Configuring your assistant...',
              provisioned_at: new Date().toISOString(),
            })
            .eq('id', instance.id);

          instance.droplet_ip = droplet.ip;
          instance.status = 'configuring';
        }
      } catch (e) {
        console.error('Failed to check droplet status:', e);
      }
    }

    // If configuring or provisioning, check if tunnel is connected
    if ((instance.status === 'configuring' || instance.status === 'provisioning') && instance.tunnel_id) {
      try {
        const { getTunnelStatus } = await import('@/lib/cloudflare');
        const tunnelStatus = await getTunnelStatus(instance.tunnel_id);
        
        if (tunnelStatus.status === 'healthy' || tunnelStatus.connections > 0) {
          // Tunnel is connected, OpenClaw is running!
          // Also try to get the droplet IP if we don't have it
          let dropletIp = instance.droplet_ip;
          if (!dropletIp && instance.droplet_id) {
            try {
              const droplet = await getDroplet(parseInt(instance.droplet_id));
              dropletIp = droplet.ip || null;
            } catch (e) {
              console.error('Failed to get droplet IP:', e);
            }
          }

          // Check if this is the first time going active (welcome not sent yet)
          const shouldSendWelcome = !instance.welcome_sent;

          await supabase
            .from('instances')
            .update({
              droplet_ip: dropletIp,
              status: 'active',
              status_message: 'Your assistant is ready!',
              health_status: 'healthy',
              last_health_check: new Date().toISOString(),
              provisioned_at: instance.provisioned_at || new Date().toISOString(),
              welcome_sent: true, // Mark welcome as sent (we'll send it below)
            })
            .eq('id', instance.id);

          instance.status = 'active';
          instance.health_status = 'healthy';
          instance.droplet_ip = dropletIp;

          // Send welcome message on first activation
          if (shouldSendWelcome && instance.tunnel_hostname && instance.gateway_token) {
            // Fire and forget - don't block the response
            sendWelcomeMessage(
              instance.tunnel_hostname,
              instance.gateway_token,
              instance.assistant_name || 'Astrid',
              instance.telegram_user_id || undefined
            ).catch(e => console.error('Welcome message failed:', e));
          }
        }
      } catch (e) {
        console.error('Failed to check tunnel status:', e);
      }
    }

    // If active but missing droplet_ip, try to get it
    if (instance.status === 'active' && !instance.droplet_ip && instance.droplet_id) {
      try {
        const droplet = await getDroplet(parseInt(instance.droplet_id));
        if (droplet.ip) {
          await supabase
            .from('instances')
            .update({ droplet_ip: droplet.ip })
            .eq('id', instance.id);
          instance.droplet_ip = droplet.ip;
        }
      } catch (e) {
        console.error('Failed to get droplet IP for active instance:', e);
      }
    }

    return NextResponse.json({ instance });

  } catch (error) {
    console.error('Instance fetch error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch instance' 
    }, { status: 500 });
  }
}

// DELETE /api/instances - Destroy current user's instance
export async function DELETE() {
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

    // Mark as destroying
    await supabase
      .from('instances')
      .update({
        status: 'destroying',
        status_message: 'Destroying droplet...',
      })
      .eq('id', instance.id);

    // Delete droplet if it exists
    if (instance.droplet_id) {
      const { deleteDroplet } = await import('@/lib/digitalocean');
      try {
        await deleteDroplet(parseInt(instance.droplet_id));
      } catch (e) {
        console.error('Failed to delete droplet:', e);
        // Continue anyway - droplet might already be deleted
      }
    }

    // Delete tunnel and DNS record if they exist
    if (instance.tunnel_id) {
      try {
        await deleteTunnel(instance.tunnel_id, instance.tunnel_hostname);
      } catch (e) {
        console.error('Failed to delete tunnel:', e);
        // Continue anyway - tunnel might already be deleted
      }
    }

    // Delete instance record
    await supabase
      .from('instances')
      .delete()
      .eq('id', instance.id);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Instance deletion error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to delete instance' 
    }, { status: 500 });
  }
}
