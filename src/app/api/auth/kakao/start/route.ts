import { NextResponse } from 'next/server';
import {
  FLOW_TTL_SECONDS,
  NEXT_COOKIE,
  NONCE_COOKIE,
  STATE_COOKIE,
  buildKakaoAuthorizeUrl,
  generateRandomToken,
  hashNonceHex,
  kakaoRedirectUri,
} from '@/lib/auth/kakao-oidc';
import { safeNextPath } from '@/lib/utils/safe-next';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const clientId = process.env.KAKAO_REST_API_KEY;
  if (!clientId) {
    return NextResponse.json(
      { error: 'KAKAO_REST_API_KEY is not configured' },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  const next = safeNextPath(url.searchParams.get('next'));
  const state = generateRandomToken();
  const rawNonce = generateRandomToken();
  // Send SHA-256(rawNonce) as hex to Kakao. Supabase gotrue-server hashes the
  // client-provided nonce with SHA-256 and hex-encodes before comparing to the
  // id_token.nonce claim. So id_token needs the hex form.
  const hashedNonce = hashNonceHex(rawNonce);

  const authorizeUrl = buildKakaoAuthorizeUrl({
    clientId,
    redirectUri: kakaoRedirectUri(url.origin),
    state,
    nonce: hashedNonce,
  });

  const response = NextResponse.redirect(authorizeUrl, { status: 302 });
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: FLOW_TTL_SECONDS,
  };
  response.cookies.set(STATE_COOKIE, state, cookieOptions);
  response.cookies.set(NONCE_COOKIE, rawNonce, cookieOptions);
  response.cookies.set(NEXT_COOKIE, next, cookieOptions);
  return response;
}
