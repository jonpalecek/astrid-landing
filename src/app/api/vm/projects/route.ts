/**
 * Projects API Route
 * 
 * Proxies to Admin Agent /api/admin/projects
 */

import { callAdminAPI, apiResponse, apiError } from '@/lib/admin-api';

// GET /api/vm/projects - List all projects
export async function GET() {
  try {
    const data = await callAdminAPI('/projects');
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/vm/projects - Create a project
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = await callAdminAPI('/projects', { method: 'POST', body });
    return apiResponse(data, 201);
  } catch (error) {
    return apiError(error);
  }
}
