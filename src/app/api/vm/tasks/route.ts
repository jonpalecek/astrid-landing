/**
 * Tasks API Route
 * 
 * Proxies to Admin Agent /api/admin/tasks
 */

import { callAdminAPI, apiResponse, apiError } from '@/lib/admin-api';

// GET /api/vm/tasks - List all tasks
export async function GET() {
  try {
    const data = await callAdminAPI('/tasks');
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/vm/tasks - Create a task
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = await callAdminAPI('/tasks', { method: 'POST', body });
    return apiResponse(data, 201);
  } catch (error) {
    return apiError(error);
  }
}
