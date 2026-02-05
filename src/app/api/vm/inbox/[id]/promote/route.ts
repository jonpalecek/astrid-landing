/**
 * Inbox Promote API Route
 */

import { callAdminAPI, apiResponse, apiError } from '@/lib/admin-api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/vm/inbox/:id/promote - Promote inbox item to task or project
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data = await callAdminAPI(`/inbox/${id}/promote`, { method: 'POST', body });
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}
