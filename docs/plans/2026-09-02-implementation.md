# 짐메이트 (GymMate) 구현 계획

> **에이전트 작업자용:** REQUIRED SUB-SKILL — superpowers:subagent-driven-development (권장) 또는 superpowers:executing-plans 로 task-by-task 실행. 각 step은 체크박스(`- [ ]`) 문법.

**Goal:** 짐메이트 PWA(헬스장 출석 공유 웹앱)를 처음부터 배포까지 구축한다.

**Architecture:** Next.js 14 App Router + TypeScript + Tailwind로 만든 PWA. Supabase(Auth/Postgres/Storage/RLS)를 백엔드로, Naver 지역검색 API로 헬스장 검색. Vercel에서 GitHub 자동 배포.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, Supabase JS v2, Naver 지역검색 API, Vitest, next-pwa

**참고 스펙:** `docs/specs/2026-09-02-design.md`

---

## 파일 구조 (완성 시)

```
헬스장출석어플/
├── .env.local                       (gitignored)
├── .env.local.example
├── .gitignore
├── README.md
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── vitest.config.ts
├── postcss.config.js
├── public/
│   ├── manifest.json
│   ├── icon-192.png                 (플레이스홀더)
│   ├── icon-512.png                 (플레이스홀더)
│   └── apple-touch-icon.png
├── supabase/
│   └── migrations/
│       ├── 001_schema.sql
│       ├── 002_rls_policies.sql
│       └── 003_storage.sql
├── src/
│   ├── middleware.ts                (Supabase 세션 리프레시)
│   ├── app/
│   │   ├── layout.tsx               (root layout, PWA meta)
│   │   ├── globals.css
│   │   ├── page.tsx                 (로그인 상태에 따라 /today or /login 리다이렉트)
│   │   ├── login/page.tsx
│   │   ├── auth/callback/route.ts
│   │   ├── onboarding/page.tsx
│   │   ├── (app)/
│   │   │   ├── layout.tsx           (탭 바 포함)
│   │   │   ├── today/page.tsx
│   │   │   ├── calendar/page.tsx
│   │   │   ├── groups/page.tsx
│   │   │   ├── groups/new/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── join/[code]/page.tsx
│   │   └── api/
│   │       ├── naver-search/route.ts
│   │       ├── check-in/route.ts
│   │       ├── groups/route.ts
│   │       ├── groups/[id]/invite-refresh/route.ts
│   │       └── groups/[id]/kick/route.ts
│   ├── components/
│   │   ├── tab-bar.tsx
│   │   ├── check-in-flow.tsx        (client component)
│   │   ├── gym-search.tsx           (client)
│   │   ├── calendar-view.tsx
│   │   └── ui/                      (button, card 등 얇은 wrapper)
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── browser.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   ├── naver.ts
│   │   ├── utils/
│   │   │   ├── distance.ts
│   │   │   ├── week.ts
│   │   │   └── date.ts
│   │   └── types.ts                 (DB row types)
└── tests/
    └── unit/
        ├── distance.test.ts
        ├── week.test.ts
        └── date.test.ts
```

---

# Phase 0 — 외부 서비스 셋업 (사용자 몫)

## Task 1: 외부 계정 & 프로젝트 준비

**이 태스크는 사용자가 수동으로 진행. 완료 후 아래 정보를 손에 쥔 상태여야 다음 태스크 가능.**

**Files:** 없음 (외부 대시보드 작업)

- [ ] **Step 1: GitHub 저장소 생성**

  - `github.com/SongByungGyu` 로그인
  - 새 저장소 `헬스장출석어플` 생성 (Private 권장, README 생성 X)
  - Clone URL 복사해둠

- [ ] **Step 2: Vercel 계정 생성 & GitHub 연결**

  - `vercel.com` GitHub로 로그인
  - "Import Project" 는 나중에 (코드 push 후)

- [ ] **Step 3: Supabase 프로젝트 생성**

  - `supabase.com` 로그인
  - New Project → Name: `gymmate` → Region: **Northeast Asia (Seoul)** → 강한 DB 비밀번호 설정 (저장해둠)
  - 프로젝트 로딩 완료 후 Settings → API 에서 다음 3개 복사:
    - Project URL
    - `anon` public key
    - `service_role` secret key (⚠️ 노출 금지)

- [ ] **Step 4: Naver Developers 앱 등록**

  - `developers.naver.com` 네이버 로그인
  - Application → 애플리케이션 등록
  - 앱 이름: `짐메이트`
  - 사용 API: **검색** 체크
  - 환경: **Web 서비스** 체크
  - 웹 서비스 URL: `http://localhost:3000` (배포 후 vercel URL 추가)
  - 등록 후 앱 상세에서 **Client ID + Client Secret** 확보

- [ ] **Step 5: 확보 완료 체크**

  손에 있어야 할 것:
  - GitHub 저장소 URL
  - Supabase: Project URL, anon key, service_role key
  - Naver: Client ID, Client Secret

---

# Phase 1 — 프로젝트 초기화

## Task 2: Next.js 프로젝트 스캐폴딩

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `postcss.config.js`, `.gitignore`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

- [ ] **Step 1: Next.js 프로젝트 생성**

  프로젝트 루트에서:
  ```bash
  cd "/Users/byunggyusong/1_개발폴더/마스터프로젝트/진짜 개인플젝/헬스장출석어플"
  npx create-next-app@latest . --typescript --tailwind --app --src-dir --use-npm --no-eslint --no-turbopack --import-alias "@/*"
  ```

  질문에 답:
  - Would you like to use ESLint? → No
  - Would you like to use Turbopack? → No

- [ ] **Step 2: 불필요 파일 정리**

  - `src/app/page.tsx` 를 다음으로 대체:
    ```tsx
    export default function Home() {
      return <main className="p-8">GymMate</main>;
    }
    ```
  - `public/next.svg`, `public/vercel.svg` 삭제

- [ ] **Step 3: dev 서버 확인**

  ```bash
  npm run dev
  ```
  브라우저에서 `http://localhost:3000` → "GymMate" 텍스트 나오면 성공. Ctrl+C 종료.

- [ ] **Step 4: git 초기화 & 첫 커밋**

  ```bash
  git init
  git branch -M main
  git add .
  git commit -m "chore: initialize Next.js project"
  git remote add origin https://github.com/SongByungGyu/gymmate.git
  git push -u origin main
  ```

---

## Task 3: 의존성 & 개발 툴 셋업

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`, `.env.local.example`, `.env.local` (gitignored)

- [ ] **Step 1: Runtime 의존성 설치**

  ```bash
  npm install @supabase/supabase-js @supabase/ssr
  ```

- [ ] **Step 2: 개발 의존성 설치**

  ```bash
  npm install -D vitest @vitejs/plugin-react jsdom @types/node
  ```

- [ ] **Step 3: `package.json` scripts에 test 추가**

  ```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest"
  }
  ```

- [ ] **Step 4: `vitest.config.ts` 생성**

  ```ts
  import { defineConfig } from 'vitest/config';
  import path from 'path';

  export default defineConfig({
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    test: {
      environment: 'node',
      include: ['tests/**/*.test.ts'],
    },
  });
  ```

- [ ] **Step 5: `.env.local.example` 생성**

  ```
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  NAVER_CLIENT_ID=
  NAVER_CLIENT_SECRET=
  NEXT_PUBLIC_SITE_URL=http://localhost:3000
  ```

- [ ] **Step 6: `.env.local` 생성 (실제 값 입력)**

  `.env.local.example` 을 복사해서 `.env.local` 로 만들고 Task 1에서 확보한 실제 값 입력:
  ```bash
  cp .env.local.example .env.local
  # 편집기로 열어 값 채우기
  ```

- [ ] **Step 7: `.gitignore` 확인**

  `.env*.local` 이 gitignored 되어있는지 확인 (create-next-app이 기본 넣어줌).

- [ ] **Step 8: 커밋**

  ```bash
  git add package.json package-lock.json vitest.config.ts .env.local.example
  git commit -m "chore: add supabase, testing setup, env template"
  ```

---

## Task 4: Supabase 스키마 마이그레이션

**Files:**
- Create: `supabase/migrations/001_schema.sql`

- [ ] **Step 1: 스키마 SQL 파일 작성**

  `supabase/migrations/001_schema.sql`:
  ```sql
  -- profiles: auth.users 확장
  create table profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    nickname text not null,
    weekly_goal int not null default 3 check (weekly_goal between 1 and 7),
    gym_place_id text,
    gym_name text,
    gym_address text,
    gym_lat double precision,
    gym_lng double precision,
    created_at timestamptz not null default now()
  );

  -- groups
  create table groups (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    invite_code text not null unique,
    created_by uuid not null references profiles(id) on delete cascade,
    created_at timestamptz not null default now()
  );

  -- group_members
  create table group_members (
    group_id uuid not null references groups(id) on delete cascade,
    user_id uuid not null references profiles(id) on delete cascade,
    joined_at timestamptz not null default now(),
    primary key (group_id, user_id)
  );

  -- check_ins
  create table check_ins (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references profiles(id) on delete cascade,
    checked_in_at timestamptz not null default now(),
    local_date date not null,
    memo text,
    photo_url text,
    verification_method text not null check (verification_method in ('gps', 'photo')),
    lat double precision,
    lng double precision
  );

  create index check_ins_user_date_idx on check_ins (user_id, local_date desc);
  create index check_ins_user_time_idx on check_ins (user_id, checked_in_at desc);
  ```

- [ ] **Step 2: Supabase 대시보드에서 실행**

  - Supabase 대시보드 → SQL Editor → 새 쿼리
  - 위 SQL 전부 붙여넣기 → Run
  - Table Editor에서 4개 테이블 확인

- [ ] **Step 3: 커밋**

  ```bash
  git add supabase/migrations/001_schema.sql
  git commit -m "feat: initial database schema"
  ```

---

## Task 5: RLS 정책 설정

**Files:**
- Create: `supabase/migrations/002_rls_policies.sql`

- [ ] **Step 1: RLS SQL 파일 작성**

  `supabase/migrations/002_rls_policies.sql`:
  ```sql
  -- 헬퍼: 두 사용자가 같은 그룹에 소속되어 있는가?
  create or replace function public.share_group(a uuid, b uuid)
  returns boolean language sql stable as $$
    select exists(
      select 1
      from group_members m1
      join group_members m2 on m1.group_id = m2.group_id
      where m1.user_id = a and m2.user_id = b
    );
  $$;

  -- profiles
  alter table profiles enable row level security;

  create policy "profiles: self select" on profiles
    for select using (id = auth.uid());
  create policy "profiles: group-mates select" on profiles
    for select using (public.share_group(id, auth.uid()));
  create policy "profiles: self insert" on profiles
    for insert with check (id = auth.uid());
  create policy "profiles: self update" on profiles
    for update using (id = auth.uid());

  -- groups
  alter table groups enable row level security;

  create policy "groups: members select" on groups
    for select using (
      exists(select 1 from group_members m where m.group_id = id and m.user_id = auth.uid())
    );
  create policy "groups: anyone with code select" on groups
    for select using (true);  -- 초대 링크 접속 시 필요. name/code만 노출됨.
  create policy "groups: anyone create" on groups
    for insert with check (created_by = auth.uid());
  create policy "groups: creator update" on groups
    for update using (created_by = auth.uid());
  create policy "groups: creator delete" on groups
    for delete using (created_by = auth.uid());

  -- group_members
  alter table group_members enable row level security;

  create policy "gm: members select" on group_members
    for select using (
      exists(select 1 from group_members m
             where m.group_id = group_members.group_id and m.user_id = auth.uid())
    );
  create policy "gm: self insert" on group_members
    for insert with check (user_id = auth.uid());
  create policy "gm: self delete" on group_members
    for delete using (user_id = auth.uid());
  create policy "gm: creator kick" on group_members
    for delete using (
      exists(select 1 from groups g where g.id = group_id and g.created_by = auth.uid())
    );

  -- check_ins
  alter table check_ins enable row level security;

  create policy "ci: self all" on check_ins
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  create policy "ci: group-mates select" on check_ins
    for select using (public.share_group(user_id, auth.uid()));
  ```

- [ ] **Step 2: Supabase 대시보드에서 실행**

  SQL Editor에 붙여넣고 Run. 에러 없이 성공하는지 확인.

- [ ] **Step 3: 커밋**

  ```bash
  git add supabase/migrations/002_rls_policies.sql
  git commit -m "feat: RLS policies for all tables"
  ```

---

## Task 6: Storage 버킷 & 사진 정책

**Files:**
- Create: `supabase/migrations/003_storage.sql`

- [ ] **Step 1: Storage 버킷 생성 (대시보드)**

  - Supabase 대시보드 → Storage → New Bucket
  - Name: `check-in-photos`
  - Public bucket: **OFF** (private)

- [ ] **Step 2: 파일 경로 규약 정하기**

  체크인 사진 경로: `{user_id}/{check_in_id}.jpg`

- [ ] **Step 3: Storage RLS SQL 작성**

  `supabase/migrations/003_storage.sql`:
  ```sql
  -- 업로드: 본인 폴더에만
  create policy "photos: self upload" on storage.objects
    for insert to authenticated
    with check (
      bucket_id = 'check-in-photos'
      and (storage.foldername(name))[1] = auth.uid()::text
    );

  -- 조회: 같은 그룹 멤버 + 본인
  create policy "photos: group-mates select" on storage.objects
    for select to authenticated
    using (
      bucket_id = 'check-in-photos'
      and (
        (storage.foldername(name))[1] = auth.uid()::text
        or public.share_group(
          ((storage.foldername(name))[1])::uuid,
          auth.uid()
        )
      )
    );

  -- 삭제: 본인만
  create policy "photos: self delete" on storage.objects
    for delete to authenticated
    using (
      bucket_id = 'check-in-photos'
      and (storage.foldername(name))[1] = auth.uid()::text
    );
  ```

- [ ] **Step 4: 대시보드에서 실행**

  SQL Editor에 붙여넣고 Run.

- [ ] **Step 5: 커밋**

  ```bash
  git add supabase/migrations/003_storage.sql
  git commit -m "feat: storage bucket policies for check-in photos"
  ```

---

# Phase 2 — 인프라 & 유틸

## Task 7: Supabase 클라이언트 3종

**Files:**
- Create: `src/lib/supabase/browser.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`, `src/middleware.ts`, `src/lib/types.ts`

- [ ] **Step 1: DB 타입 정의**

  `src/lib/types.ts`:
  ```ts
  export type Profile = {
    id: string;
    nickname: string;
    weekly_goal: number;
    gym_place_id: string | null;
    gym_name: string | null;
    gym_address: string | null;
    gym_lat: number | null;
    gym_lng: number | null;
    created_at: string;
  };

  export type Group = {
    id: string;
    name: string;
    invite_code: string;
    created_by: string;
    created_at: string;
  };

  export type GroupMember = {
    group_id: string;
    user_id: string;
    joined_at: string;
  };

  export type CheckIn = {
    id: string;
    user_id: string;
    checked_in_at: string;
    local_date: string;
    memo: string | null;
    photo_url: string | null;
    verification_method: 'gps' | 'photo';
    lat: number | null;
    lng: number | null;
  };
  ```

- [ ] **Step 2: 브라우저 클라이언트**

  `src/lib/supabase/browser.ts`:
  ```ts
  import { createBrowserClient } from '@supabase/ssr';

  export function createClient() {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  ```

- [ ] **Step 3: 서버 클라이언트**

  `src/lib/supabase/server.ts`:
  ```ts
  import { createServerClient } from '@supabase/ssr';
  import { cookies } from 'next/headers';

  export async function createClient() {
    const cookieStore = await cookies();
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (all) => {
            try {
              all.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Server Component에서 호출 시 무시
            }
          },
        },
      }
    );
  }
  ```

- [ ] **Step 4: 미들웨어 클라이언트**

  `src/lib/supabase/middleware.ts`:
  ```ts
  import { createServerClient } from '@supabase/ssr';
  import { NextResponse, type NextRequest } from 'next/server';

  export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (all) => {
            all.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            all.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;
    const isPublic =
      path === '/' ||
      path.startsWith('/login') ||
      path.startsWith('/auth') ||
      path.startsWith('/join');

    if (!user && !isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    return response;
  }
  ```

- [ ] **Step 5: `src/middleware.ts` 진입점**

  ```ts
  import { updateSession } from '@/lib/supabase/middleware';
  import type { NextRequest } from 'next/server';

  export async function middleware(request: NextRequest) {
    return updateSession(request);
  }

  export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp)$).*)'],
  };
  ```

- [ ] **Step 6: 커밋**

  ```bash
  git add src/lib/supabase src/middleware.ts src/lib/types.ts
  git commit -m "feat: supabase clients + auth middleware"
  ```

---

## Task 8: 유틸 함수 3종 + 단위 테스트 (TDD)

**Files:**
- Create: `src/lib/utils/distance.ts`, `src/lib/utils/week.ts`, `src/lib/utils/date.ts`
- Create: `tests/unit/distance.test.ts`, `tests/unit/week.test.ts`, `tests/unit/date.test.ts`

- [ ] **Step 1: distance 테스트 작성**

  `tests/unit/distance.test.ts`:
  ```ts
  import { describe, it, expect } from 'vitest';
  import { haversineMeters } from '@/lib/utils/distance';

  describe('haversineMeters', () => {
    it('returns 0 for same point', () => {
      expect(haversineMeters(37.5, 127.0, 37.5, 127.0)).toBe(0);
    });

    it('returns ~111km for 1 degree of latitude', () => {
      const d = haversineMeters(37.0, 127.0, 38.0, 127.0);
      expect(d).toBeGreaterThan(110_000);
      expect(d).toBeLessThan(112_000);
    });

    it('returns <100m for nearby points', () => {
      // 강남역 ~ 강남역 50m 북쪽
      const d = haversineMeters(37.4979, 127.0276, 37.4984, 127.0276);
      expect(d).toBeLessThan(100);
      expect(d).toBeGreaterThan(30);
    });
  });
  ```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

  ```bash
  npm test
  ```
  Expected: FAIL, `haversineMeters` not found.

- [ ] **Step 3: distance 구현**

  `src/lib/utils/distance.ts`:
  ```ts
  export function haversineMeters(
    lat1: number, lng1: number,
    lat2: number, lng2: number
  ): number {
    const R = 6_371_000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }
  ```

- [ ] **Step 4: 테스트 통과 확인**

  ```bash
  npm test
  ```
  Expected: PASS.

- [ ] **Step 5: week 테스트 작성**

  `tests/unit/week.test.ts`:
  ```ts
  import { describe, it, expect } from 'vitest';
  import { getWeekRangeKST } from '@/lib/utils/week';

  describe('getWeekRangeKST', () => {
    it('returns Mon-Sun range for a Wednesday', () => {
      // 2026-09-02 (수)
      const { start, end } = getWeekRangeKST(new Date('2026-09-02T12:00:00+09:00'));
      expect(start).toBe('2026-08-31'); // 월
      expect(end).toBe('2026-09-06');   // 일
    });

    it('returns same week for a Sunday (last day)', () => {
      const { start, end } = getWeekRangeKST(new Date('2026-09-06T23:00:00+09:00'));
      expect(start).toBe('2026-08-31');
      expect(end).toBe('2026-09-06');
    });

    it('returns next week for a Monday (first day)', () => {
      const { start, end } = getWeekRangeKST(new Date('2026-09-07T00:30:00+09:00'));
      expect(start).toBe('2026-09-07');
      expect(end).toBe('2026-09-13');
    });
  });
  ```

- [ ] **Step 6: week 구현**

  `src/lib/utils/week.ts`:
  ```ts
  // KST 기준 월요일~일요일 범위 (YYYY-MM-DD)
  export function getWeekRangeKST(now: Date = new Date()): { start: string; end: string } {
    // KST = UTC+9
    const kstMs = now.getTime() + 9 * 60 * 60 * 1000;
    const kst = new Date(kstMs);
    const day = kst.getUTCDay(); // 0(일)~6(토)
    const daysFromMonday = (day + 6) % 7; // 월=0, ..., 일=6
    const monday = new Date(kst.getTime() - daysFromMonday * 24 * 60 * 60 * 1000);
    const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
    const fmt = (d: Date) =>
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    return { start: fmt(monday), end: fmt(sunday) };
  }
  ```

- [ ] **Step 7: 테스트 통과 확인**

  ```bash
  npm test
  ```
  Expected: PASS all.

- [ ] **Step 8: date 테스트 작성**

  `tests/unit/date.test.ts`:
  ```ts
  import { describe, it, expect } from 'vitest';
  import { toKstDate } from '@/lib/utils/date';

  describe('toKstDate', () => {
    it('returns KST date for UTC 15:00 (midnight KST)', () => {
      expect(toKstDate(new Date('2026-09-01T15:00:00Z'))).toBe('2026-09-02');
    });

    it('returns previous day for UTC 14:59', () => {
      expect(toKstDate(new Date('2026-09-01T14:59:00Z'))).toBe('2026-09-01');
    });
  });
  ```

- [ ] **Step 9: date 구현**

  `src/lib/utils/date.ts`:
  ```ts
  // 주어진 시각을 KST 기준 로컬 날짜(YYYY-MM-DD)로 변환
  export function toKstDate(d: Date = new Date()): string {
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    return `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, '0')}-${String(kst.getUTCDate()).padStart(2, '0')}`;
  }
  ```

- [ ] **Step 10: 전체 테스트 통과**

  ```bash
  npm test
  ```
  Expected: 8 passing tests.

- [ ] **Step 11: 커밋**

  ```bash
  git add src/lib/utils tests/unit
  git commit -m "feat: distance/week/date utils with tests"
  ```

---

# Phase 3 — 인증

## Task 9: 매직링크 로그인

**Files:**
- Create: `src/app/login/page.tsx`, `src/app/auth/callback/route.ts`

- [ ] **Step 1: 로그인 페이지 작성**

  `src/app/login/page.tsx`:
  ```tsx
  'use client';
  import { useState } from 'react';
  import { createClient } from '@/lib/supabase/browser';

  export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function send(e: React.FormEvent) {
      e.preventDefault();
      setError(null);
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) setError(error.message);
      else setSent(true);
    }

    return (
      <main className="min-h-screen p-8 flex flex-col justify-center max-w-sm mx-auto">
        <h1 className="text-2xl font-bold mb-6">짐메이트</h1>
        {sent ? (
          <p>이메일로 링크를 보냈어요. 메일함을 확인하세요.</p>
        ) : (
          <form onSubmit={send} className="space-y-4">
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일" autoComplete="email"
              className="w-full border rounded px-4 py-3"
            />
            <button type="submit" className="w-full bg-black text-white rounded px-4 py-3">
              로그인 링크 받기
            </button>
            {error && <p className="text-red-600 text-sm">{error}</p>}
          </form>
        )}
      </main>
    );
  }
  ```

- [ ] **Step 2: 콜백 라우트 작성**

  `src/app/auth/callback/route.ts`:
  ```ts
  import { createClient } from '@/lib/supabase/server';
  import { NextResponse } from 'next/server';

  export async function GET(request: Request) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const next = url.searchParams.get('next') ?? '/today';

    if (code) {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        // 프로필이 없으면 온보딩으로
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles').select('id').eq('id', user.id).maybeSingle();
          if (!profile) return NextResponse.redirect(new URL('/onboarding', url.origin));
        }
        return NextResponse.redirect(new URL(next, url.origin));
      }
    }
    return NextResponse.redirect(new URL('/login', url.origin));
  }
  ```

- [ ] **Step 3: 루트 페이지 리다이렉트 로직**

  `src/app/page.tsx`:
  ```tsx
  import { createClient } from '@/lib/supabase/server';
  import { redirect } from 'next/navigation';

  export default async function Home() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect('/today');
    redirect('/login');
  }
  ```

- [ ] **Step 4: 수동 테스트**

  - `npm run dev`
  - `http://localhost:3000` 접속 → `/login` 리다이렉트
  - 본인 이메일 입력 → "이메일로 링크를 보냈어요" 확인
  - 메일함 → 링크 클릭 → 온보딩으로 이동 (아직 페이지 없음, 404 정상)

- [ ] **Step 5: 커밋**

  ```bash
  git add src/app/login src/app/auth src/app/page.tsx
  git commit -m "feat: magic link login + auth callback"
  ```

---

# Phase 4 — 온보딩

## Task 10: Naver 지역검색 API 프록시

**Files:**
- Create: `src/lib/naver.ts`, `src/app/api/naver-search/route.ts`, `src/lib/utils/tm128.ts`

**참고:** Naver 지역검색 v1은 좌표를 **KATECH(TM128)** 로 반환. WGS84(lat/lng)로 변환 필요. 변환 공식은 100m 이내 오차 가능 — 실사용 시 사용자가 여러 후보 중 선택하므로 실질적 문제 없음.

- [ ] **Step 1: TM128 → WGS84 변환 유틸**

  `src/lib/utils/tm128.ts`:
  ```ts
  export function tm128ToWgs84(mapx: number, mapy: number): { lat: number; lng: number } {
    const RE = 6378137.0;
    const GRID = 5.0;
    const SLAT1 = 30.0;
    const SLAT2 = 60.0;
    const OLON = 128.0;
    const OLAT = 38.0;
    const XO = 43;
    const YO = 136;

    const DEGRAD = Math.PI / 180.0;
    const RADDEG = 180.0 / Math.PI;

    const re = RE / GRID;
    const slat1 = SLAT1 * DEGRAD;
    const slat2 = SLAT2 * DEGRAD;
    const olon = OLON * DEGRAD;
    const olat = OLAT * DEGRAD;

    let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
    let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
    let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
    ro = (re * sf) / Math.pow(ro, sn);

    const x = mapx / 10 - XO;
    const y = ro - (mapy / 10 - YO);
    const ra = Math.sqrt(x * x + y * y);
    const alat = 2 * Math.atan(Math.pow((re * sf) / (sn > 0 ? ra : -ra), 1 / sn)) - Math.PI * 0.5;
    let theta: number;
    if (Math.abs(x) <= 0) theta = 0;
    else if (Math.abs(y) <= 0) theta = Math.PI * 0.5 * (x < 0 ? -1 : 1);
    else theta = Math.atan2(x, y);
    const alon = theta / sn + olon;

    return { lat: alat * RADDEG, lng: alon * RADDEG };
  }
  ```

- [ ] **Step 2: Naver 검색 헬퍼**

  `src/lib/naver.ts`:
  ```ts
  import { tm128ToWgs84 } from './utils/tm128';

  export type Place = {
    id: string;
    place_name: string;
    address: string;
    road_address: string;
    lat: number;
    lng: number;
    distance?: number;
  };

  type NaverItem = {
    title: string;
    address: string;
    roadAddress: string;
    mapx: string;
    mapy: string;
  };

  function stripHtml(s: string): string {
    return s.replace(/<[^>]+>/g, '');
  }

  export async function searchGyms(query: string): Promise<Place[]> {
    const params = new URLSearchParams({
      query: `${query} 헬스장`,
      display: '5',
      start: '1',
      sort: 'random',
    });
    const res = await fetch(
      `https://openapi.naver.com/v1/search/local.json?${params}`,
      {
        headers: {
          'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID!,
          'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET!,
        },
        cache: 'no-store',
      }
    );
    if (!res.ok) throw new Error(`Naver API ${res.status}`);
    const data = await res.json();
    const items = (data.items ?? []) as NaverItem[];
    return items.map((it) => {
      const name = stripHtml(it.title);
      const { lat, lng } = tm128ToWgs84(Number(it.mapx), Number(it.mapy));
      return {
        id: `${name}|${it.address}`,
        place_name: name,
        address: it.address,
        road_address: it.roadAddress,
        lat, lng,
      };
    });
  }
  ```

- [ ] **Step 3: 프록시 라우트**

  `src/app/api/naver-search/route.ts`:
  ```ts
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
  ```

- [ ] **Step 4: 커밋**

  ```bash
  git add src/lib/naver.ts src/lib/utils/tm128.ts src/app/api/naver-search
  git commit -m "feat: naver local search proxy with tm128 conversion"
  ```

---

## Task 11: 온보딩 페이지

**Files:**
- Create: `src/app/onboarding/page.tsx`, `src/components/gym-search.tsx`

- [ ] **Step 1: 헬스장 검색 컴포넌트**

  `src/components/gym-search.tsx`:
  ```tsx
  'use client';
  import { useState } from 'react';
  import type { Place } from '@/lib/naver';

  type Props = { onSelect: (place: Place) => void };

  export function GymSearch({ onSelect }: Props) {
    const [q, setQ] = useState('');
    const [results, setResults] = useState<Place[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function search() {
      if (!q.trim()) return;
      setLoading(true);
      setError(null);
      try {
        const coords = await new Promise<GeolocationPosition | null>((resolve) => {
          if (!navigator.geolocation) return resolve(null);
          navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { timeout: 3000 });
        });
        const params = new URLSearchParams({ q });
        if (coords) {
          params.set('lat', String(coords.coords.latitude));
          params.set('lng', String(coords.coords.longitude));
        }
        const res = await fetch(`/api/naver-search?${params}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setResults(data.results);
      } catch {
        setError('검색 실패. 잠시 후 다시 시도해주세요.');
      } finally {
        setLoading(false);
      }
    }

    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="헬스장 이름 (예: 스포애니 강남)"
            className="flex-1 border rounded px-3 py-2"
          />
          <button onClick={search} disabled={loading} className="bg-black text-white rounded px-4">
            {loading ? '...' : '검색'}
          </button>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <ul className="space-y-2">
          {results.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => onSelect(p)}
                className="w-full text-left border rounded p-3 hover:bg-gray-50"
              >
                <div className="font-medium">{p.place_name}</div>
                <div className="text-sm text-gray-600">
                  {p.road_address || p.address}
                </div>
                {p.distance != null && (
                  <div className="text-xs text-gray-500">{Math.round(p.distance)}m</div>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  ```

- [ ] **Step 2: 온보딩 페이지**

  `src/app/onboarding/page.tsx`:
  ```tsx
  'use client';
  import { useState } from 'react';
  import { useRouter } from 'next/navigation';
  import { createClient } from '@/lib/supabase/browser';
  import { GymSearch } from '@/components/gym-search';
  import type { Place } from '@/lib/naver';

  export default function Onboarding() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [nickname, setNickname] = useState('');
    const [gym, setGym] = useState<Place | null>(null);
    const [goal, setGoal] = useState(3);
    const [saving, setSaving] = useState(false);

    async function save() {
      if (!gym) return;
      setSaving(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const { error } = await supabase.from('profiles').insert({
        id: user.id,
        nickname,
        weekly_goal: goal,
        gym_place_id: gym.id,
        gym_name: gym.place_name,
        gym_address: gym.road_address || gym.address,
        gym_lat: gym.lat,
        gym_lng: gym.lng,
      });
      if (error) {
        alert('저장 실패: ' + error.message);
        setSaving(false);
      } else {
        router.push('/today');
      }
    }

    return (
      <main className="min-h-screen p-6 max-w-md mx-auto">
        {step === 1 && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold">닉네임을 정해주세요</h1>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임"
              className="w-full border rounded px-4 py-3"
            />
            <button
              disabled={!nickname.trim()}
              onClick={() => setStep(2)}
              className="w-full bg-black text-white rounded py-3 disabled:bg-gray-300"
            >다음</button>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold">다니는 헬스장을 선택해주세요</h1>
            <GymSearch onSelect={(p) => { setGym(p); setStep(3); }} />
          </div>
        )}
        {step === 3 && gym && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold">주간 목표를 정해주세요</h1>
            <p className="text-sm text-gray-600">선택한 헬스장: {gym.place_name}</p>
            <div className="grid grid-cols-3 gap-2">
              {[2, 3, 4, 5, 6, 7].map((n) => (
                <button
                  key={n}
                  onClick={() => setGoal(n)}
                  className={`py-3 border rounded ${goal === n ? 'bg-black text-white' : ''}`}
                >주 {n}회</button>
              ))}
            </div>
            <button
              disabled={saving}
              onClick={save}
              className="w-full bg-black text-white rounded py-3 disabled:bg-gray-400"
            >{saving ? '저장중...' : '시작하기'}</button>
          </div>
        )}
      </main>
    );
  }
  ```

- [ ] **Step 3: 수동 테스트**

  - 로그인 → 콜백 → 온보딩 진입
  - 닉네임 입력 → 헬스장 검색 → 선택 → 목표 → 시작하기
  - Supabase Table Editor에서 `profiles` 행 생성 확인
  - 404 페이지(`/today`) 뜨는 것 정상 (다음 태스크에서 만듦)

- [ ] **Step 4: 커밋**

  ```bash
  git add src/app/onboarding src/components/gym-search.tsx
  git commit -m "feat: onboarding flow (nickname/gym/goal)"
  ```

---

# Phase 5 — 탭 레이아웃 & PWA

## Task 12: 탭 바 + 탭 페이지 shell + PWA 매니페스트

**Files:**
- Create: `src/app/(app)/layout.tsx`, `src/components/tab-bar.tsx`, `src/app/(app)/today/page.tsx`, `src/app/(app)/calendar/page.tsx`, `src/app/(app)/groups/page.tsx`, `src/app/(app)/settings/page.tsx`, `public/manifest.json`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: 탭 바 컴포넌트**

  `src/components/tab-bar.tsx`:
  ```tsx
  'use client';
  import Link from 'next/link';
  import { usePathname } from 'next/navigation';

  const tabs = [
    { href: '/today', label: '오늘' },
    { href: '/calendar', label: '캘린더' },
    { href: '/groups', label: '그룹' },
    { href: '/settings', label: '설정' },
  ];

  export function TabBar() {
    const pathname = usePathname();
    return (
      <nav className="fixed bottom-0 inset-x-0 border-t bg-white flex">
        {tabs.map((t) => {
          const active = pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex-1 py-3 text-center text-sm ${active ? 'font-bold' : 'text-gray-500'}`}
            >{t.label}</Link>
          );
        })}
      </nav>
    );
  }
  ```

- [ ] **Step 2: 앱 레이아웃 (탭 바 포함)**

  `src/app/(app)/layout.tsx`:
  ```tsx
  import { TabBar } from '@/components/tab-bar';

  export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
      <div className="min-h-screen pb-16">
        {children}
        <TabBar />
      </div>
    );
  }
  ```

- [ ] **Step 3: 4개 shell 페이지**

  `src/app/(app)/today/page.tsx`:
  ```tsx
  export default function Today() {
    return <main className="p-6"><h1 className="text-xl font-bold">오늘</h1></main>;
  }
  ```

  `src/app/(app)/calendar/page.tsx`, `src/app/(app)/groups/page.tsx`, `src/app/(app)/settings/page.tsx` 도 동일 패턴으로 각 h1 텍스트만 다르게.

- [ ] **Step 4: PWA 매니페스트**

  `public/manifest.json`:
  ```json
  {
    "name": "짐메이트",
    "short_name": "짐메이트",
    "start_url": "/today",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#000000",
    "icons": [
      { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
      { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
    ]
  }
  ```

- [ ] **Step 5: 임시 아이콘**

  `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png` 로 검은 배경에 흰색 "GM" 텍스트 png 3장 만들어 넣기 (Figma나 [https://placeholder.co](https://placeholder.co) 로 임시).

- [ ] **Step 6: `src/app/layout.tsx`에 메타 추가**

  ```tsx
  export const metadata = {
    title: '짐메이트',
    description: '헬스장 출석 공유',
    manifest: '/manifest.json',
    appleWebApp: { capable: true, statusBarStyle: 'default', title: '짐메이트' },
  };

  export const viewport = {
    themeColor: '#000000',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  };
  ```

- [ ] **Step 7: 수동 테스트**

  - `/today` 접속 → 하단 4개 탭 노출, 탭 이동 잘 됨
  - Safari에서 "홈화면에 추가" 되는지 확인 (아이콘 노출)

- [ ] **Step 8: 커밋**

  ```bash
  git add src/app/\(app\) src/components/tab-bar.tsx public/manifest.json public/icon-*.png public/apple-touch-icon.png src/app/layout.tsx
  git commit -m "feat: tab bar layout + PWA manifest"
  ```

---

# Phase 6 — 오늘 탭 (체크인)

## Task 13: 체크인 API

**Files:**
- Create: `src/app/api/check-in/route.ts`

- [ ] **Step 1: API 라우트**

  `src/app/api/check-in/route.ts`:
  ```ts
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

    // GPS 검증
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

    const photo_url = photo_path
      ? supabase.storage.from('check-in-photos').getPublicUrl(photo_path).data.publicUrl
      : null;

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
  ```

- [ ] **Step 2: 커밋**

  ```bash
  git add src/app/api/check-in
  git commit -m "feat: check-in API with GPS validation"
  ```

---

## Task 14: 체크인 흐름 UI

**Files:**
- Create: `src/components/check-in-flow.tsx`

- [ ] **Step 1: 체크인 흐름 컴포넌트**

  `src/components/check-in-flow.tsx`:
  ```tsx
  'use client';
  import { useState, useRef } from 'react';
  import { createClient } from '@/lib/supabase/browser';

  type Mode = 'idle' | 'gps' | 'photo-required' | 'saving' | 'done' | 'error';

  export function CheckInFlow({ onDone }: { onDone: () => void }) {
    const [mode, setMode] = useState<Mode>('idle');
    const [msg, setMsg] = useState('');
    const [memo, setMemo] = useState('');
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    async function start() {
      setMode('gps');
      setMsg('위치 확인 중...');
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) return reject(new Error('no geo'));
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, enableHighAccuracy: true });
        });
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        await submit('gps', pos.coords.latitude, pos.coords.longitude);
      } catch {
        setMode('photo-required');
        setMsg('위치 확인 실패. 사진으로 인증할까요?');
      }
    }

    async function submit(method: 'gps' | 'photo', lat?: number, lng?: number, photoPath?: string) {
      setMode('saving');
      const res = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verification_method: method,
          lat, lng,
          memo: memo || undefined,
          photo_path: photoPath,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'too far') {
          setMode('photo-required');
          setMsg(`헬스장에서 ${Math.round(data.distance)}m 떨어져 있어요. 사진으로 인증할까요?`);
        } else {
          setMode('error');
          setMsg('체크인 실패: ' + (data.error || '알 수 없음'));
        }
        return;
      }
      setMode('done');
      setTimeout(onDone, 1500);
    }

    async function submitPhoto() {
      const file = fileRef.current?.files?.[0];
      if (!file) return;
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const path = `${user.id}/${crypto.randomUUID()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from('check-in-photos').upload(path, file, { contentType: file.type });
      if (upErr) {
        setMode('error');
        setMsg('사진 업로드 실패: ' + upErr.message);
        return;
      }
      await submit('photo', undefined, undefined, path);
    }

    return (
      <div className="space-y-4">
        {mode === 'idle' && (
          <button onClick={start} className="w-full bg-black text-white rounded py-6 text-lg font-bold">
            오늘 헬스 감
          </button>
        )}
        {(mode === 'gps' || mode === 'saving') && <p>{msg || '저장중...'}</p>}
        {mode === 'photo-required' && (
          <div className="space-y-3">
            <p>{msg}</p>
            <input
              ref={fileRef} type="file" accept="image/*" capture="environment"
              onChange={submitPhoto}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full bg-black text-white rounded py-4"
            >카메라로 인증</button>
          </div>
        )}
        {mode === 'done' && <p className="text-green-600 font-bold">체크인 완료!</p>}
        {mode === 'error' && (
          <>
            <p className="text-red-600">{msg}</p>
            <button onClick={() => setMode('idle')} className="underline">다시 시도</button>
          </>
        )}
        {(mode === 'idle' || mode === 'photo-required') && (
          <input
            value={memo} onChange={(e) => setMemo(e.target.value)}
            placeholder="오늘 뭐 했나요? (선택)"
            className="w-full border rounded px-3 py-2"
          />
        )}
      </div>
    );
  }
  ```

- [ ] **Step 2: 커밋**

  ```bash
  git add src/components/check-in-flow.tsx
  git commit -m "feat: check-in flow with GPS + photo fallback"
  ```

---

## Task 15: 오늘 탭 완성

**Files:**
- Modify: `src/app/(app)/today/page.tsx`

- [ ] **Step 1: 오늘 탭 서버 컴포넌트 + 진행률**

  `src/app/(app)/today/page.tsx`:
  ```tsx
  import { createClient } from '@/lib/supabase/server';
  import { getWeekRangeKST } from '@/lib/utils/week';
  import { toKstDate } from '@/lib/utils/date';
  import { CheckInFlow } from '@/components/check-in-flow';
  import { revalidatePath } from 'next/cache';

  export default async function Today() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles').select('nickname, weekly_goal').eq('id', user.id).single();

    const { start, end } = getWeekRangeKST();
    const { data: weekCheckins } = await supabase
      .from('check_ins').select('local_date')
      .eq('user_id', user.id).gte('local_date', start).lte('local_date', end);
    const distinctDays = new Set((weekCheckins ?? []).map((c) => c.local_date)).size;
    const goal = profile?.weekly_goal ?? 3;

    const today = toKstDate();
    const { data: todayCheckins } = await supabase
      .from('check_ins').select('id, checked_in_at, memo, photo_url, verification_method')
      .eq('user_id', user.id).eq('local_date', today)
      .order('checked_in_at', { ascending: false });

    async function refresh() {
      'use server';
      revalidatePath('/today');
    }

    return (
      <main className="p-6 space-y-6">
        <h1 className="text-xl font-bold">안녕하세요, {profile?.nickname}님</h1>

        <section>
          <p className="text-sm text-gray-600 mb-2">이번주 진행률</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-black"
                style={{ width: `${Math.min(100, (distinctDays / goal) * 100)}%` }}
              />
            </div>
            <span className="text-sm">{distinctDays} / {goal}일</span>
          </div>
        </section>

        <section>
          <CheckInFlowClient onDone={refresh} />
        </section>

        <section>
          <h2 className="font-bold mb-2">오늘 기록</h2>
          {todayCheckins && todayCheckins.length > 0 ? (
            <ul className="space-y-2">
              {todayCheckins.map((c) => (
                <li key={c.id} className="border rounded p-3">
                  <div className="text-xs text-gray-500">
                    {new Date(c.checked_in_at).toLocaleTimeString('ko-KR')} ·
                    {c.verification_method === 'gps' ? ' 📍 GPS' : ' 📷 사진'}
                  </div>
                  {c.memo && <p className="mt-1">{c.memo}</p>}
                  {c.photo_url && <img src={c.photo_url} alt="" className="mt-2 rounded max-w-xs" />}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">아직 오늘 기록이 없어요.</p>
          )}
        </section>
      </main>
    );
  }

  // CheckInFlow는 클라이언트, 서버 액션을 prop으로 못 넘겨서 얇은 wrapper 필요
  function CheckInFlowClient({ onDone }: { onDone: () => void }) {
    return <CheckInFlow onDone={onDone} />;
  }
  ```

  ⚠️ 위 wrapper 방식이 서버 액션 prop 이슈에 걸릴 수 있음. 대안: `CheckInFlow` 내부에서 `router.refresh()` 호출.

- [ ] **Step 2: `check-in-flow.tsx` 를 `router.refresh` 방식으로 수정**

  `src/components/check-in-flow.tsx` 상단 import 추가:
  ```tsx
  import { useRouter } from 'next/navigation';
  ```
  컴포넌트 내부:
  ```tsx
  const router = useRouter();
  ```
  `onDone` prop 제거하고 완료 시 `router.refresh()` 호출. Today 페이지에서 `<CheckInFlow />` 만 렌더.

- [ ] **Step 3: `today/page.tsx` 단순화**

  `refresh` 서버 액션 삭제, `CheckInFlowClient` 삭제, 그냥 `<CheckInFlow />` 사용.

- [ ] **Step 4: 수동 테스트**

  - 오늘 탭 → "오늘 헬스 감" 탭
  - 위치 권한 팝업 → 허용 (헬스장에서 안 하면 100m 밖일 것)
  - 사진 인증 화면 → 카메라 열림 확인
  - 촬영 → 업로드 → 완료
  - 진행률 1/3 표시, 오늘 기록에 추가됨

- [ ] **Step 5: 커밋**

  ```bash
  git add src/app/\(app\)/today/page.tsx src/components/check-in-flow.tsx
  git commit -m "feat: today tab with progress and check-in history"
  ```

---

# Phase 7 — 캘린더 탭

## Task 16: 월별 캘린더 뷰

**Files:**
- Create: `src/components/calendar-view.tsx`
- Modify: `src/app/(app)/calendar/page.tsx`

- [ ] **Step 1: 캘린더 뷰 컴포넌트 (client)**

  `src/components/calendar-view.tsx`:
  ```tsx
  'use client';
  import { useState } from 'react';

  type Props = {
    checkedDates: string[]; // YYYY-MM-DD 배열
    onSelect: (date: string) => void;
    initialMonth?: Date;
  };

  export function CalendarView({ checkedDates, onSelect, initialMonth = new Date() }: Props) {
    const [month, setMonth] = useState(new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1));
    const checkedSet = new Set(checkedDates);

    const year = month.getFullYear();
    const m = month.getMonth();
    const first = new Date(year, m, 1);
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const startWeekday = (first.getDay() + 6) % 7; // 월=0

    const cells: (number | null)[] = [
      ...Array(startWeekday).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    const fmt = (d: number) =>
      `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setMonth(new Date(year, m - 1, 1))}>‹</button>
          <div className="font-bold">{year}.{String(m + 1).padStart(2, '0')}</div>
          <button onClick={() => setMonth(new Date(year, m + 1, 1))}>›</button>
        </div>
        <div className="grid grid-cols-7 text-center text-xs text-gray-500 mb-1">
          {['월', '화', '수', '목', '금', '토', '일'].map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />;
            const date = fmt(day);
            const checked = checkedSet.has(date);
            return (
              <button
                key={i}
                onClick={() => onSelect(date)}
                className={`aspect-square rounded flex flex-col items-center justify-center border ${checked ? 'bg-black text-white' : ''}`}
              >
                <span className="text-sm">{day}</span>
                {checked && <span className="text-[8px]">●</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: 캘린더 페이지**

  `src/app/(app)/calendar/page.tsx`:
  ```tsx
  'use client';
  import { useEffect, useState } from 'react';
  import { createClient } from '@/lib/supabase/browser';
  import { CalendarView } from '@/components/calendar-view';
  import type { CheckIn } from '@/lib/types';

  export default function Calendar() {
    const [checkedDates, setCheckedDates] = useState<string[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [dayCheckins, setDayCheckins] = useState<CheckIn[]>([]);

    useEffect(() => {
      (async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('check_ins').select('local_date')
          .eq('user_id', user.id);
        setCheckedDates([...new Set((data ?? []).map((r) => r.local_date))]);
      })();
    }, []);

    async function pick(date: string) {
      setSelected(date);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('check_ins').select('*')
        .eq('user_id', user.id).eq('local_date', date)
        .order('checked_in_at', { ascending: false });
      setDayCheckins((data ?? []) as CheckIn[]);
    }

    return (
      <main className="p-6 space-y-6">
        <h1 className="text-xl font-bold">캘린더</h1>
        <CalendarView checkedDates={checkedDates} onSelect={pick} />
        {selected && (
          <section>
            <h2 className="font-bold mb-2">{selected}</h2>
            {dayCheckins.length === 0 ? (
              <p className="text-sm text-gray-500">이 날은 기록 없음</p>
            ) : (
              <ul className="space-y-2">
                {dayCheckins.map((c) => (
                  <li key={c.id} className="border rounded p-3">
                    <div className="text-xs text-gray-500">
                      {new Date(c.checked_in_at).toLocaleTimeString('ko-KR')} ·
                      {c.verification_method === 'gps' ? ' 📍' : ' 📷'}
                    </div>
                    {c.memo && <p className="mt-1">{c.memo}</p>}
                    {c.photo_url && <img src={c.photo_url} alt="" className="mt-2 rounded max-w-xs" />}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    );
  }
  ```

- [ ] **Step 3: 수동 테스트**

  - 캘린더 탭 → 오늘 체크인한 날짜가 진하게 표시
  - 그 날짜 탭 → 아래에 그날 기록들 노출

- [ ] **Step 4: 커밋**

  ```bash
  git add src/components/calendar-view.tsx src/app/\(app\)/calendar
  git commit -m "feat: monthly calendar with check-in dots"
  ```

---

# Phase 8 — 그룹 & 초대

## Task 17: 그룹 생성 & 초대 링크 진입

**Files:**
- Create: `src/app/(app)/groups/new/page.tsx`, `src/app/join/[code]/page.tsx`, `src/lib/utils/invite-code.ts`

- [ ] **Step 1: 초대 코드 생성 유틸**

  `src/lib/utils/invite-code.ts`:
  ```ts
  const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 헷갈리는 0/O/1/I 제외
  export function generateInviteCode(): string {
    let s = '';
    for (let i = 0; i < 6; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)];
    return s;
  }
  ```

- [ ] **Step 2: 새 그룹 생성 페이지**

  `src/app/(app)/groups/new/page.tsx`:
  ```tsx
  'use client';
  import { useState } from 'react';
  import { useRouter } from 'next/navigation';
  import { createClient } from '@/lib/supabase/browser';
  import { generateInviteCode } from '@/lib/utils/invite-code';

  export default function NewGroup() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);

    async function create() {
      setSaving(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 코드 충돌 시 재시도 (최대 5번)
      let code = '';
      let group;
      for (let i = 0; i < 5; i++) {
        code = generateInviteCode();
        const { data, error } = await supabase.from('groups').insert({
          name, invite_code: code, created_by: user.id,
        }).select().single();
        if (!error) { group = data; break; }
        if (!error?.code || (error as any).code !== '23505') {
          alert('그룹 생성 실패');
          setSaving(false);
          return;
        }
      }
      if (!group) { alert('코드 충돌 반복. 다시 시도'); setSaving(false); return; }

      await supabase.from('group_members').insert({
        group_id: group.id, user_id: user.id,
      });
      router.push('/groups');
    }

    return (
      <main className="p-6 space-y-4">
        <h1 className="text-xl font-bold">새 그룹 만들기</h1>
        <input
          value={name} onChange={(e) => setName(e.target.value)}
          placeholder="그룹 이름"
          className="w-full border rounded px-4 py-3"
        />
        <button
          disabled={!name.trim() || saving}
          onClick={create}
          className="w-full bg-black text-white rounded py-3 disabled:bg-gray-300"
        >{saving ? '만드는 중...' : '만들기'}</button>
      </main>
    );
  }
  ```

- [ ] **Step 3: 초대 링크 페이지**

  `src/app/join/[code]/page.tsx`:
  ```tsx
  import { createClient } from '@/lib/supabase/server';
  import { redirect } from 'next/navigation';
  import Link from 'next/link';

  export default async function Join({ params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;
    const supabase = await createClient();
    const { data: group } = await supabase
      .from('groups').select('id, name').eq('invite_code', code).maybeSingle();

    if (!group) {
      return <main className="p-6"><p>유효하지 않은 링크입니다.</p></main>;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return (
        <main className="p-6 space-y-4">
          <h1 className="text-xl font-bold">{group.name}</h1>
          <p>참여하려면 로그인이 필요해요.</p>
          <Link
            href={`/login?next=${encodeURIComponent(`/join/${code}`)}`}
            className="inline-block bg-black text-white rounded px-4 py-2"
          >로그인</Link>
        </main>
      );
    }

    // 프로필 없으면 온보딩
    const { data: profile } = await supabase
      .from('profiles').select('id').eq('id', user.id).maybeSingle();
    if (!profile) redirect('/onboarding');

    // 이미 멤버면 그룹으로
    const { data: existing } = await supabase
      .from('group_members').select('group_id')
      .eq('group_id', group.id).eq('user_id', user.id).maybeSingle();
    if (!existing) {
      await supabase.from('group_members').insert({
        group_id: group.id, user_id: user.id,
      });
    }
    redirect('/groups');
  }
  ```

- [ ] **Step 4: 커밋**

  ```bash
  git add src/app/\(app\)/groups/new src/app/join src/lib/utils/invite-code.ts
  git commit -m "feat: group creation + invite link join"
  ```

---

## Task 18: 그룹 탭 (스위처 + 멤버 + 피드 + 링크 복사)

**Files:**
- Modify: `src/app/(app)/groups/page.tsx`
- Create: `src/components/group-view.tsx` (client)

- [ ] **Step 1: 그룹 조회 서버 페이지**

  `src/app/(app)/groups/page.tsx`:
  ```tsx
  import { createClient } from '@/lib/supabase/server';
  import { getWeekRangeKST } from '@/lib/utils/week';
  import { GroupView } from '@/components/group-view';
  import Link from 'next/link';

  export default async function Groups({ searchParams }: { searchParams: Promise<{ g?: string }> }) {
    const { g: selectedId } = await searchParams;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: memberships } = await supabase
      .from('group_members').select('group_id, groups(id, name, invite_code, created_by)')
      .eq('user_id', user.id);

    const myGroups = (memberships ?? [])
      .map((m: any) => m.groups)
      .filter(Boolean);

    if (myGroups.length === 0) {
      return (
        <main className="p-6 space-y-4">
          <h1 className="text-xl font-bold">그룹</h1>
          <p className="text-gray-600">아직 소속된 그룹이 없어요.</p>
          <Link href="/groups/new" className="inline-block bg-black text-white rounded px-4 py-2">
            새 그룹 만들기
          </Link>
        </main>
      );
    }

    // ?g=<id> 로 선택된 그룹이 있으면 그것, 없으면 첫 그룹
    const active = myGroups.find((g: any) => g.id === selectedId) ?? myGroups[0];
    const { data: members } = await supabase
      .from('group_members').select('user_id, profiles(id, nickname, weekly_goal)')
      .eq('group_id', active.id);

    const memberIds = (members ?? []).map((m: any) => m.user_id);
    const { start, end } = getWeekRangeKST();
    const { data: weekCheckins } = await supabase
      .from('check_ins').select('user_id, local_date')
      .in('user_id', memberIds)
      .gte('local_date', start).lte('local_date', end);

    // 최근 활동 20개
    const { data: recent } = await supabase
      .from('check_ins').select('id, user_id, checked_in_at, verification_method, memo, photo_url')
      .in('user_id', memberIds)
      .order('checked_in_at', { ascending: false })
      .limit(20);

    const stats = (members ?? []).map((m: any) => {
      const days = new Set(
        (weekCheckins ?? []).filter((c) => c.user_id === m.user_id).map((c) => c.local_date)
      ).size;
      return {
        userId: m.user_id,
        nickname: m.profiles.nickname,
        goal: m.profiles.weekly_goal,
        days,
      };
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
    return (
      <GroupView
        groups={myGroups}
        activeGroup={active}
        currentUserId={user.id}
        stats={stats}
        recent={(recent ?? []).map((r: any) => ({
          ...r,
          nickname: stats.find((s) => s.userId === r.user_id)?.nickname ?? '',
        }))}
        inviteUrl={`${siteUrl}/join/${active.invite_code}`}
      />
    );
  }
  ```

- [ ] **Step 2: 그룹 뷰 클라이언트 컴포넌트**

  `src/components/group-view.tsx`:
  ```tsx
  'use client';
  import { useState } from 'react';
  import Link from 'next/link';

  type Group = { id: string; name: string; invite_code: string; created_by: string };
  type Stat = { userId: string; nickname: string; goal: number; days: number };
  type Recent = {
    id: string; user_id: string; nickname: string; checked_in_at: string;
    verification_method: 'gps' | 'photo'; memo: string | null; photo_url: string | null;
  };

  export function GroupView(props: {
    groups: Group[];
    activeGroup: Group;
    currentUserId: string;
    stats: Stat[];
    recent: Recent[];
    inviteUrl: string;
  }) {
    const { groups, activeGroup, currentUserId, stats, recent, inviteUrl } = props;
    const [copied, setCopied] = useState(false);
    const isAdmin = activeGroup.created_by === currentUserId;

    async function copy() {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }

    return (
      <main className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <select
            value={activeGroup.id}
            onChange={(e) => { window.location.href = `/groups?g=${e.target.value}`; }}
            className="border rounded px-2 py-1"
          >
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <Link href="/groups/new" className="text-sm underline">새 그룹</Link>
        </div>

        <section>
          <button
            onClick={copy}
            className="w-full border rounded px-4 py-3 text-left"
          >
            <div className="text-xs text-gray-500">초대 링크</div>
            <div className="truncate">{inviteUrl}</div>
            <div className="text-xs text-blue-600 mt-1">
              {copied ? '복사됨!' : '탭해서 복사'}
            </div>
          </button>
        </section>

        <section>
          <h2 className="font-bold mb-2">이번주 달성률</h2>
          <ul className="space-y-2">
            {stats.map((s) => {
              const pct = Math.round((s.days / s.goal) * 100);
              return (
                <li key={s.userId} className="border rounded p-3">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{s.nickname}</span>
                    <span className="text-sm">{s.days}/{s.goal}일 · {pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-black" style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h2 className="font-bold mb-2">최근 활동</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-gray-500">아직 활동이 없어요</p>
          ) : (
            <ul className="space-y-2">
              {recent.map((r) => (
                <li key={r.id} className="border rounded p-3">
                  <div className="text-sm">
                    <span className="font-medium">{r.nickname}</span> ·
                    <span className="text-gray-500">
                      {new Date(r.checked_in_at).toLocaleString('ko-KR')}
                    </span> ·
                    {r.verification_method === 'gps' ? ' 📍' : ' 📷'}
                  </div>
                  {r.memo && <p className="text-sm mt-1">{r.memo}</p>}
                  {r.photo_url && <img src={r.photo_url} alt="" className="mt-2 rounded max-w-xs" />}
                </li>
              ))}
            </ul>
          )}
        </section>

        {isAdmin && (
          <section>
            <p className="text-xs text-gray-500">방장 도구는 다음 태스크에서 추가</p>
          </section>
        )}
      </main>
    );
  }
  ```

- [ ] **Step 3: 커밋**

  ```bash
  git add src/app/\(app\)/groups/page.tsx src/components/group-view.tsx
  git commit -m "feat: group tab with stats, feed, invite copy"
  ```

---

## Task 19: 방장 도구 (추방 + 링크 재발급)

**Files:**
- Create: `src/app/api/groups/[id]/kick/route.ts`, `src/app/api/groups/[id]/invite-refresh/route.ts`
- Modify: `src/components/group-view.tsx`

- [ ] **Step 1: 추방 API**

  `src/app/api/groups/[id]/kick/route.ts`:
  ```ts
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
  ```

- [ ] **Step 2: 링크 재발급 API**

  `src/app/api/groups/[id]/invite-refresh/route.ts`:
  ```ts
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
      if ((error as any).code !== '23505') {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
    return NextResponse.json({ error: 'collision retry exhausted' }, { status: 500 });
  }
  ```

- [ ] **Step 3: 방장 UI 추가**

  `src/components/group-view.tsx` 의 `isAdmin` 섹션을 다음으로 대체:
  ```tsx
  {isAdmin && (
    <section className="space-y-3">
      <h2 className="font-bold">방장 도구</h2>
      <button
        onClick={async () => {
          if (!confirm('새 링크를 발급하면 기존 링크는 무효화됩니다. 진행할까요?')) return;
          const res = await fetch(`/api/groups/${activeGroup.id}/invite-refresh`, { method: 'POST' });
          if (res.ok) location.reload();
          else alert('실패');
        }}
        className="w-full border rounded py-2"
      >새 초대 링크 발급</button>
      <div>
        <p className="text-sm text-gray-600 mb-1">멤버 관리</p>
        <ul className="space-y-1">
          {stats.filter((s) => s.userId !== currentUserId).map((s) => (
            <li key={s.userId} className="flex justify-between items-center border rounded p-2">
              <span>{s.nickname}</span>
              <button
                onClick={async () => {
                  if (!confirm(`${s.nickname}님을 추방할까요?`)) return;
                  const res = await fetch(`/api/groups/${activeGroup.id}/kick`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: s.userId }),
                  });
                  if (res.ok) location.reload();
                  else alert('실패');
                }}
                className="text-red-600 text-sm"
              >추방</button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )}
  ```

- [ ] **Step 4: 커밋**

  ```bash
  git add src/app/api/groups src/components/group-view.tsx
  git commit -m "feat: admin kick + invite refresh"
  ```

---

# Phase 9 — 설정 탭

## Task 20: 설정 탭

**Files:**
- Modify: `src/app/(app)/settings/page.tsx`
- Create: `src/components/settings-form.tsx`

- [ ] **Step 1: 설정 페이지 (서버)**

  `src/app/(app)/settings/page.tsx`:
  ```tsx
  import { createClient } from '@/lib/supabase/server';
  import { SettingsForm } from '@/components/settings-form';

  export default async function Settings() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', user.id).single();
    return (
      <main className="p-6 space-y-6">
        <h1 className="text-xl font-bold">설정</h1>
        <SettingsForm profile={profile!} />
      </main>
    );
  }
  ```

- [ ] **Step 2: 설정 폼 (클라이언트)**

  `src/components/settings-form.tsx`:
  ```tsx
  'use client';
  import { useState } from 'react';
  import { useRouter } from 'next/navigation';
  import { createClient } from '@/lib/supabase/browser';
  import { GymSearch } from '@/components/gym-search';
  import type { Profile } from '@/lib/types';
  import type { Place } from '@/lib/naver';

  export function SettingsForm({ profile }: { profile: Profile }) {
    const router = useRouter();
    const [nickname, setNickname] = useState(profile.nickname);
    const [goal, setGoal] = useState(profile.weekly_goal);
    const [gymEdit, setGymEdit] = useState(false);
    const [saving, setSaving] = useState(false);

    async function saveBasic() {
      setSaving(true);
      const supabase = createClient();
      const { error } = await supabase.from('profiles')
        .update({ nickname, weekly_goal: goal }).eq('id', profile.id);
      setSaving(false);
      if (error) alert('저장 실패');
      else router.refresh();
    }

    async function saveGym(place: Place) {
      const supabase = createClient();
      const { error } = await supabase.from('profiles').update({
        gym_place_id: place.id,
        gym_name: place.place_name,
        gym_address: place.road_address || place.address,
        gym_lat: place.lat,
        gym_lng: place.lng,
      }).eq('id', profile.id);
      if (error) alert('저장 실패');
      else { setGymEdit(false); router.refresh(); }
    }

    async function logout() {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
    }

    return (
      <div className="space-y-6">
        <section className="space-y-2">
          <label className="text-sm text-gray-600">닉네임</label>
          <input
            value={nickname} onChange={(e) => setNickname(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </section>

        <section className="space-y-2">
          <label className="text-sm text-gray-600">주간 목표</label>
          <div className="grid grid-cols-3 gap-2">
            {[2, 3, 4, 5, 6, 7].map((n) => (
              <button
                key={n}
                onClick={() => setGoal(n)}
                className={`py-2 border rounded ${goal === n ? 'bg-black text-white' : ''}`}
              >주 {n}회</button>
            ))}
          </div>
        </section>

        <button
          onClick={saveBasic} disabled={saving}
          className="w-full bg-black text-white rounded py-3"
        >저장</button>

        <section className="space-y-2">
          <label className="text-sm text-gray-600">헬스장</label>
          {gymEdit ? (
            <>
              <GymSearch onSelect={saveGym} />
              <button onClick={() => setGymEdit(false)} className="text-sm underline">
                취소
              </button>
            </>
          ) : (
            <div className="border rounded p-3">
              <div className="font-medium">{profile.gym_name}</div>
              <div className="text-sm text-gray-600">{profile.gym_address}</div>
              <button
                onClick={() => setGymEdit(true)}
                className="mt-2 text-sm underline"
              >변경</button>
            </div>
          )}
        </section>

        <hr />

        <button
          onClick={logout}
          className="w-full border rounded py-2 text-red-600"
        >로그아웃</button>
      </div>
    );
  }
  ```

- [ ] **Step 3: 수동 테스트**

  - 설정 탭 → 닉네임/목표 변경 → 저장 → 다른 탭 갔다와도 반영됨
  - 헬스장 변경 → 새 헬스장 검색 → 선택 → 반영
  - 로그아웃 → 로그인 페이지로

- [ ] **Step 4: 커밋**

  ```bash
  git add src/app/\(app\)/settings src/components/settings-form.tsx
  git commit -m "feat: settings tab (nickname/goal/gym/logout)"
  ```

---

# Phase 10 — 배포 & 실기기 테스트

## Task 21: Vercel 배포

**Files:**
- Modify: `README.md`

- [ ] **Step 1: main 브랜치 push**

  ```bash
  git push
  ```

- [ ] **Step 2: Vercel Import**

  - Vercel 대시보드 → New Project → GitHub 저장소 `헬스장출석어플` Import
  - Framework: Next.js (자동 인식)
  - Environment Variables 에 `.env.local` 내용 전부 붙여넣기
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `SUPABASE_SERVICE_ROLE_KEY`
    - `NAVER_CLIENT_ID`
    - `NAVER_CLIENT_SECRET`
    - `NEXT_PUBLIC_SITE_URL` → 배포 도메인(예: `https://gymmate.vercel.app`)
  - Deploy

- [ ] **Step 3: Naver 앱에 배포 도메인 등록**

  - Naver Developers → 내 애플리케이션 → 앱 선택 → API 설정 → 웹 서비스 URL에 `https://<배포도메인>` 추가

- [ ] **Step 4: Supabase 매직링크 콜백 URL 등록**

  - Supabase 대시보드 → Authentication → URL Configuration
  - Site URL: `https://<배포도메인>`
  - Redirect URLs: `https://<배포도메인>/auth/callback`, `http://localhost:3000/auth/callback`

- [ ] **Step 5: 배포 URL 접속 확인**

  - `https://<배포도메인>` 접속 → 로그인 → 매직링크 → 온보딩 → 오늘 탭까지 흐름 확인

- [ ] **Step 6: `README.md` 작성**

  간단한 README:
  ```markdown
  # 짐메이트 (GymMate)

  헬스장 출석 공유 PWA.

  - 스펙: [docs/specs/2026-09-02-design.md](docs/specs/2026-09-02-design.md)
  - 구현 계획: [docs/plans/2026-09-02-implementation.md](docs/plans/2026-09-02-implementation.md)
  - 배포: https://<배포도메인>

  ## 개발

  ```bash
  npm install
  cp .env.local.example .env.local  # 값 채우기
  npm run dev
  ```
  ```

- [ ] **Step 7: 커밋 & push**

  ```bash
  git add README.md
  git commit -m "docs: README with links"
  git push
  ```

---

## Task 22: 실기기 iPhone Safari 최종 테스트

**Files:** 없음 (테스트 시나리오)

- [ ] **Step 1: 홈 화면 추가**

  iPhone Safari에서 배포 URL 접속 → 공유 → "홈 화면에 추가" → 아이콘 노출 확인.

- [ ] **Step 2: 로그인 흐름**

  - 홈 아이콘으로 앱 실행
  - 이메일 입력 → 메일함에서 링크 탭 → 콜백 → 온보딩
  - 닉네임 · 헬스장 검색 · 목표 → 완료

- [ ] **Step 3: 헬스장 방문 체크인 (실제)**

  - 등록한 헬스장 방문
  - "오늘 헬스 감" 탭 → 위치 권한 허용 → 성공 → 메모 입력 → 완료
  - 오늘 기록에 노출 확인
  - 진행률 1/N 표시 확인

- [ ] **Step 4: 사진 인증 폴백**

  - 헬스장 밖에서 "오늘 헬스 감" 탭 → 거리 안내 → 사진 인증 화면
  - "카메라로 인증" → **카메라만 열리는지 (갤러리 X) 확인**
  - 촬영 → 업로드 → 완료
  - 오늘 기록에 사진 표시 확인

- [ ] **Step 5: 그룹 흐름**

  - 그룹 탭 → 새 그룹 만들기 → 이름 입력 → 생성
  - 초대 링크 복사 → 카톡에 붙여넣기 확인
  - 다른 iPhone(또는 다른 계정)으로 링크 접속 → 로그인/온보딩 → 참여
  - 그룹 탭에 두 명 노출, 각자 달성률/피드 반영

- [ ] **Step 6: 방장 도구**

  - 방장 계정으로 다른 멤버 추방 → 리스트에서 사라짐
  - 새 링크 발급 → 이전 링크로 접속 시 "유효하지 않은 링크" 노출

- [ ] **Step 7: 캘린더 & 설정**

  - 캘린더 탭 → 체크인한 날짜 도트 표시 → 탭 시 상세 노출
  - 설정 탭 → 닉네임/목표/헬스장 변경 → 반영
  - 로그아웃 → 로그인 화면 복귀

- [ ] **Step 8: 최종 커밋 (있으면)**

  버그 발견 시 수정 후 커밋 & push. Vercel 자동 재배포.

---

# 자체 리뷰 완료

- ✅ 스펙의 모든 섹션이 어떤 태스크로 커버되는지 확인
- ✅ 플레이스홀더 없음
- ✅ 타입 일관성 확인 (`Profile`, `CheckIn`, `Group` 등)
- ✅ 함수 시그니처 (`haversineMeters`, `getWeekRangeKST`, `toKstDate` 등) 태스크 간 일치
- ✅ 각 태스크가 자체 완결적 (독립 실행/커밋 가능)

# 실행

각 태스크의 체크박스를 하나씩 완료하면서 진행. 사용자 개입 필요 태스크(1, 4, 5, 6, 21의 일부 스텝)는 사용자가 대시보드에서 직접 실행하는 부분이 있으니 협업 필요.
