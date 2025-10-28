import { NextRequest, NextResponse } from 'next/server';

import { buildGoogleFormsPreview } from '../../../../src/lib/integrations/googleForms';
import { isFeatureFlagEnabled } from '../../../../src/lib/featureFlags';

interface GoogleFormsPreviewRequest {
  uid?: string;
  csvContent?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let payload: GoogleFormsPreviewRequest;

  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const uid = typeof payload.uid === 'string' ? payload.uid.trim() : '';
  const csvContent = typeof payload.csvContent === 'string' ? payload.csvContent.trim() : '';

  if (!uid) {
    return NextResponse.json({ error: 'A user ID (uid) is required.' }, { status: 400 });
  }

  if (!csvContent) {
    return NextResponse.json({ error: 'CSV content is required.' }, { status: 400 });
  }

  const enabled = await isFeatureFlagEnabled(uid, 'googleFormsImport');
  if (!enabled) {
    return NextResponse.json({ error: 'The Google Forms integration is not enabled for this account.' }, { status: 403 });
  }

  try {
    const preview = buildGoogleFormsPreview(csvContent);
    return NextResponse.json({ preview });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to parse Google Forms CSV.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
