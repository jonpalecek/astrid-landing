/**
 * Single Idea API Route
 * 
 * Proxies to Admin Agent /api/admin/ideas/:id
 */

import { callAdminAPI, apiResponse, apiError } from '@/lib/admin-api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/vm/ideas/:id - Get a single idea
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const data = await callAdminAPI(`/ideas/${id}`);
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}

// PATCH /api/vm/ideas/:id - Update an idea
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data = await callAdminAPI(`/ideas/${id}`, { method: 'PATCH', body });
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}

// DELETE /api/vm/ideas/:id - Delete an idea
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const data = await callAdminAPI(`/ideas/${id}`, { method: 'DELETE' });
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}
