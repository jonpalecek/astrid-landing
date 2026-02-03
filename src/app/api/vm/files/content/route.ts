/**
 * Files Content API Route
 * 
 * Proxies to Admin Agent /api/admin/files/content
 */

import { callAdminAPI, apiResponse, apiError } from '@/lib/admin-api';
import { NextRequest } from 'next/server';

// GET /api/vm/files/content?path=~/SOUL.md - Read file content
export async function GET(req: NextRequest) {
  try {
    const path = req.nextUrl.searchParams.get('path');
    if (!path) {
      return apiResponse({ error: 'Path required' }, 400);
    }
    const data = await callAdminAPI(`/files/content?path=${encodeURIComponent(path)}`);
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}

// PUT /api/vm/files/content - Write file content
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const data = await callAdminAPI('/files/content', { method: 'PUT', body });
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}
