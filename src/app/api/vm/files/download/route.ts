import { NextRequest, NextResponse } from 'next/server';
import { getAdminConfig } from '@/lib/admin-api';

export const runtime = 'nodejs';

/**
 * GET /api/vm/files/download?path=~/projects/report.pdf
 * Download a file from the VM
 */
export async function GET(request: NextRequest) {
  try {
    const config = await getAdminConfig();
    if (!config) {
      return NextResponse.json({ error: 'VM not configured' }, { status: 404 });
    }

    const path = request.nextUrl.searchParams.get('path');
    if (!path) {
      return NextResponse.json({ error: 'Path required' }, { status: 400 });
    }

    // Forward to Admin Agent
    const response = await fetch(
      `${config.tunnelUrl}/api/admin/files/download?path=${encodeURIComponent(path)}`,
      {
        headers: {
          'Authorization': `Bearer ${config.gatewayToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Download failed' }));
      return NextResponse.json(error, { status: response.status });
    }

    // Get the file content and headers
    const buffer = await response.arrayBuffer();
    const contentDisposition = response.headers.get('content-disposition');
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Return the file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition || 'attachment',
      },
    });
  } catch (error) {
    console.error('Download proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}
