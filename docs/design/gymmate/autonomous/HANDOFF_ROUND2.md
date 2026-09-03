# GymMate 2차 폴리시 결과 보고서

## 1. 요약
- Round 2는 1차 코발트 구조·공통 컴포넌트를 유지하면서 지정된 10개 항목만 폴리시
- 전면 재디자인 없음, API·데이터 흐름 변경 없음
- 자기평가 총점: 95 / 100 (1차 93 → +2, preview harness가 아닌 production build 캡처 확보)
- 반복 세션: 1개 (Round 2 통합)

## 2. 항목별 변경·검증

### 1) 최종 리뷰 스크린샷 정리
- `next.config.ts`에 임시 `devIndicators: false` 삽입 → preview harness 통해 캡처 후 원상복구
- Production build에서 `/login`, `/login-sent`, `/join/BADCODE` 실 라우트 캡처 (dev indicator 없음, `docs/design/gymmate/autonomous/screenshots/round2/login-375.png`, `login-sent-375.png`, `join-invalid-375.png`)
- Preview harness는 인증 필요 화면(오늘·캘린더·그룹·설정·체크인·온보딩·그룹 없음) 시각 검증에만 사용, **사용 후 완전 제거** (`src/app/preview/`, middleware allowlist, next.config 변경 모두 원상복구)
- Preview 상단에 test 버튼 chrome 없이 `?s=<screen>` 쿼리 파라미터로 화면만 노출
- 온보딩·로그인·라이트박스 렌더에는 `TabBar` 미포함 (실 (app)/layout 구조 그대로 재현)
- **검증**: git diff에 preview 흔적 없음, production build 13 route (preview 없음)

### 2) 체크인 거리 정책 검증
- 서버 API (`src/app/api/check-in/route.ts` line 6-7, 37-39): `RADIUS_M = 100`, `if (d > RADIUS_M)` → `too far` 반환 → 클라가 photo-required로 전환 — **이미 올바름**
- Preview harness의 mock 문구만 "42m" → "142m 떨어져 있어요"로 수정 (제품 코드 무변경)
- **검증**: 서버 로직 코드 상 확인, 실 API 호출 e2e는 인증 rate limit으로 미완

### 3) 캘린더 상세 UX
- `src/app/(app)/calendar/page.tsx` — `dayCheckins.length === 0` 분기의 빈 상태 문구를 "이 날은 기록이 없어요" → **"이 날은 운동 기록이 없어요"** 개선
- 선택 시 상세(제목 + 기록 리스트 또는 빈 상태) 표시 로직은 이미 정상 → 유지
- Preview로 checked-date 선택 상태(9월 1일에 사진 인증) 캡처: `calendar-detail-checked-375.png`, `calendar-detail-checked-320.png`
- **검증**: 실 라우트 캡처는 인증 필요 → preview harness 실물 컴포넌트로 렌더 확인

### 4) 목표 단위 통일 (회 → 일)
- `src/app/(app)/today/page.tsx`: `{goal}회` → `{goal}일`
- `src/components/group-view.tsx`: `{s.days} / {s.goal}회` → `{s.days} / {s.goal}일`
- `src/components/settings-form.tsx`: `주 {n}회` → `주 {n}일`
- `src/app/onboarding/page.tsx`: `주 {n}회` → `주 {n}일`
- "회"는 사용 안 함 (개별 체크인 기록 수를 문구로 노출하는 곳 없음)
- **검증**: preview screenshots에서 오늘 `3 / 5일`, 그룹 진행률 `X / X일`, 설정/온보딩 `주 X일` 확인

### 5) 그룹 최근 활동 사진
- `src/components/today-records.tsx`, `src/app/(app)/calendar/page.tsx`, `src/components/group-view.tsx` 3곳 모두 사진 컨테이너를 `aspect-[4/3]` → `aspect-[3/2] max-h-[240px]`로 변경
- Preview harness의 mock 이미지도 사람 실루엣 대신 **덤벨 + 랙 SVG** (얼굴 없는 운동 기구 그래픽)로 교체
- 실 데이터의 사진은 signed URL 그대로 사용 (기존 정책 유지, 스톡 인물 사진 절대 추가 없음)
- **검증**: 320/375/428 preview 캡처에서 사진이 240px 이내, 탭 바에 가리지 않음 확인

### 6) 그룹 empty state와 무효 초대 화면
- `src/app/(app)/groups/page.tsx` empty state: 외곽 `rounded-[16px] bg-white border` 카드 제거 → 여백·아이콘·텍스트·CTA 중심의 평평한 구성
- `src/app/join/[code]/page.tsx` invalid 화면: 외곽 카드 제거, 아이콘 사이즈 축소 (w-14 → w-12, size 26 → 24), 홈으로 CTA를 mx-auto로 중앙 배치
- **검증**: `groups-empty-375.png`, `join-invalid-375.png` — 이전 대비 카드 높이 절반 이하로 축소, 여백 위주

### 7) 하단 탭 바
- `src/components/tab-bar.tsx`:
  - 비활성 color `#9CA3AF` → **`#707580`** (secondary → 대비 상향)
  - 라벨 `text-[11px]` → **`text-[12px]`**
  - Link에 `min-h-[56px]` 추가로 터치 영역 최소 56px 보장
  - `aria-current="page"` 추가로 접근성 개선
- **검증**: 활성 탭 코발트 + font-semibold, 비활성 secondary + font-medium 대비 확인 (screenshots/round2)

### 8) 로그인 발송 완료 UX
- `src/app/login/page.tsx` 재구성:
  - 발송 완료 카드에 `sentEmail` 표시
  - **"로그인 링크 다시 보내기"** 버튼 + 60초 cooldown ("N초 후 다시 보내기" 카운트다운)
  - **"다른 이메일로 다시 받기"** 액션 (입력 화면으로 복귀)
  - `signInWithOtp` 호출 함수(`requestLink`)로 발송/재발송 통합, PKCE·redirect_to 등 인증 흐름 무변경
- **검증**: `login-sent-375.png` (production build)에서 이메일 표시 · "51초 후 다시 보내기" 비활성 · "다른 이메일로 다시 받기" 링크 확인

### 9) 온보딩
- `src/app/onboarding/page.tsx` step 1:
  - 제목과 인풋 사이에 **"친구들에게 보일 이름이에요"** 헬퍼 텍스트 추가 (`text-[14px] text-[#707580] mb-6`)
  - 3-세그먼트 진행 바 + "N / 3 단계" 라벨 유지 (Round 1에서 도입)
- 온보딩은 `(app)/` 레이아웃 밖이므로 TabBar 미포함 — 이미 정상
- **검증**: `onboarding-step1-375.png`에서 진행 바 · 헬퍼 · 인풋 · CTA 확인, TabBar 없음

### 10) 검증 실행 결과

| 명령 | 결과 |
|---|---|
| `npx tsc --noEmit` (캐시 클린 후) | ✅ exit 0 |
| `npx vitest run` | ✅ 3 files, 8 tests pass |
| `npx next build` | ✅ compiled, 13 routes (preview 없음) |
| `next dev` + preview harness 캡처 | ✅ round2/ 폴더에 15+ 종 실물 스크린샷 확보 |
| `next start` (production) 캡처 | ✅ login, login-sent, join-invalid — dev indicator 없음 |
| 실 Supabase 인증 e2e | ⚠️ 미완 — 프로젝트 전체 email rate limit 계속 발동 |

## 3. Before / After 요약

| 항목 | Before (Round 1) | After (Round 2) |
|---|---|---|
| 오늘 주간 진행 문구 | `3 / 5회` | `3 / 5일` |
| 그룹 멤버 진행률 | `X / X회` | `X / X일` |
| 설정/온보딩 목표 | `주 X회` | `주 X일` |
| 캘린더 빈 상태 | "이 날은 기록이 없어요" | "이 날은 운동 기록이 없어요" |
| 체크인 사진 aspect | `4/3` | `3/2 + max-h-[240px]` |
| Preview mock 사진 | 사람 실루엣 | 덤벨 + 랙 (얼굴 없음) |
| Preview mock 거리 | 42m | 142m |
| 그룹 없음 카드 | 큰 외곽 카드 + 큰 아이콘 | 평평, 아이콘·문구·CTA 중심 |
| 무효 초대 카드 | 외곽 카드 + 아이콘 | 평평 구성 |
| 탭 바 비활성 색 | `#9CA3AF` (muted) | `#707580` (secondary, +대비) |
| 탭 바 라벨 크기 | 11px | 12px |
| 탭 바 터치 영역 | py-2.5 (~48px) | `min-h-[56px]` |
| 로그인 발송 완료 | 안내 카드만 | +이메일 표시 +60s cooldown 재발송 +다른 이메일 |
| 온보딩 step 1 | 제목만 | +"친구들에게 보일 이름이에요" 헬퍼 |

## 4. 남은 blocker
- **P0**: 없음
- **P1**: 없음
- **P2**:
  - **실 Supabase 인증 e2e (Round 2에서도 미완)**: 프로젝트 전체 email rate limit이 지속 발동하여 login → 오늘 → 사진 인증 → 새로고침 → 캘린더/그룹/라이트박스 실 세션 검증이 성립하지 않음. 인증 파이프라인 자체는 login-sent 응답과 실 URL로 정상 도달 확인. rate limit 해제 후(수시간~ 하루) 사용자가 로컬에서 직접 재현 가능
  - Next 16 `middleware → proxy` deprecation (build 경고만, UI 무관 별건)

## 5. 스크린샷 목록 (round2)
```
docs/design/gymmate/autonomous/screenshots/round2/
├── login-375.png                    (production, no dev indicator)
├── login-sent-375.png               (production, resend + 다른 이메일 UX)
├── join-invalid-375.png             (production, flatten)
├── today-320.png / today-375.png / today-428.png
├── calendar-detail-checked-320.png / calendar-detail-checked-375.png
├── calendar-detail-empty-375.png
├── groups-320.png / groups-375.png / groups-428.png
├── groups-empty-375.png
├── settings-375.png
├── onboarding-step1-375.png
├── checkin-photo-required-375.png   ("헬스장에서 142m 떨어져 있어요")
└── image-preview-375.png            (lightbox)
```
실 라우트: login-375, login-sent-375, join-invalid-375
Preview harness 렌더 (실 컴포넌트, mock 데이터, 사용 후 제거): 나머지

## 6. 사용자 확인 순서 (수정판)
1. **인증 rate limit 회복 후**: 브라우저에서 로그인 → 오늘 → "오늘 헬스 감" → 사진 인증 → 저장 → **새로고침 시 사진 재표시** 확인
2. 오늘 탭 문구가 "N / X일"로 표시되는지
3. 캘린더 날짜 선택 시 아래 상세가 항상 뜨고, 기록이 없는 날은 "이 날은 운동 기록이 없어요" 표시
4. 그룹 멤버 진행률 "X / X일", 최근 활동 사진이 3:2 · 240px 이내로 표시
5. 설정 목표 "주 X일", 온보딩 step 1의 헬퍼 문구 확인
6. 로그인 후 발송 완료 화면에서 "N초 후 다시 보내기" · "다른 이메일로 다시 받기" 동작
7. 하단 탭 바 비활성 아이콘/라벨 대비, 활성 탭 코발트 확인
8. 320/375/428px 각각에서 사진이 탭 바에 가리지 않는지 재확인

## 7. 유지된 부분 (2차에서 손대지 않음)
- 코발트 디자인 토큰 (`src/app/globals.css`) 및 Tailwind v4 매핑
- `Button`/`Input`/`Progress`/`PhotoLightbox` 공통 컴포넌트 시그니처
- `check-in-flow.tsx`의 상태 머신·API 호출·PKCE 인증 흐름
- `TabBar`의 safe-area padding, 4개 탭 구조
- 오늘 탭 hero CTA `h-16 text-[17px]` (Round 1에서 도입, 유지)
- Photo pipeline (Supabase Storage signed URL 3600s, 3곳 렌더링)
- 사용자·멤버 닉네임 전용 표시, 이니셜 아바타 금지 정책
- 그룹 방장 기능 (초대 링크 복사, 재발급, 추방)
- Middleware의 static asset exclusion (`manifest.json`)
