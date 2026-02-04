import { NextRequest, NextResponse } from 'next/server';
import { getAdminConfig } from '@/lib/admin-api';

export const runtime = 'nodejs';

/**
 * POST /api/vm/files/upload?path=~/uploads
 * Upload a file to the VM
 */
export async function POST(request: NextRequest) {
  try {
    const config = await getAdminConfig();
    if (!config) {
      return NextResponse.json({ error: 'VM not configured' }, { status: 404 });
    }

    const path = request.nextUrl.searchParams.get('path') || '~/uploads';
    
    // Get the form data from the request
    const formData = await request.formData();
    
    // Forward to Admin Agent
    const response = await fetch(
      `${config.tunnelUrl}/api/admin/files/upload?path=${encodeURIComponent(path)}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.gatewayToken}`,
        },
        body: formData,
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Upload proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
