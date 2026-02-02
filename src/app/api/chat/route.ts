import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// For local dev, we need to skip SSL verification for Cloudflare tunnels
// This is safe because we're only calling our own tunnels
if (!process.env.VERCEL && process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// POST /api/chat - Send a message to the assistant
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's instance
    const { data: instance } = await supabase
      .from('instances')
      .select('tunnel_hostname, gateway_token, status, assistant_name')
      .eq('user_id', user.id)
      .single();

    if (!instance) {
      return NextResponse.json({ error: 'No instance found' }, { status: 404 });
    }

    if (instance.status !== 'active') {
      return NextResponse.json({ error: 'Assistant is not active' }, { status: 503 });
    }

    if (!instance.tunnel_hostname || !instance.gateway_token) {
      return NextResponse.json({ error: 'Instance not properly configured' }, { status: 500 });
    }

    // Get message from request body
    const { message } = await request.json();
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Send to OpenClaw webhook
    const webhookUrl = `${instance.tunnel_hostname}/hooks/agent`;
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${instance.gateway_token}`,
      },
      body: JSON.stringify({
        message: message,
        name: 'Dashboard Chat',
        // Don't deliver to Telegram - we want the response here
        deliver: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Webhook failed:', response.status, errorText);
      return NextResponse.json({ 
        error: 'Failed to reach assistant',
        details: errorText
      }, { status: 502 });
    }

    const data = await response.json();
    
    // The webhook returns the assistant's response
    return NextResponse.json({
      success: true,
      response: data.response || data.message || data.content || 'No response from assistant',
      assistantName: instance.assistant_name || 'Astrid',
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to send message'
    }, { status: 500 });
  }
}
