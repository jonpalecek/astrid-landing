/**
 * Files API Route
 * 
 * Proxies to Admin Agent /api/admin/files
 */

import { callAdminAPI, apiResponse, apiError } from '@/lib/admin-api';
import { NextRequest } from 'next/server';

// GET /api/vm/files?path=~ - List directory
export async function GET(req: NextRequest) {
  try {
    const path = req.nextUrl.searchParams.get('path') || '~';
    const data = await callAdminAPI(`/files?path=${encodeURIComponent(path)}`);
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/vm/files - Create a new file
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = await callAdminAPI('/files', { method: 'POST', body });
    return apiResponse(data, 201);
  } catch (error) {
    return apiError(error);
  }
}

// DELETE /api/vm/files?path=~/file.md - Delete file or folder
export async function DELETE(req: NextRequest) {
  try {
    const path = req.nextUrl.searchParams.get('path');
    if (!path) {
      return apiResponse({ error: 'Path required' }, 400);
    }
    const data = await callAdminAPI(`/files?path=${encodeURIComponent(path)}`, { method: 'DELETE' });
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}
