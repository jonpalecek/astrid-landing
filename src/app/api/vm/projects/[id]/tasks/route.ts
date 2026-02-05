/**
 * Project Tasks API Route
 * 
 * Proxies to Admin Agent /api/admin/projects/:projectId/tasks
 */

import { callAdminAPI, apiResponse, apiError } from '@/lib/admin-api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/vm/projects/:id/tasks - List tasks for a project
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const data = await callAdminAPI(`/projects/${id}/tasks`);
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/vm/projects/:id/tasks - Add task to project
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data = await callAdminAPI(`/projects/${id}/tasks`, { method: 'POST', body });
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}
