/**
 * Single Project API Route
 * 
 * Proxies to Admin Agent /api/admin/projects/:id
 */

import { callAdminAPI, apiResponse, apiError } from '@/lib/admin-api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/vm/projects/:id - Get a single project
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const data = await callAdminAPI(`/projects/${id}`);
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}

// PATCH /api/vm/projects/:id - Update a project
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data = await callAdminAPI(`/projects/${id}`, { method: 'PATCH', body });
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}

// DELETE /api/vm/projects/:id - Delete a project
// Query param: ?deleteFolder=true to also delete the project folder
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const deleteFolder = url.searchParams.get('deleteFolder') === 'true';
    const endpoint = deleteFolder ? `/projects/${id}?deleteFolder=true` : `/projects/${id}`;
    const data = await callAdminAPI(endpoint, { method: 'DELETE' });
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}
