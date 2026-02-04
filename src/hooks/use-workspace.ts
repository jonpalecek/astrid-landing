/**
 * SWR hooks for workspace data
 * 
 * Provides caching, revalidation, and stale-while-revalidate behavior.
 * Data shows instantly from cache while refreshing in background.
 */

import useSWR from 'swr';

// Global fetcher with error handling
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return res.json();
};

// SWR config for workspace data
const swrConfig = {
  revalidateOnFocus: true,      // Refresh when tab regains focus
  revalidateOnReconnect: true,  // Refresh when network reconnects
  dedupingInterval: 5000,       // Dedupe requests within 5s
  errorRetryCount: 2,           // Retry failed requests twice
};

// Task types
export interface Task {
  id: string;
  title: string;
  done: boolean;
  section?: string;
  due?: string | null;
  doneAt?: string | null;
  priority?: string;
}

export interface TasksResponse {
  tasks: Task[];
  sections: {
    today: string[];
    thisWeek: string[];
    later: string[];
    done: string[];
  };
}

export function useTasks() {
  const { data, error, isLoading, mutate } = useSWR<TasksResponse>(
    '/api/vm/tasks',
    fetcher,
    swrConfig
  );

  // Toggle task done status
  const toggleTask = async (taskId: string, done: boolean) => {
    // Optimistic update
    const optimisticData = data ? {
      ...data,
      tasks: data.tasks.map(t => t.id === taskId ? { ...t, done } : t)
    } : undefined;
    
    await mutate(
      async () => {
        const res = await fetch(`/api/vm/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ done }),
        });
        if (!res.ok) throw new Error('Failed to update task');
        return fetcher('/api/vm/tasks');
      },
      { optimisticData, rollbackOnError: true }
    );
  };

  // Add a new task
  const addTask = async (task: { title: string; section?: string; due?: string; priority?: string }) => {
    await mutate(
      async () => {
        const res = await fetch('/api/vm/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(task),
        });
        if (!res.ok) throw new Error('Failed to add task');
        return fetcher('/api/vm/tasks');
      },
      { revalidate: true }
    );
  };

  // Delete a task
  const deleteTask = async (taskId: string) => {
    // Optimistic update
    const optimisticData = data ? {
      ...data,
      tasks: data.tasks.filter(t => t.id !== taskId)
    } : undefined;

    await mutate(
      async () => {
        const res = await fetch(`/api/vm/tasks/${taskId}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete task');
        return fetcher('/api/vm/tasks');
      },
      { optimisticData, rollbackOnError: true }
    );
  };

  return {
    tasks: data?.tasks || [],
    sections: data?.sections || { today: [], thisWeek: [], later: [], done: [] },
    isLoading,
    isError: !!error,
    error: error?.message,
    refresh: mutate,
    toggleTask,
    addTask,
    deleteTask,
  };
}

// Project types
export interface ProjectTask {
  id: string;
  title: string;
  done: boolean;
  due?: string | null;
  priority?: string;
}

export interface Project {
  id: string;
  name: string;
  status: string;
  description?: string;
  tasks: ProjectTask[];
}

export interface ProjectsResponse {
  projects: Project[];
}

export function useProjects() {
  const { data, error, isLoading, mutate } = useSWR<ProjectsResponse>(
    '/api/vm/projects',
    fetcher,
    swrConfig
  );

  // Add a new project
  const addProject = async (project: { name: string; description?: string; status?: string }) => {
    await mutate(
      async () => {
        const res = await fetch('/api/vm/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(project),
        });
        if (!res.ok) throw new Error('Failed to add project');
        return fetcher('/api/vm/projects');
      },
      { revalidate: true }
    );
  };

  // Update project status
  const updateStatus = async (projectId: string, status: string) => {
    // Optimistic update
    const optimisticData = data ? {
      ...data,
      projects: data.projects.map(p => p.id === projectId ? { ...p, status } : p)
    } : undefined;

    await mutate(
      async () => {
        const res = await fetch(`/api/vm/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error('Failed to update project');
        return fetcher('/api/vm/projects');
      },
      { optimisticData, rollbackOnError: true }
    );
  };

  // Delete a project
  const deleteProject = async (projectId: string) => {
    // Optimistic update
    const optimisticData = data ? {
      ...data,
      projects: data.projects.filter(p => p.id !== projectId)
    } : undefined;

    await mutate(
      async () => {
        const res = await fetch(`/api/vm/projects/${projectId}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete project');
        return fetcher('/api/vm/projects');
      },
      { optimisticData, rollbackOnError: true }
    );
  };

  return {
    projects: data?.projects || [],
    isLoading,
    isError: !!error,
    error: error?.message,
    refresh: mutate,
    addProject,
    updateStatus,
    deleteProject,
  };
}

// Idea types
export interface Idea {
  id: string;
  title: string;
  category?: string;
  notes?: string;
}

export interface IdeasResponse {
  ideas: Idea[];
}

export function useIdeas() {
  const { data, error, isLoading, mutate } = useSWR<IdeasResponse>(
    '/api/vm/ideas',
    fetcher,
    swrConfig
  );

  // Add a new idea
  const addIdea = async (idea: { title: string; content?: string; category?: string }) => {
    await mutate(
      async () => {
        const res = await fetch('/api/vm/ideas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(idea),
        });
        if (!res.ok) throw new Error('Failed to add idea');
        return fetcher('/api/vm/ideas');
      },
      { revalidate: true }
    );
  };

  // Delete an idea
  const deleteIdea = async (ideaId: string) => {
    // Optimistic update
    const optimisticData = data ? {
      ...data,
      ideas: data.ideas.filter(i => i.id !== ideaId)
    } : undefined;

    await mutate(
      async () => {
        const res = await fetch(`/api/vm/ideas/${ideaId}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete idea');
        return fetcher('/api/vm/ideas');
      },
      { optimisticData, rollbackOnError: true }
    );
  };

  return {
    ideas: data?.ideas || [],
    isLoading,
    isError: !!error,
    error: error?.message,
    refresh: mutate,
    addIdea,
    deleteIdea,
  };
}

// Inbox types
export interface InboxItem {
  id: string;
  content: string;
  source?: string;
  addedAt?: string;
}

export interface InboxResponse {
  items: InboxItem[];
}

export function useInbox() {
  const { data, error, isLoading, mutate } = useSWR<InboxResponse>(
    '/api/vm/inbox',
    fetcher,
    swrConfig
  );

  // Add an inbox item
  const addItem = async (content: string) => {
    await mutate(
      async () => {
        const res = await fetch('/api/vm/inbox', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
        if (!res.ok) throw new Error('Failed to add item');
        return fetcher('/api/vm/inbox');
      },
      { revalidate: true }
    );
  };

  // Delete an inbox item
  const deleteItem = async (itemId: string) => {
    // Optimistic update
    const optimisticData = data ? {
      ...data,
      items: data.items.filter(i => i.id !== itemId)
    } : undefined;

    await mutate(
      async () => {
        const res = await fetch(`/api/vm/inbox/${itemId}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete item');
        return fetcher('/api/vm/inbox');
      },
      { optimisticData, rollbackOnError: true }
    );
  };

  // Process inbox item to task
  const processToTask = async (itemId: string, section: string = 'today') => {
    await mutate(
      async () => {
        const res = await fetch(`/api/vm/inbox/${itemId}/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'to-task', section }),
        });
        if (!res.ok) throw new Error('Failed to process item');
        return fetcher('/api/vm/inbox');
      },
      { revalidate: true }
    );
  };

  return {
    items: data?.items || [],
    isLoading,
    isError: !!error,
    error: error?.message,
    refresh: mutate,
    addItem,
    deleteItem,
    processToTask,
  };
}

// Dashboard summary hook - fetches all data for main dashboard
export function useDashboard() {
  const tasks = useTasks();
  const projects = useProjects();
  const ideas = useIdeas();
  const inbox = useInbox();

  return {
    tasks,
    projects,
    ideas,
    inbox,
    isLoading: tasks.isLoading || projects.isLoading || ideas.isLoading || inbox.isLoading,
  };
}

// File types
export interface FileItem {
  name: string;
  size: number;
  modified: string;
}

export interface DirectoryResponse {
  path: string;
  folders: string[];
  files: FileItem[];
}

export interface FileContentResponse {
  path: string;
  content: string;
  size: number;
  modified: string;
}

export function useFiles(path: string, userView: boolean = false) {
  const url = `/api/vm/files?path=${encodeURIComponent(path)}${userView ? '&userView=true' : ''}`;
  
  const { data, error, isLoading, mutate } = useSWR<DirectoryResponse>(
    url,
    fetcher,
    swrConfig
  );

  return {
    directory: data,
    folders: data?.folders || [],
    files: data?.files || [],
    isLoading,
    isError: !!error,
    error: error?.message,
    refresh: mutate,
  };
}

export function useFileContent(path: string | null) {
  const { data, error, isLoading, mutate } = useSWR<FileContentResponse>(
    path ? `/api/vm/files/content?path=${encodeURIComponent(path)}` : null,
    fetcher,
    swrConfig
  );

  return {
    file: data,
    content: data?.content || '',
    isLoading,
    isError: !!error,
    error: error?.message,
    refresh: mutate,
  };
}
