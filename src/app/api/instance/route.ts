import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// GET /api/instance - Get user's instance
export async function GET(request: NextRequest) {
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

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Failed to fetch instance:', error);
      return NextResponse.json({ error: 'Failed to fetch instance' }, { status: 500 });
    }

    if (!instance) {
      return NextResponse.json({ instance: null });
    }

    // Don't expose sensitive fields to client
    const { gateway_token, ...safeInstance } = instance;

    return NextResponse.json({ instance: safeInstance });

  } catch (error) {
    console.error('Instance fetch error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// DELETE /api/instance - Destroy user's instance
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: instance, error: fetchError } = await supabase
      .from('instances')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (fetchError || !instance) {
      return NextResponse.json({ error: 'No instance found' }, { status: 404 });
    }

    // Update status to destroying
    await supabase
      .from('instances')
      .update({ status: 'destroying', status_message: 'Destroying instance...' })
      .eq('id', instance.id);

    // TODO: Actually destroy the droplet and cleanup
    // This would be done in a background job
    // For now, just mark as destroying

    return NextResponse.json({ 
      message: 'Instance destruction started',
      instanceId: instance.id 
    });

  } catch (error) {
    console.error('Instance delete error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
