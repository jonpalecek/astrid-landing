// Parsers for Astrid workspace files (PROJECTS.md, TASKS.md, IDEAS.md, INBOX.md)
// Following the PM skill format: ## Section, Status:, @due(), @done()

export interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done' | 'blocked';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due?: string;
  doneDate?: string;
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  status: 'active' | 'on-hold' | 'completed' | 'archived';
  description?: string;
  tasks: Task[];
  due?: string;
  completedDate?: string;
}

export interface Idea {
  id: string;
  title: string;
  category?: string;
  notes?: string;
  createdDate?: string;
}

export interface InboxItem {
  id: string;
  content: string;
  createdDate?: string;
  source?: string;
}

// Parse @due(YYYY-MM-DD) or @due(Mon Feb 2)
function parseDateTag(text: string, tag: string): string | undefined {
  const regex = new RegExp(`@${tag}\\(([^)]+)\\)`, 'i');
  const match = text.match(regex);
  return match?.[1];
}

// Parse status from "Status: xxx" line
function parseStatus(text: string): string | undefined {
  const match = text.match(/Status:\s*(.+)/i);
  return match?.[1]?.trim().toLowerCase();
}

// Parse priority from tags like @high, @urgent, or "Priority: high"
function parsePriority(text: string): Task['priority'] | undefined {
  if (/@urgent/i.test(text)) return 'urgent';
  if (/@high/i.test(text)) return 'high';
  if (/@medium/i.test(text)) return 'medium';
  if (/@low/i.test(text)) return 'low';
  
  const match = text.match(/Priority:\s*(\w+)/i);
  if (match) {
    const p = match[1].toLowerCase();
    if (['low', 'medium', 'high', 'urgent'].includes(p)) {
      return p as Task['priority'];
    }
  }
  return undefined;
}

// Generate a simple ID from text
function generateId(text: string, index: number): string {
  return `${text.slice(0, 20).replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${index}`;
}

/**
 * Parse PROJECTS.md
 * 
 * Format:
 * ## Project Name
 * Status: active
 * Description here
 * 
 * ### Tasks
 * - [ ] Task 1 @due(2026-02-10)
 * - [x] Task 2 @done(2026-02-01)
 */
export function parseProjects(content: string): Project[] {
  const projects: Project[] = [];
  const lines = content.split('\n');
  
  let currentProject: Project | null = null;
  let inTasksSection = false;
  let projectIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // New project: ## Name
    if (line.startsWith('## ')) {
      // Save previous project
      if (currentProject) {
        projects.push(currentProject);
      }
      
      const name = line.slice(3).trim();
      currentProject = {
        id: generateId(name, projectIndex++),
        name,
        status: 'active',
        tasks: [],
      };
      inTasksSection = false;
      continue;
    }

    if (!currentProject) continue;

    // Status line
    if (line.toLowerCase().startsWith('status:')) {
      const status = parseStatus(line);
      if (status === 'active' || status === 'on-hold' || status === 'completed' || status === 'archived') {
        currentProject.status = status;
      } else if (status === 'on hold') {
        currentProject.status = 'on-hold';
      }
      continue;
    }

    // Tasks section
    if (line.startsWith('### Tasks') || line.startsWith('### ')) {
      inTasksSection = line.toLowerCase().includes('task');
      continue;
    }

    // Task item: - [ ] or - [x]
    if (inTasksSection && /^[-*]\s*\[[ x]\]/.test(line)) {
      const isDone = /\[x\]/i.test(line);
      const title = line.replace(/^[-*]\s*\[[ x]\]\s*/, '').replace(/@\w+\([^)]+\)/g, '').trim();
      
      const task: Task = {
        id: generateId(title, currentProject.tasks.length),
        title,
        status: isDone ? 'done' : 'todo',
        due: parseDateTag(line, 'due'),
        doneDate: parseDateTag(line, 'done'),
        priority: parsePriority(line),
      };
      
      // Check for blocked status
      if (/@blocked/i.test(line) || /status:\s*blocked/i.test(line)) {
        task.status = 'blocked';
      } else if (/@in-?progress/i.test(line) || /status:\s*in-?progress/i.test(line)) {
        task.status = 'in-progress';
      }
      
      currentProject.tasks.push(task);
      continue;
    }

    // Description (non-empty lines that aren't sections or tasks)
    if (line.trim() && !line.startsWith('#') && !line.startsWith('-') && !currentProject.description) {
      currentProject.description = line.trim();
    }
  }

  // Don't forget the last project
  if (currentProject) {
    projects.push(currentProject);
  }

  return projects;
}

/**
 * Parse TASKS.md (standalone tasks not tied to projects)
 * 
 * Format:
 * ## Category (optional)
 * - [ ] Task 1 @due(2026-02-10) @high
 * - [x] Task 2 @done(2026-02-01)
 */
export function parseTasks(content: string): Task[] {
  const tasks: Task[] = [];
  const lines = content.split('\n');
  let taskIndex = 0;

  for (const line of lines) {
    // Task item: - [ ] or - [x]
    if (/^[-*]\s*\[[ x]\]/.test(line)) {
      const isDone = /\[x\]/i.test(line);
      const title = line.replace(/^[-*]\s*\[[ x]\]\s*/, '').replace(/@\w+\([^)]+\)/g, '').trim();
      
      const task: Task = {
        id: generateId(title, taskIndex++),
        title,
        status: isDone ? 'done' : 'todo',
        due: parseDateTag(line, 'due'),
        doneDate: parseDateTag(line, 'done'),
        priority: parsePriority(line),
      };
      
      if (/@blocked/i.test(line)) {
        task.status = 'blocked';
      } else if (/@in-?progress/i.test(line)) {
        task.status = 'in-progress';
      }
      
      tasks.push(task);
    }
  }

  return tasks;
}

/**
 * Parse IDEAS.md
 * 
 * Format:
 * ## Category
 * - Idea title
 *   Notes about the idea
 * 
 * Or simple list:
 * - Idea 1
 * - Idea 2
 */
export function parseIdeas(content: string): Idea[] {
  const ideas: Idea[] = [];
  const lines = content.split('\n');
  let currentCategory: string | undefined;
  let ideaIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Category heading
    if (line.startsWith('## ')) {
      currentCategory = line.slice(3).trim();
      continue;
    }

    // Idea item: - or *
    if (/^[-*]\s+/.test(line) && !line.includes('[ ]')) {
      const title = line.replace(/^[-*]\s+/, '').trim();
      
      // Check for notes on next line (indented)
      let notes: string | undefined;
      if (i + 1 < lines.length && /^\s{2,}/.test(lines[i + 1])) {
        notes = lines[i + 1].trim();
      }

      ideas.push({
        id: generateId(title, ideaIndex++),
        title,
        category: currentCategory,
        notes,
        createdDate: parseDateTag(line, 'created'),
      });
    }
  }

  return ideas;
}

/**
 * Parse INBOX.md (quick capture items)
 * 
 * Format:
 * - Item to process
 * - Another item @from(email)
 */
export function parseInbox(content: string): InboxItem[] {
  const items: InboxItem[] = [];
  const lines = content.split('\n');
  let itemIndex = 0;

  for (const line of lines) {
    // Skip headers and empty lines
    if (line.startsWith('#') || !line.trim()) continue;
    
    // Item: - or *
    if (/^[-*]\s+/.test(line)) {
      const content = line.replace(/^[-*]\s+/, '').replace(/@\w+\([^)]+\)/g, '').trim();
      
      items.push({
        id: generateId(content, itemIndex++),
        content,
        source: parseDateTag(line, 'from'),
        createdDate: parseDateTag(line, 'created'),
      });
    }
  }

  return items;
}

/**
 * Get summary stats from parsed data
 */
export function getWorkspaceStats(
  projects: Project[],
  tasks: Task[],
  ideas: Idea[],
  inbox: InboxItem[]
) {
  const activeProjects = projects.filter(p => p.status === 'active');
  const allTasks = [
    ...tasks,
    ...projects.flatMap(p => p.tasks),
  ];
  
  // Tasks done this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const tasksThisWeek = allTasks.filter(t => {
    if (t.status !== 'done' || !t.doneDate) return false;
    try {
      const doneDate = new Date(t.doneDate);
      return doneDate >= oneWeekAgo;
    } catch {
      return false;
    }
  });

  return {
    inboxCount: inbox.length,
    activeProjectsCount: activeProjects.length,
    tasksDoneThisWeek: tasksThisWeek.length,
    ideasCount: ideas.length,
    // For dashboard display
    activeProjects: activeProjects.slice(0, 5),
    recentTasks: allTasks.filter(t => t.status !== 'done').slice(0, 5),
    recentInbox: inbox.slice(0, 5),
    recentIdeas: ideas.slice(0, 5),
  };
}
