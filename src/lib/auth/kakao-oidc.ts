import { createHash, randomBytes } from 'node:crypto';

export const KAKAO_AUTHORIZE_URL = 'https://kauth.kakao.com/oauth/authorize';
export const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token';

export const STATE_COOKIE = 'gm_kakao_state';
export const NONCE_COOKIE = 'gm_kakao_nonce';
export const NEXT_COOKIE = 'gm_kakao_next';
export const FLOW_TTL_SECONDS = 10 * 60; // 10 minutes

export function generateRandomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/**
 * OIDC nonce hashing for Supabase's Kakao provider.
 *
 * Supabase gotrue-server hashes the client-provided `nonce` (from
 * signInWithIdToken) with SHA-256 and hex-encodes it, then compares to the
 * `id_token.nonce` claim. So the id_token must carry the hex hash.
 *
 * Flow:
 * 1. Generate raw nonce, store in HttpOnly cookie
 * 2. Send SHA-256(raw) as hex to Kakao's authorize endpoint
 * 3. Kakao echoes the hex into id_token.nonce
 * 4. Send raw nonce to supabase.auth.signInWithIdToken({ nonce: raw })
 * 5. Supabase hashes → hex → matches id_token.nonce → session created
 */
export function hashNonceHex(rawNonce: string): string {
  return createHash('sha256').update(rawNonce).digest('hex');
}

export function kakaoRedirectUri(origin: string): string {
  return `${origin}/api/auth/kakao/callback`;
}

export function buildKakaoAuthorizeUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  nonce: string;
}): string {
  const url = new URL(KAKAO_AUTHORIZE_URL);
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('response_type', 'code');
  // 요구사항: openid만 사용. account_email/profile_nickname/profile_image 요청 금지.
  url.searchParams.set('scope', 'openid');
  url.searchParams.set('state', params.state);
  url.searchParams.set('nonce', params.nonce);
  return url.toString();
}

type KakaoTokenResponse = {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  refresh_token_expires_in?: number;
  id_token?: string;
};

export async function exchangeKakaoCodeForTokens(params: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<KakaoTokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: params.clientId,
    client_secret: params.clientSecret,
    redirect_uri: params.redirectUri,
    code: params.code,
  });
  const res = await fetch(KAKAO_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`kakao token exchange failed: ${res.status} ${text}`);
  }
  return (await res.json()) as KakaoTokenResponse;
}
