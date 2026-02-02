// Cloudflare API client for tunnel management

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

interface TunnelCredentials {
  accountTag: string;
  tunnelId: string;
  tunnelName: string;
  tunnelSecret: string;
}

interface CreateTunnelResult {
  tunnelId: string;
  tunnelName: string;
  hostname: string;
  credentials: TunnelCredentials;
  credentialsJson: string;
}

// Generate a random tunnel secret (32 bytes, base64 encoded)
function generateTunnelSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString('base64');
}

export async function createTunnel(instanceId: string): Promise<CreateTunnelResult> {
  const token = process.env.CF_API_TOKEN;
  const accountId = process.env.CF_ACCOUNT_ID;
  const tunnelDomain = process.env.CF_TUNNEL_DOMAIN || 'tunnel.getastrid.ai';

  if (!token || !accountId) {
    throw new Error('Cloudflare credentials not configured');
  }

  // Use timestamp to ensure unique tunnel name
  const timestamp = Date.now().toString(36);
  const tunnelName = `astrid-${instanceId.slice(0, 8)}-${timestamp}`;
  const tunnelSecret = generateTunnelSecret();

  // Create the tunnel
  const createResponse = await fetch(
    `${CF_API_BASE}/accounts/${accountId}/cfd_tunnel`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: tunnelName,
        tunnel_secret: tunnelSecret,
      }),
    }
  );

  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`Failed to create tunnel: ${error}`);
  }

  const createData = await createResponse.json();
  const tunnelId = createData.result.id;

  // Get the zone ID for getastrid.ai
  const zonesResponse = await fetch(
    `${CF_API_BASE}/zones?name=getastrid.ai`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  const zonesData = await zonesResponse.json();
  const zoneId = zonesData.result[0]?.id;

  if (!zoneId) {
    throw new Error('Could not find zone for getastrid.ai');
  }

  // Create DNS record for the tunnel (use same timestamp for consistency)
  const hostname = `${instanceId.slice(0, 8)}-${timestamp}.${tunnelDomain}`;
  
  const dnsResponse = await fetch(
    `${CF_API_BASE}/zones/${zoneId}/dns_records`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'CNAME',
        name: hostname,
        content: `${tunnelId}.cfargotunnel.com`,
        proxied: true,
      }),
    }
  );

  if (!dnsResponse.ok) {
    const error = await dnsResponse.text();
    console.error('DNS creation failed:', error);
    // Don't throw - tunnel still works with .cfargotunnel.com URL
  }

  // Build credentials object (what cloudflared needs)
  const credentials: TunnelCredentials = {
    accountTag: accountId,
    tunnelId: tunnelId,
    tunnelName: tunnelName,
    tunnelSecret: tunnelSecret,
  };

  // JSON format that cloudflared expects
  const credentialsJson = JSON.stringify({
    AccountTag: accountId,
    TunnelID: tunnelId,
    TunnelName: tunnelName,
    TunnelSecret: tunnelSecret,
  });

  return {
    tunnelId,
    tunnelName,
    hostname: `https://${hostname}`,
    credentials,
    credentialsJson,
  };
}

export async function deleteTunnel(tunnelId: string, hostname?: string): Promise<void> {
  const token = process.env.CF_API_TOKEN;
  const accountId = process.env.CF_ACCOUNT_ID;

  if (!token || !accountId) {
    throw new Error('Cloudflare credentials not configured');
  }

  // Delete DNS CNAME record if hostname provided
  if (hostname) {
    try {
      // Strip https:// prefix if present
      const dnsName = hostname.replace(/^https?:\/\//, '');
      
      // Get zone ID for getastrid.ai
      const zonesResponse = await fetch(
        `${CF_API_BASE}/zones?name=getastrid.ai`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );
      const zonesData = await zonesResponse.json();
      const zoneId = zonesData.result[0]?.id;

      if (zoneId) {
        // Find DNS record by name
        const dnsListResponse = await fetch(
          `${CF_API_BASE}/zones/${zoneId}/dns_records?name=${dnsName}&type=CNAME`,
          {
            headers: { 'Authorization': `Bearer ${token}` },
          }
        );
        const dnsListData = await dnsListResponse.json();
        const dnsRecord = dnsListData.result?.[0];

        if (dnsRecord?.id) {
          // Delete the DNS record
          await fetch(
            `${CF_API_BASE}/zones/${zoneId}/dns_records/${dnsRecord.id}`,
            {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` },
            }
          );
          // DNS record deleted successfully
        }
      }
    } catch (e) {
      console.error('Failed to delete DNS record:', e);
      // Continue with tunnel deletion anyway
    }
  }

  // Clean up tunnel connections (force)
  await fetch(
    `${CF_API_BASE}/accounts/${accountId}/cfd_tunnel/${tunnelId}/connections`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  // Delete the tunnel
  const response = await fetch(
    `${CF_API_BASE}/accounts/${accountId}/cfd_tunnel/${tunnelId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok && response.status !== 404) {
    const error = await response.text();
    throw new Error(`Failed to delete tunnel: ${error}`);
  }
}

export async function getTunnelStatus(tunnelId: string): Promise<{
  status: string;
  connections: number;
}> {
  const token = process.env.CF_API_TOKEN;
  const accountId = process.env.CF_ACCOUNT_ID;

  if (!token || !accountId) {
    throw new Error('Cloudflare credentials not configured');
  }

  const response = await fetch(
    `${CF_API_BASE}/accounts/${accountId}/cfd_tunnel/${tunnelId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    return { status: 'unknown', connections: 0 };
  }

  const data = await response.json();
  return {
    status: data.result.status || 'unknown',
    connections: data.result.connections?.length || 0,
  };
}
