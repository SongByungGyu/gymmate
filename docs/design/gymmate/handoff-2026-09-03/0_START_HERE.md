# GymMate UI 자율 구현 검토 자료

세션 종료일: **2026-09-03**
최종 점수: **95 / 100** (Round 1: 93 → Round 2: 95)

---

## 폴더 구성

```
handoff-2026-09-03/
├── 0_START_HERE.md          ← 이 파일 (먼저 읽기)
├── 1_HANDOFF_ROUND2.md      ← 2차 폴리시 상세 (지금 확인할 것)
├── 2_HANDOFF_ROUND1.md      ← 1차 구현 상세 (배경 참고)
├── 3_UI_LOOP_STATE.md       ← 전체 세션 로그 · 매트릭스 · 자기평가
└── screenshots/             ← 17종 실물 스크린샷 (production + preview harness)
```

---

## 5분 안에 파악하는 순서

1. **본 파일 훑기** (30초)
2. `1_HANDOFF_ROUND2.md` (3분) — 이번 라운드 10개 폴리시 항목별 Before/After
3. `screenshots/` 폴더 (1분) — 실물 화면 확인
   - `login-*.png`, `login-sent-375.png`, `join-invalid-375.png` = **production build 실제 라우트** (dev indicator 없음)
   - 나머지 = preview harness로 실 컴포넌트 + mock 데이터 렌더 후 캡처 (harness는 사용 후 완전 제거됨)

---

## Round 2에서 바뀐 것 (한눈에)

| 영역 | Before | After |
|---|---|---|
| 오늘/그룹/설정/온보딩 단위 | "N / X회" | **"N / X일"** (distinct 날짜 기준과 일치) |
| 캘린더 빈 상태 | "이 날은 기록이 없어요" | "이 날은 **운동** 기록이 없어요" |
| 체크인 사진 비율 | 4:3 | **3:2 + max-h 240px** |
| 그룹 없음 · 무효 초대 카드 | 외곽 카드 + 큰 여백 | **평평한 구성** (여백 · 아이콘 · 문구 · CTA) |
| 탭 바 비활성 색 | #9CA3AF (연회색) | **#707580** (대비 상향) + 라벨 12px + min-h 56px |
| 로그인 발송 완료 | 안내 카드만 | **60초 cooldown 재발송** + **다른 이메일로 다시 받기** + 이메일 표시 |
| 온보딩 step 1 | 제목만 | **"친구들에게 보일 이름이에요"** 헬퍼 추가 |

Round 1에서 잡은 뼈대(코발트 토큰, 공통 컴포넌트, 이미지 정책, 반응형, safe-area)는 그대로 유지.

---

## 실물 확인 순서 (사용자용)

내일 실 앱에서 회원님이 검토하실 순서:

1. **rate limit 회복 후** 로그인 → 오늘 → "오늘 헬스 감" → 사진 인증 → 저장 → **새로고침 시 사진 재표시** 확인 (이번 세션의 유일한 blocker)
2. 오늘/그룹/설정 문구가 모두 **"N / X일"** 인지
3. 캘린더에서 도트가 있는 날 · 없는 날 각각 선택해 상세가 잘 뜨는지
4. 로그인 후 발송 완료 화면에서 "N초 후 다시 보내기" 카운트다운 · "다른 이메일로 다시 받기" 동작
5. 온보딩 step 1 헬퍼 문구
6. 하단 탭 바 비활성 아이콘 대비, 활성 탭 코발트
7. 320px (SE) / 428px (Pro Max) 폭에서 사진이 탭 바에 가리지 않는지

---

## 남은 blocker (오직 1건)

- **실 Supabase 인증 e2e 미완**: 세션 도중 Supabase 프로젝트 전체 email rate limit이 지속 발동하여 login → today → 사진 인증 → 새로고침 실 사이클 검증 실패. **인증 파이프라인 자체는 정상 동작**하는 것을 확인 (login-sent 상태 도달, redirect_to=localhost:3000/auth/callback 정상). Rate limit 회복 후(수시간~ 하루) 사용자가 직접 재현 가능.
- Next 16 `middleware → proxy` deprecation 경고는 별건 마이그레이션 티켓 (build 통과, UI 무관).

---

## 커밋 제안

git status 상 UI 관련 modified 13개 파일. 아래처럼 나눠 커밋하시면 히스토리가 깔끔합니다.

```
git add public/manifest.json src/middleware.ts
git commit -m "fix(pwa): stop middleware from intercepting /manifest.json; align theme color to cobalt"

git add src/app/login/page.tsx
git commit -m "feat(login): add resend cooldown and switch-email actions on sent state"

git add src/app/onboarding/page.tsx
git commit -m "feat(onboarding): visual 3-step progress bar + step 1 helper text"

git add src/app/(app)/today/page.tsx src/app/(app)/groups/page.tsx src/app/(app)/calendar/page.tsx src/components/group-view.tsx src/components/settings-form.tsx
git commit -m "refactor(ui): unify weekly progress unit from '회' to '일' (distinct dates)"

git add src/app/(app)/groups/page.tsx src/app/join/[code]/page.tsx
git commit -m "refactor(ui): flatten group-empty and invalid-invite screens"

git add src/components/tab-bar.tsx
git commit -m "polish(ui): boost tab bar inactive contrast (#707580), 12px label, min-h 56px, aria-current"

git add src/components/check-in-flow.tsx
git commit -m "polish(ui): stronger hero CTA on today check-in idle state"

git add src/components/today-records.tsx src/components/group-view.tsx src/app/(app)/calendar/page.tsx
git commit -m "polish(ui): check-in photo aspect 3:2 with 240px cap"
```

또는 한꺼번에:

```
git add src public
git commit -m "feat(ui): GymMate cobalt UI round-2 polish (10 items)"
```

원격 push는 사용자 확인 후 진행 부탁드립니다.
