# 짐메이트 (GymMate)

친구끼리 헬스장 출석을 공유하고 주간 목표 달성률을 겨루는 PWA.

- 스펙: [docs/specs/2026-09-02-design.md](docs/specs/2026-09-02-design.md)
- 구현 계획: [docs/plans/2026-09-02-implementation.md](docs/plans/2026-09-02-implementation.md)

## 스택

Next.js 16 · React 19 · Tailwind v4 · Supabase (Auth/Postgres/Storage/RLS) · Naver 지역검색 · Vercel

## 개발

```bash
npm install
cp .env.local.example .env.local  # 값 채우기
npm run dev
```

`.env.local` 에 필요한 값:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
- `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET`
- `NEXT_PUBLIC_SITE_URL` (dev: `http://localhost:3000`)

## 테스트

```bash
npm test
```

거리 계산 / 주간 계산 / KST 날짜 유틸에 대한 단위 테스트.

## 배포

GitHub push → Vercel 자동 빌드/배포. 환경변수는 Vercel 대시보드에서 설정.
