/**
 * Single Task API Route
 * 
 * Proxies to Admin Agent /api/admin/tasks/:id
 */

import { callAdminAPI, apiResponse, apiError } from '@/lib/admin-api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/vm/tasks/:id - Get a single task
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const data = await callAdminAPI(`/tasks/${id}`);
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}

// PATCH /api/vm/tasks/:id - Update a task
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data = await callAdminAPI(`/tasks/${id}`, { method: 'PATCH', body });
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}

// DELETE /api/vm/tasks/:id - Delete a task
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const data = await callAdminAPI(`/tasks/${id}`, { method: 'DELETE' });
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}
