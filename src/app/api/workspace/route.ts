import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { OpenClawSSHClient } from '@/lib/openclaw-client';
import { 
  parseProjects, 
  parseTasks, 
  parseIdeas, 
  parseInbox,
  getWorkspaceStats,
  type Project,
  type Task,
  type Idea,
  type InboxItem
} from '@/lib/workspace-parsers';

export interface WorkspaceData {
  projects: Project[];
  tasks: Task[];
  ideas: Idea[];
  inbox: InboxItem[];
  stats: ReturnType<typeof getWorkspaceStats>;
}

// GET /api/workspace - Fetch and parse workspace files
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's instance
    const { data: instance } = await supabase
      .from('instances')
      .select('droplet_ip, status')
      .eq('user_id', user.id)
      .single();

    if (!instance || !instance.droplet_ip) {
      return NextResponse.json({ 
        error: 'No active instance',
        data: null 
      }, { status: 404 });
    }

    if (instance.status !== 'active') {
      return NextResponse.json({ 
        error: 'Instance not active',
        data: null 
      }, { status: 503 });
    }

    // Connect to VM and read files
    const client = new OpenClawSSHClient(instance.droplet_ip);

    // Fetch all workspace files in parallel
    const [projectsContent, tasksContent, ideasContent, inboxContent] = await Promise.all([
      client.readFile('PROJECTS.md'),
      client.readFile('TASKS.md'),
      client.readFile('IDEAS.md'),
      client.readFile('INBOX.md'),
    ]);

    // Parse each file
    const projects = projectsContent ? parseProjects(projectsContent) : [];
    const tasks = tasksContent ? parseTasks(tasksContent) : [];
    const ideas = ideasContent ? parseIdeas(ideasContent) : [];
    const inbox = inboxContent ? parseInbox(inboxContent) : [];

    // Calculate stats
    const stats = getWorkspaceStats(projects, tasks, ideas, inbox);

    const data: WorkspaceData = {
      projects,
      tasks,
      ideas,
      inbox,
      stats,
    };

    return NextResponse.json({ data });

  } catch (error) {
    console.error('Workspace fetch error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch workspace',
      data: null
    }, { status: 500 });
  }
}
