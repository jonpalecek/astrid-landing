import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role for server-side writes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface WorkspaceSyncPayload {
  instance_token: string;  // Gateway token for auth
  projects: Array<{
    id: string;
    name: string;
    status: string;
    description?: string;
    tasks: Array<{
      id: string;
      title: string;
      status: string;
      due?: string;
      priority?: string;
    }>;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    due?: string;
    priority?: string;
    project?: string;
  }>;
  ideas: Array<{
    id: string;
    content: string;
    category?: string;
    createdAt?: string;
  }>;
  inbox: Array<{
    id: string;
    content: string;
    source?: string;
    createdAt?: string;
  }>;
  stats: {
    inboxCount: number;
    activeProjectsCount: number;
    tasksDoneThisWeek: number;
    ideasCount: number;
  };
}

// POST /api/workspace/sync - Receive workspace data from assistant
export async function POST(request: NextRequest) {
  try {
    const payload: WorkspaceSyncPayload = await request.json();

    // Validate required fields
    if (!payload.instance_token) {
      return NextResponse.json({ error: 'Missing instance_token' }, { status: 400 });
    }

    // Find instance by gateway token
    const { data: instance, error: instanceError } = await supabase
      .from('instances')
      .select('id, user_id')
      .eq('gateway_token', payload.instance_token)
      .single();

    if (instanceError || !instance) {
      return NextResponse.json({ error: 'Invalid instance token' }, { status: 401 });
    }

    // Upsert workspace data
    const { error: upsertError } = await supabase
      .from('workspace_data')
      .upsert({
        instance_id: instance.id,
        user_id: instance.user_id,
        projects: payload.projects,
        tasks: payload.tasks,
        ideas: payload.ideas,
        inbox: payload.inbox,
        stats: payload.stats,
        synced_at: new Date().toISOString(),
      }, {
        onConflict: 'instance_id'
      });

    if (upsertError) {
      console.error('Workspace sync upsert error:', upsertError);
      return NextResponse.json({ error: 'Failed to save workspace data' }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      message: 'Workspace synced successfully',
      synced_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Workspace sync error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Sync failed' 
    }, { status: 500 });
  }
}

// GET /api/workspace/sync - Get last sync status (for debugging)
export async function GET(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
  }

  const { data: instance } = await supabase
    .from('instances')
    .select('id')
    .eq('gateway_token', token)
    .single();

  if (!instance) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { data: workspace } = await supabase
    .from('workspace_data')
    .select('synced_at, stats')
    .eq('instance_id', instance.id)
    .single();

  return NextResponse.json({
    synced_at: workspace?.synced_at || null,
    stats: workspace?.stats || null,
  });
}
