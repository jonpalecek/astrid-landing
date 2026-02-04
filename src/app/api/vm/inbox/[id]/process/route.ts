/**
 * Inbox Process API Route
 * 
 * Proxies to Admin Agent /api/admin/inbox/:id/process
 */

import { callAdminAPI, apiResponse, apiError } from '@/lib/admin-api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/vm/inbox/:id/process - Process inbox item to task
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data = await callAdminAPI(`/inbox/${id}/process`, { method: 'POST', body });
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}
