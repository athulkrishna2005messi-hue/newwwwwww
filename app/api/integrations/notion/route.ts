import { NextRequest, NextResponse } from 'next/server';

import { fetchDatabasePreview } from '../../../../src/lib/integrations/notion';
import { isFeatureFlagEnabled } from '../../../../src/lib/featureFlags';

interface NotionPreviewRequest {
  uid?: string;
  databaseId?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let payload: NotionPreviewRequest;

  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const uid = typeof payload.uid === 'string' ? payload.uid.trim() : '';
  const databaseId = typeof payload.databaseId === 'string' ? payload.databaseId.trim() : '';

  if (!uid) {
    return NextResponse.json({ error: 'A user ID (uid) is required.' }, { status: 400 });
  }

  if (!databaseId) {
    return NextResponse.json({ error: 'A Notion database ID is required.' }, { status: 400 });
  }

  const enabled = await isFeatureFlagEnabled(uid, 'notionImport');
  if (!enabled) {
    return NextResponse.json({ error: 'The Notion integration is not enabled for this account.' }, { status: 403 });
  }

  try {
    const preview = await fetchDatabasePreview(databaseId);
    return NextResponse.json({ preview });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to generate Notion preview.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
