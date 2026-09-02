import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchGyms } from '@/lib/kakao';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauth' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 });

  try {
    const results = await searchGyms(query, {
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
    });
    return NextResponse.json({ results });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const hasKey = !!process.env.KAKAO_REST_API_KEY;
    const keyLen = process.env.KAKAO_REST_API_KEY?.length ?? 0;
    console.error('[kakao-search]', { msg, hasKey, keyLen });
    return NextResponse.json({ error: 'search failed', detail: msg, hasKey, keyLen }, { status: 500 });
  }
}
