import { NextRequest, NextResponse } from 'next/server';
import { updateSuggestedReply } from '@/lib/dashboard/data';

export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Missing analysis id.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const suggestedReply = typeof body?.suggestedReply === 'string' ? body.suggestedReply.trim() : '';

    if (!suggestedReply) {
      return NextResponse.json({ error: 'Suggested reply is required.' }, { status: 400 });
    }

    await updateSuggestedReply(id, suggestedReply);

    return NextResponse.json({ id, suggestedReply });
  } catch (error) {
    console.error('Failed to update suggested reply', error);
    return NextResponse.json({ error: 'Failed to update reply.' }, { status: 500 });
  }
}
