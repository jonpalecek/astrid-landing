/**
 * Single Inbox Item API Route
 * 
 * Proxies to Admin Agent /api/admin/inbox/:id
 */

import { callAdminAPI, apiResponse, apiError } from '@/lib/admin-api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/vm/inbox/:id - Get a single inbox item
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const data = await callAdminAPI(`/inbox/${id}`);
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}

// PATCH /api/vm/inbox/:id - Update an inbox item
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data = await callAdminAPI(`/inbox/${id}`, { method: 'PATCH', body });
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}

// DELETE /api/vm/inbox/:id - Delete an inbox item
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const data = await callAdminAPI(`/inbox/${id}`, { method: 'DELETE' });
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}
