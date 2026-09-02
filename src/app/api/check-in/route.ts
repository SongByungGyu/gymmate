import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { toKstDate } from '@/lib/utils/date';
import { haversineMeters } from '@/lib/utils/distance';

const RADIUS_M = 100;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauth' }, { status: 401 });

  const body = await request.json();
  const { verification_method, lat, lng, memo, photo_path } = body as {
    verification_method: 'gps' | 'photo';
    lat?: number; lng?: number;
    memo?: string;
    photo_path?: string;
  };

  if (verification_method === 'photo' && !photo_path) {
    return NextResponse.json({ error: 'photo required' }, { status: 400 });
  }

  if (verification_method === 'gps') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('gym_lat, gym_lng')
      .eq('id', user.id).single();
    if (!profile?.gym_lat || !profile.gym_lng) {
      return NextResponse.json({ error: 'no gym' }, { status: 400 });
    }
    if (lat == null || lng == null) {
      return NextResponse.json({ error: 'coords required' }, { status: 400 });
    }
    const d = haversineMeters(profile.gym_lat, profile.gym_lng, lat, lng);
    if (d > RADIUS_M) {
      return NextResponse.json({ error: 'too far', distance: d }, { status: 400 });
    }
  }

  const photo_url = photo_path || null;

  const { data, error } = await supabase.from('check_ins').insert({
    user_id: user.id,
    local_date: toKstDate(),
    memo: memo || null,
    photo_url,
    verification_method,
    lat: lat ?? null,
    lng: lng ?? null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ check_in: data });
}
