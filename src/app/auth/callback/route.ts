import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { safeNextPath } from '@/lib/utils/safe-next';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = safeNextPath(url.searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles').select('id').eq('id', user.id).maybeSingle();
        if (!profile) {
          const onboardingUrl = new URL('/onboarding', url.origin);
          if (next !== '/today') onboardingUrl.searchParams.set('next', next);
          return NextResponse.redirect(onboardingUrl);
        }
      }
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }
  return NextResponse.redirect(new URL('/login', url.origin));
}
