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

  return {
    tasks: data?.tasks || [],
    sections: data?.sections || { today: [], thisWeek: [], later: [], done: [] },
    isLoading,
    isError: !!error,
    error: error?.message,
    refresh: mutate,
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

  return {
    projects: data?.projects || [],
    isLoading,
    isError: !!error,
    error: error?.message,
    refresh: mutate,
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

  return {
    ideas: data?.ideas || [],
    isLoading,
    isError: !!error,
    error: error?.message,
    refresh: mutate,
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

  return {
    items: data?.items || [],
    isLoading,
    isError: !!error,
    error: error?.message,
    refresh: mutate,
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

export function useFiles(path: string) {
  const { data, error, isLoading, mutate } = useSWR<DirectoryResponse>(
    `/api/vm/files?path=${encodeURIComponent(path)}`,
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
