/**
 * Task Promote API Route
 * 
 * Proxies to Admin Agent /api/admin/tasks/:id/promote
 */

import { callAdminAPI, apiResponse, apiError } from '@/lib/admin-api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/vm/tasks/:id/promote - Promote task to project
export async function POST(_req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const data = await callAdminAPI(`/tasks/${id}/promote`, { method: 'POST' });
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}
