/**
 * Files Folder API Route
 * 
 * Proxies to Admin Agent /api/admin/files/folder
 */

import { callAdminAPI, apiResponse, apiError } from '@/lib/admin-api';

// POST /api/vm/files/folder - Create a new folder
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = await callAdminAPI('/files/folder', { method: 'POST', body });
    return apiResponse(data, 201);
  } catch (error) {
    return apiError(error);
  }
}
