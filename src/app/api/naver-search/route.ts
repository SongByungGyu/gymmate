import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchGyms } from '@/lib/naver';
import { haversineMeters } from '@/lib/utils/distance';

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
    let results = await searchGyms(query);
    if (lat && lng) {
      const userLat = Number(lat), userLng = Number(lng);
      results = results
        .map((p) => ({ ...p, distance: haversineMeters(userLat, userLng, p.lat, p.lng) }))
        .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    }
    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json({ error: 'search failed' }, { status: 500 });
  }
}
