/**
 * Single Project Task API Route
 * 
 * Proxies to Admin Agent /api/admin/projects/:projectId/tasks/:taskId
 */

import { callAdminAPI, apiResponse, apiError } from '@/lib/admin-api';

interface RouteParams {
  params: Promise<{ id: string; taskId: string }>;
}

// PATCH /api/vm/projects/:id/tasks/:taskId - Update a task
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { id, taskId } = await params;
    const body = await req.json();
    const data = await callAdminAPI(`/projects/${id}/tasks/${taskId}`, { method: 'PATCH', body });
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}

// DELETE /api/vm/projects/:id/tasks/:taskId - Delete a task
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const { id, taskId } = await params;
    const data = await callAdminAPI(`/projects/${id}/tasks/${taskId}`, { method: 'DELETE' });
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}
