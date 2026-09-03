import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  NEXT_COOKIE,
  NONCE_COOKIE,
  STATE_COOKIE,
  exchangeKakaoCodeForTokens,
  kakaoRedirectUri,
} from '@/lib/auth/kakao-oidc';
import { safeNextPath } from '@/lib/utils/safe-next';

export const dynamic = 'force-dynamic';

function redirectToLogin(origin: string, reason: string) {
  const url = new URL('/login', origin);
  url.searchParams.set('kakao_error', reason);
  const response = NextResponse.redirect(url, { status: 302 });
  clearFlowCookies(response);
  return response;
}

function clearFlowCookies(response: NextResponse) {
  const expired = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  };
  response.cookies.set(STATE_COOKIE, '', expired);
  response.cookies.set(NONCE_COOKIE, '', expired);
  response.cookies.set(NEXT_COOKIE, '', expired);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) return redirectToLogin(url.origin, error);
  if (!code || !state) return redirectToLogin(url.origin, 'missing_code_or_state');

  const cookieHeader = request.headers.get('cookie') ?? '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';')
      .map((c) => c.trim())
      .filter(Boolean)
      .map((c) => {
        const eq = c.indexOf('=');
        return eq === -1 ? [c, ''] : [c.slice(0, eq), decodeURIComponent(c.slice(eq + 1))];
      })
  );
  const savedState = cookies[STATE_COOKIE];
  const savedNonce = cookies[NONCE_COOKIE];
  const savedNext = safeNextPath(cookies[NEXT_COOKIE]);

  if (!savedState || savedState !== state) {
    return redirectToLogin(url.origin, 'state_mismatch');
  }
  if (!savedNonce) {
    return redirectToLogin(url.origin, 'missing_nonce');
  }

  const clientId = process.env.KAKAO_REST_API_KEY;
  const clientSecret = process.env.KAKAO_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return redirectToLogin(url.origin, 'kakao_env_missing');
  }

  let idToken: string | undefined;
  try {
    const tokens = await exchangeKakaoCodeForTokens({
      code,
      clientId,
      clientSecret,
      redirectUri: kakaoRedirectUri(url.origin),
    });
    idToken = tokens.id_token;
  } catch {
    return redirectToLogin(url.origin, 'kakao_token_exchange_failed');
  }

  if (!idToken) {
    return redirectToLogin(url.origin, 'no_id_token');
  }

  const supabase = await createClient();
  const { data: signInData, error: signInError } = await supabase.auth.signInWithIdToken({
    provider: 'kakao',
    token: idToken,
    nonce: savedNonce,
  });

  if (signInError || !signInData.user) {
    return redirectToLogin(url.origin, 'supabase_signin_failed');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', signInData.user.id)
    .maybeSingle();

  const destination = new URL(profile ? savedNext : '/onboarding', url.origin);
  if (!profile && savedNext !== '/today') {
    destination.searchParams.set('next', savedNext);
  }

  const response = NextResponse.redirect(destination, { status: 302 });
  clearFlowCookies(response);
  return response;
}
