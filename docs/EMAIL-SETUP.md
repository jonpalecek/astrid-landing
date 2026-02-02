# Email Setup Guide: Google Workspace + SendGrid

This guide sets up:
- **Google Workspace** — Company email (hello@getastrid.ai, support@getastrid.ai, etc.)
- **SendGrid** — Transactional emails from the app (magic links, notifications)

Both work together on the same domain.

---

## Part 1: Google Workspace Setup

### Step 1: Sign Up for Google Workspace
1. Go to https://workspace.google.com
2. Click "Get Started"
3. Use domain: `getastrid.ai`
4. Create your admin account (e.g., jon@getastrid.ai)
5. Choose plan (Business Starter is $6/user/month)

### Step 2: Verify Domain Ownership
Google will ask you to verify you own the domain. Easiest method:

**Add TXT Record in Cloudflare:**
| Type | Name | Content |
|------|------|---------|
| TXT | @ | google-site-verification=XXXXX (Google provides this) |

### Step 3: Configure MX Records
In Cloudflare DNS, **delete any existing MX records**, then add:

| Type | Name | Mail Server | Priority |
|------|------|-------------|----------|
| MX | @ | aspmx.l.google.com | 1 |
| MX | @ | alt1.aspmx.l.google.com | 5 |
| MX | @ | alt2.aspmx.l.google.com | 5 |
| MX | @ | alt3.aspmx.l.google.com | 10 |
| MX | @ | alt4.aspmx.l.google.com | 10 |

⚠️ Make sure the proxy toggle is OFF (DNS only, grey cloud) for MX records.

### Step 4: Set Up SPF Record
Add a TXT record for SPF (allows Google to send email on your behalf):

| Type | Name | Content |
|------|------|---------|
| TXT | @ | v=spf1 include:_spf.google.com include:sendgrid.net ~all |

☝️ This SPF record includes **both** Google Workspace AND SendGrid.

### Step 5: Set Up DKIM for Google Workspace
1. In Google Admin Console → Apps → Google Workspace → Gmail → Authenticate Email
2. Click "Generate new record"
3. Copy the TXT record value
4. Add to Cloudflare:

| Type | Name | Content |
|------|------|---------|
| TXT | google._domainkey | v=DKIM1; k=rsa; p=XXXXX (Google provides this) |

5. Go back to Google Admin and click "Start Authentication"

### Step 6: Set Up DMARC (Optional but Recommended)
Add a TXT record:

| Type | Name | Content |
|------|------|---------|
| TXT | _dmarc | v=DMARC1; p=quarantine; rua=mailto:dmarc@getastrid.ai |

---

## Part 2: SendGrid Setup

### Step 1: Create SendGrid Account
1. Go to https://sendgrid.com
2. Sign up (free tier = 100 emails/day)
3. Complete account verification

### Step 2: Authenticate Your Domain
1. In SendGrid Dashboard → Settings → Sender Authentication
2. Click "Authenticate Your Domain"
3. Select DNS host: "Other" (we'll use Cloudflare)
4. Enter domain: `getastrid.ai`
5. SendGrid will give you 3 CNAME records to add

### Step 3: Add SendGrid DNS Records
In Cloudflare, add the CNAME records SendGrid provides (example):

| Type | Name | Target |
|------|------|--------|
| CNAME | em1234.getastrid.ai | u12345.wl123.sendgrid.net |
| CNAME | s1._domainkey.getastrid.ai | s1.domainkey.u12345.wl123.sendgrid.net |
| CNAME | s2._domainkey.getastrid.ai | s2.domainkey.u12345.wl123.sendgrid.net |

⚠️ Proxy must be OFF (grey cloud) for these records.

### Step 4: Verify in SendGrid
1. Go back to SendGrid and click "Verify"
2. All 3 records should show ✅

### Step 5: Create an API Key
1. SendGrid Dashboard → Settings → API Keys
2. Click "Create API Key"
3. Name it: `supabase-astrid`
4. Permissions: "Restricted Access" → Enable only "Mail Send"
5. Copy the API key (you won't see it again!)

---

## Part 3: Configure Supabase SMTP

### Step 1: Open Supabase Dashboard
1. Go to your project → Project Settings → Auth
2. Scroll to "SMTP Settings"
3. Toggle ON "Enable Custom SMTP"

### Step 2: Enter SendGrid SMTP Settings

| Field | Value |
|-------|-------|
| Host | smtp.sendgrid.net |
| Port | 587 |
| User | apikey |
| Password | (your SendGrid API key from Step 5) |
| Sender email | noreply@getastrid.ai |
| Sender name | Astrid |

### Step 3: Save and Test
1. Click "Save"
2. Try signing up with a new email
3. Magic link should arrive within seconds!

---

## DNS Record Summary

After setup, your Cloudflare DNS should have:

```
# Google Workspace Verification
TXT   @                    google-site-verification=XXXXX

# Email Routing (Google Workspace)
MX    @                    aspmx.l.google.com (priority 1)
MX    @                    alt1.aspmx.l.google.com (priority 5)
MX    @                    alt2.aspmx.l.google.com (priority 5)
MX    @                    alt3.aspmx.l.google.com (priority 10)
MX    @                    alt4.aspmx.l.google.com (priority 10)

# SPF (covers both Google + SendGrid)
TXT   @                    v=spf1 include:_spf.google.com include:sendgrid.net ~all

# DKIM for Google Workspace
TXT   google._domainkey    v=DKIM1; k=rsa; p=XXXXX

# DKIM for SendGrid (3 CNAMEs)
CNAME em1234              u12345.wl123.sendgrid.net
CNAME s1._domainkey       s1.domainkey.u12345.wl123.sendgrid.net
CNAME s2._domainkey       s2.domainkey.u12345.wl123.sendgrid.net

# DMARC (optional)
TXT   _dmarc               v=DMARC1; p=quarantine; rua=mailto:dmarc@getastrid.ai
```

---

## Troubleshooting

### Emails still not arriving?
1. Check SendGrid Activity Feed for delivery status
2. Check Supabase Auth logs
3. Verify DNS propagation: https://dnschecker.org
4. Check spam/junk folders

### SendGrid verification failing?
- DNS propagation can take up to 48 hours (usually 5-15 min)
- Make sure Cloudflare proxy is OFF for CNAME records
- Double-check record names (no typos)

### Google Workspace email not working?
- MX record propagation can take up to 48 hours
- Verify domain in Google Admin Console
- Check that old MX records were deleted

---

## Cost Summary

| Service | Plan | Cost |
|---------|------|------|
| Google Workspace | Business Starter | $6/user/month |
| SendGrid | Free | $0 (100 emails/day) |
| SendGrid | Essentials | $20/month (50k emails) |

For Astrid's current stage, free SendGrid tier is plenty.
