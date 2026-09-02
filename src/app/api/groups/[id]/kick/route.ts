import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params;
  const { userId } = await request.json();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauth' }, { status: 401 });

  const { data: group } = await supabase
    .from('groups').select('created_by').eq('id', groupId).single();
  if (!group || group.created_by !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  if (userId === user.id) {
    return NextResponse.json({ error: 'cannot kick self' }, { status: 400 });
  }
  const { error } = await supabase
    .from('group_members').delete()
    .eq('group_id', groupId).eq('user_id', userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
