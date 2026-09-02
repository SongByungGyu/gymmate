import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateInviteCode } from '@/lib/utils/invite-code';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauth' }, { status: 401 });

  const { data: group } = await supabase
    .from('groups').select('created_by').eq('id', groupId).single();
  if (!group || group.created_by !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  for (let i = 0; i < 5; i++) {
    const code = generateInviteCode();
    const { error } = await supabase
      .from('groups').update({ invite_code: code }).eq('id', groupId);
    if (!error) return NextResponse.json({ code });
    if ((error as { code?: string }).code !== '23505') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
  return NextResponse.json({ error: 'collision retry exhausted' }, { status: 500 });
}
