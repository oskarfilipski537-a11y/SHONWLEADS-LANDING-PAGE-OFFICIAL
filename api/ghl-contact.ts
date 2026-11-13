interface ApiRequest {
  method?: string;
  body?: unknown;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (data: unknown) => void;
  setHeader: (name: string, value: string) => void;
  end: () => void;
}

interface GhlContactRequestBody {
  fullName?: string;
  full_name?: string;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  consent?: boolean | string;
}

interface GhlUpsertResponse {
  new?: boolean;
  contact?: {
    id?: string;
  };
  message?: string | string[];
  error?: string;
}

const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const GHL_API_VERSION = '2021-07-28';

function normalizeUSPhone(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  return rawPhone.trim();
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: '', lastName: '' };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

function parseBody(rawBody: unknown): GhlContactRequestBody {
  if (!rawBody) return {};
  if (typeof rawBody === 'string') {
    try {
      return JSON.parse(rawBody) as GhlContactRequestBody;
    } catch {
      return {};
    }
  }
  if (typeof rawBody === 'object') {
    return rawBody as GhlContactRequestBody;
  }
  return {};
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const apiKey = (process.env.GHL_API_KEY || process.env.GOHIGHLEVEL_API_KEY || '').trim();
  const locationId = (process.env.GHL_LOCATION_ID || process.env.GOHIGHLEVEL_LOCATION_ID || '').trim();

  if (!apiKey || !locationId) {
    console.error('[GHL] Missing GHL_API_KEY or GHL_LOCATION_ID environment variables');
    res.status(500).json({
      ok: false,
      configured: false,
      error: 'GoHighLevel credentials (GHL_API_KEY and GHL_LOCATION_ID) are not configured on the server.',
    });
    return;
  }

  const body = parseBody(req.body);
  const rawFullName = String(body.fullName || body.full_name || '').trim();
  const fallbackSplit = splitName(rawFullName);
  const firstName = String(body.firstName || body.first_name || fallbackSplit.firstName || '').trim();
  const lastName = String(body.lastName || body.last_name || fallbackSplit.lastName || '').trim();
  const fullName = rawFullName || [firstName, lastName].filter(Boolean).join(' ').trim();
  const email = String(body.email || '').trim();
  const rawPhone = String(body.phone || '').trim();
  const phone = normalizeUSPhone(rawPhone);
  const hasConsent = body.consent === true || body.consent === 'true';

  if (!email || !phone || !firstName) {
    res.status(400).json({
      ok: false,
      error: 'Missing required contact fields: name, email, and phone are required.',
    });
    return;
  }

  const ghlHeaders = {
    Authorization: `Bearer ${apiKey}`,
    Version: GHL_API_VERSION,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  try {
    // 1. Create or update the contact in GoHighLevel (no tags passed here so existing tags aren't overwritten)
    const upsertPayload: Record<string, string> = {
      locationId,
      firstName,
      name: fullName,
      email,
      phone,
      source: 'ShownLeads Funnel',
    };

    if (lastName) {
      upsertPayload.lastName = lastName;
    }

    const upsertRes = await fetch(`${GHL_API_BASE}/contacts/upsert`, {
      method: 'POST',
      headers: ghlHeaders,
      body: JSON.stringify(upsertPayload),
    });

    const upsertData = (await upsertRes.json().catch(() => ({}))) as GhlUpsertResponse;

    if (!upsertRes.ok) {
      console.error('[GHL] Contact upsert failed:', upsertRes.status, upsertData);
      res.status(502).json({
        ok: false,
        error: 'Failed to create or update contact in GoHighLevel.',
        status: upsertRes.status,
      });
      return;
    }

    const contactId = upsertData?.contact?.id;
    let tagAdded = false;

    // 2. Only if the SMS consent box was ticked, add the "sms-consent" tag. Otherwise add no tag.
    if (hasConsent && contactId) {
      const tagRes = await fetch(`${GHL_API_BASE}/contacts/${encodeURIComponent(contactId)}/tags`, {
        method: 'POST',
        headers: ghlHeaders,
        body: JSON.stringify({ tags: ['sms-consent'] }),
      });

      if (!tagRes.ok) {
        const tagError = await tagRes.text().catch(() => '');
        console.error('[GHL] Failed to add sms-consent tag:', tagRes.status, tagError);
        res.status(502).json({
          ok: false,
          contactId,
          tagAdded: false,
          error: 'Contact was saved in GoHighLevel, but adding the sms-consent tag failed.',
        });
        return;
      }

      tagAdded = true;
    }

    res.status(200).json({
      ok: true,
      contactId: contactId || null,
      created: Boolean(upsertData?.new),
      tagAdded,
    });
  } catch (err) {
    console.error('[GHL] Unexpected error syncing contact:', err);
    res.status(500).json({
      ok: false,
      error: 'Unexpected error communicating with GoHighLevel.',
    });
  }
}
