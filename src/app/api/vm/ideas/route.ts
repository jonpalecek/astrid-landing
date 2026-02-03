/**
 * Ideas API Route
 * 
 * Proxies to Admin Agent /api/admin/ideas
 */

import { callAdminAPI, apiResponse, apiError } from '@/lib/admin-api';

// GET /api/vm/ideas - List all ideas
export async function GET() {
  try {
    const data = await callAdminAPI('/ideas');
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/vm/ideas - Create an idea
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = await callAdminAPI('/ideas', { method: 'POST', body });
    return apiResponse(data, 201);
  } catch (error) {
    return apiError(error);
  }
}
