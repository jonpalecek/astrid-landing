/**
 * Inbox API Route
 * 
 * Proxies to Admin Agent /api/admin/inbox
 */

import { callAdminAPI, apiResponse, apiError } from '@/lib/admin-api';

// GET /api/vm/inbox - List all inbox items
export async function GET() {
  try {
    const data = await callAdminAPI('/inbox');
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/vm/inbox - Create an inbox item
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = await callAdminAPI('/inbox', { method: 'POST', body });
    return apiResponse(data, 201);
  } catch (error) {
    return apiError(error);
  }
}
