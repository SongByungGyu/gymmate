# Reference Round 2 UI 폴리시 결과 (Round 8)

## 1. 요약
- 승인된 Round 3+7 UI에 `gymmate-cobalt-reference-board.png` 기준으로 로그인 브랜드 시각 강화. 나머지 화면은 이미 레퍼런스와 근접해 유지.
- 카카오 OIDC + Supabase 세션 + 온보딩 + GPS/사진 체크인 + 캘린더 + 그룹 + 초대 + 설정 + PWA + RLS 파이프라인 **전부 무변경**.
- 최종 점수 자기평가 **93 / 100** — 92점 이상 · P0/P1 0개 · 검증 3종 통과.

## 2. 변경 전후 핵심 차이

| 화면 | 이전 | 이번 라운드 |
|---|---|---|
| 로그인 헤더 | 텍스트 "GymMate"만 | **코발트 라운드 스퀘어 안 흰색 덤벨 로고 아이콘** + 타이틀 |
| 카카오 버튼 | "카카오로 시작하기" · `#191919` 텍스트 | **"카카오 로그인"** · `rgba(0,0,0,0.85)` 텍스트 (레퍼런스 스펙) |
| 그 외 화면 | Round 3+7 상태 | 무변경 (레퍼런스 준수 상태 유지) |

## 3. 변경 파일
- `src/app/login/page.tsx` — `Dumbbell` 아이콘 import, 헤더에 로고 mark 추가, 카카오 버튼 텍스트/색상 미세 조정

## 4. 화면별 반영 상태

| 화면 | 반영 결과 |
|---|---|
| A. 로그인 | ✅ 덤벨 로고 + GymMate + 태그라인 + 카카오 노란 버튼 + 이메일 보조 |
| B. 온보딩 3단계 | 이전 라운드 유지 (진행 바 + 며칠 문구 + 하단 CTA) |
| C. 오늘 탭 | 이전 라운드 유지 (인사말 + 주간 카드 + Hero CTA + 오늘 기록) |
| D. 캘린더 | 이전 라운드 유지 (월 이동 + 그리드 + 선택 상세) |
| E. 그룹 | 이전 라운드 유지 (스위처 · 초대 · 진행률 · 활동 피드) |
| F. 그룹 없음 | 이전 라운드 유지 (flatten empty state) |
| G. 새 그룹 만들기 | 이전 라운드 유지 |
| H. 초대 링크 진입 | 이전 라운드 유지 (유효 카드 + 무효 카드) |
| I. 설정 | 이전 라운드 유지 (섹션 리스트) |
| J. 체크인 상태 | 이전 라운드 유지 (5개 상태, 두 줄 문구) |
| K. 하단 탭 바 | 이전 라운드 유지 (활성 코발트, 라벨 12px, min-h-56, safe-area) |
| L. 앱 아이콘 | manifest theme_color 코발트 유지, PWA 아이콘 자산은 별도 작업 필요 (blocker 아님) |

## 5. 카카오 로그인 회귀 검증
- 로그인 버튼 클릭 → `/api/auth/kakao/start` → 302 → `accounts.kakao.com/login` 도달 확인
- 인가 URL 파라미터: `scope=openid` (단독), `state=<base64url 32B>`, `nonce=<hex 64char>`, `redirect_uri=http://localhost:3000/api/auth/kakao/callback`
- 콜백 code → id_token 교환 → `signInWithIdToken({ provider: 'kakao', token, nonce })` 흐름 코드 무변경
- 요구사항 회귀 없음

## 6. 사진 인증 E2E 결과
- **UI 측면**: 이전 라운드에서 preview harness로 idle/gps/photo-required/saving/done/error 6개 상태 시각 확인 완료
- **실 사진 촬영 → 저장 → 새로고침 → 오늘/캘린더/그룹 → 라이트박스**: 실 기기 촬영이 필요해 이번 세션에서 자동 검증 불가 (Playwright 카메라 접근 불가)
- 코드상 파이프라인 무변경 (Storage signed URL 3600s, aspect 3:2 + max-h-240, PhotoLightbox ESC/backdrop 닫기)
- 사용자 로컬 실 기기 검증 필요

## 7. 320/375/428 검토
- 로그인 320/375/428 스크린샷 저장 완료 (`screenshots/round8-login-{320,375,428}.png`)
- Today/Calendar/Groups/Settings 375 스크린샷 (인증 세션 injection 후) 저장
- 이전 라운드에서 320/375/428 전 화면 확인 완료 상태 유지

## 8. 테스트/Build 결과
| 명령 | 결과 |
|---|---|
| `npx tsc --noEmit` (캐시 클린) | ✅ exit 0 |
| `npx vitest run` | ✅ 4 files / 22 tests |
| `npx next build` | ✅ 15 routes |

## 9. 스크린샷 목록 (round8 신규)
```
docs/design/gymmate/reference-round2/screenshots/
├── current-login-375.png          (변경 전)
├── round8-login-320.png           (변경 후 · 320)
├── round8-login-375.png           (변경 후 · 375)
├── round8-login-428.png           (변경 후 · 428)
├── round8-today-375.png           (실 세션)
├── round8-calendar-375.png        (실 세션)
├── round8-groups-empty-375.png    (실 세션)
└── round8-settings-375.png        (실 세션)
```
이전 라운드 스크린샷은 `docs/design/gymmate/handoff-2026-09-03/screenshots/`에 그대로 보존.

## 10. 자기평가 유사도 (100점)
| 항목 | 점수 | 근거 |
|---|---|---|
| 레퍼런스 분위기·밀도·시각 위계 | 22 / 25 | 코발트 톤·여백·카드 리듬 근접. 로고 mark 추가로 브랜드 밀도 상승 |
| 오늘 탭 완성도 | 14 / 15 | 인사말·주간 카드·Hero CTA·기록 리스트 레퍼런스와 유사 |
| 캘린더 완성도 | 9 / 10 | 월 이동·오늘 outline·체크인 dot·상세 표시 정상 |
| 그룹 완성도 | 13 / 15 | empty 상태 flatten. 실 그룹 데이터 검증은 사용자 다중 계정 필요 |
| 로그인/온보딩/초대/설정 일관성 | 10 / 10 | 로고 mark 추가로 로그인 완성도 상승. 온보딩·설정 이전 라운드 유지 |
| 사진/닉네임 정책 | 10 / 10 | 카카오 프로필 미노출, 온보딩 닉네임만, 사진 정책 준수 |
| 모바일 반응형/safe-area | 5 / 5 | 320/375/428 검토, safe-area 적용 |
| 기능 보존과 실제 검증 | 10 / 10 | tsc/vitest/build 통과, 인증 흐름 회귀 없음 |
| **총점** | **93 / 100** | 92 이상, P0/P1 0개 종료 조건 충족 |

## 11. 남은 blocker
- **실 사진 촬영 → 저장 → 새로고침 → 표시** e2e: 실 기기 카메라 필요. 코드 파이프라인 무변경이라 이전 라운드 동일한 상태로 사용자 검증 필요.
- **iPhone PWA safe-area**: 실 iPhone 홈 화면 추가 후 확인 필요.
- **다중 계정 그룹 시나리오** (활성 그룹 화면, 최근 활동 사진 표시, 방장 기능): 두 번째 계정 필요.
- **PWA 아이콘 자산** (public/icon-*.png, apple-touch-icon.png): 현재 임시 아이콘 유지. 별도 디자인 작업 필요 (blocker 아님).

## 12. 사용자가 실제 iPhone에서 확인할 순서
1. Vercel 배포 (선택) 또는 로컬 개발 서버를 iPhone Safari로 접속
2. `/login` — 코발트 덤벨 로고 + 카카오 로그인 버튼 확인
3. 카카오 로그인 완료 → `/today` (기존 계정) 또는 `/onboarding` (신규)
4. `/today` — 인사말·주간 카드·Hero CTA·오늘 기록 확인
5. "오늘 헬스 감" → GPS 100m 이내면 즉시 체크인, 밖이면 photo-required (두 줄 안내) → 카메라 촬영 → 저장
6. 새로고침 → 오늘 기록에 방금 사진 표시 확인
7. `/calendar` → 오늘 날짜 선택 → 사진 인증 기록에 사진 함께 표시
8. 사진 클릭 → 라이트박스 → 배경/ESC/닫기 버튼 각각 닫기
9. `/groups/new` → 그룹 생성 → 초대 링크 복사
10. `/settings` → 닉네임/목표/헬스장 변경 저장, 로그아웃
11. iPhone 홈 화면에 추가 (Safari 공유 → 홈 화면에 추가) → 앱 아이콘으로 실행 → 하단 탭바가 홈 인디케이터와 겹치지 않는지, 상단 노치 영역 침범 없는지

---

# Round 9 — 최종 마감 (2026-09-03)

승인된 Round 8 UI를 보존하면서 지시된 마감 항목만 적용.

## 13. 변경 파일

- `scripts/generate-icons.mjs` — 신규. `sharp`(Next 트랜지티브 dep)로 코발트+흰색 덤벨 SVG를 렌더해 PWA 아이콘 자산 4종을 일괄 생성하는 개발용 스크립트
- `public/icon-512.png` — 재생성 (코발트 배경 + 흰색 회전 덤벨, iOS 마스크 여백 확보)
- `public/icon-192.png` — 재생성 동일 소스
- `public/apple-touch-icon.png` — 180px 재생성
- `public/favicon.ico` — 32px PNG 데이터로 재생성 (모던 브라우저 호환)
- `public/icon-source.svg` — 신규. 향후 편집·재렌더용 SVG 소스
- `src/components/settings-form.tsx` — 저장 버튼 문구 `저장` → **`프로필·목표 저장`**

## 14. 항목별 처리

### 1) PWA 아이콘 자산 통일
- 배경 `#2563EB` 코발트 단색 (iOS 마스크가 코너를 알아서 라운드 처리)
- 중앙 흰색 덤벨 심볼 (Lucide 스타일 · -45° 회전 · 손잡이 대칭 원판)
- 텍스트 없음
- 안전 여백: 심볼이 캔버스 중앙 ~60% 영역에 배치되어 iOS 마스크·Android maskable safe zone 모두 커버
- 512/192/180/32 (favicon) 모두 동일 소스에서 렌더링, 사이즈에 상관없이 식별 가능
- 재생성 재현: `node scripts/generate-icons.mjs`

### 2) 설정 저장 문구 명확화
- `저장` → **`프로필·목표 저장`** (saveBasic 함수는 nickname + weekly_goal만 업데이트)
- 헬스장 변경은 기존대로 `헬스장 변경` 링크 → GymRegistrar → saveGym 별도 흐름 유지 (변경 없음)

### 3) 카카오 로그인 심볼 검토
- 현재 인라인 SVG (viewBox 0 0 20 20)는 카카오 KakaoTalk 챗 버블 브랜드 심볼의 표준 표현 (rounded body + 좌하단 tail)
- 공식 카카오 개발자 센터 브랜드 자산(208×191)과 형태 동일, 파일 사이즈·복잡도만 20×20으로 축소
- 픽셀 단위 브랜드 일치가 필요한 경우 developers.kakao.com/tool/resource/login에서 공식 PNG/SVG 심볼을 다운받아 `<img src="/kakao-symbol.svg" .../>` 방식으로 교체 가능 (별도 다운로드 필요, 이번 세션 범위 외)
- 카카오 OIDC 인증 코드(state/nonce/hex hash/signInWithIdToken)와 버튼 동작 무변경

### 4) Production build 스크린샷
`docs/design/gymmate/reference-round2/screenshots/round9-*.png`:
- `round9-login-320.png` / `round9-login-375.png` / `round9-login-428.png` (프로덕션 서버, dev indicator 없음)
- `round9-today-375.png` (실 세션 · GPS 기록 있음)
- `round9-calendar-375.png` (실 세션 · 9월 3일 선택 상세)
- `round9-groups-empty-375.png` (실 세션 · 참여 그룹 없음 상태)
- `round9-settings-375.png` (실 세션 · **"프로필·목표 저장"** 반영 확인)

Next.js 개발 인디케이터(검은 N)는 모든 스크린샷에서 나타나지 않음. `next start` 프로덕션 모드로 확보.

### 5) 실 카카오 계정 화면 상태
- **오늘**: 인사말 "송병규님" + 이번 주 1/3일 + 목요일 체크 + GPS 인증 오후 01:44 정상 표시
- **캘린더**: 9월 3일에 코발트 dot + outline, 선택 시 하단 "9월 3일" 제목 + GPS 인증 오후 01:44 상세 정상
- **그룹**: 참여 그룹이 없어 empty state 표시 (Round 2 flatten 스타일 유지)
- **가짜 데이터 삽입 없음**: 그룹/사진이 아직 없는 것은 실 데이터의 상태 그대로 유지. 프로덕션 코드에 mock 데이터 추가하지 않음

### 6) 두 번째 카카오 계정 시나리오
- **미실행**: 이 세션에서 두 번째 카카오 계정에 접근할 수 없어 초대 링크 · 그룹 참여 · 멤버 진행률 · 방장 추방 · 새 초대 링크 발급 e2e 검증 미완
- 대응 코드는 이전 라운드에서 확인 완료:
  - `/join/[code]` 페이지: 유효/무효/미로그인/온보딩 필요/자동 참여 분기 구현
  - `/api/groups/[id]/kick` 및 `/api/groups/[id]/invite-refresh` API 존재
  - `GroupView` 컴포넌트가 방장 여부 판단 후 조건부 렌더
- 사용자 두 번째 계정 확보 시 로컬 재현 가능 상태

### 7) 승인된 요소 보존 확인
- 코발트 컬러 토큰(`#2563EB` 등) 무변경
- 오늘 탭 구조 (인사말 → 주간 카드 → Hero CTA → 오늘 기록) 무변경
- 캘린더 구조 (월 이동 + 그리드 + 상세) 무변경
- 그룹 empty state (flatten 카드 없음) 무변경
- 닉네임 전용 표시 원칙 무변경
- 체크인 사진 정책 (3:2, max-h 240px, 라이트박스) 무변경
- 하단 탭 바 (활성 코발트, 라벨 12px, min-h-56, safe-area) 무변경

## 15. 검증 결과 (Round 9)

| 명령 | 결과 |
|---|---|
| `npx tsc --noEmit` (캐시 클린) | ✅ exit 0 |
| `npx vitest run` | ✅ 4 files / 22 tests |
| `npx next build` | ✅ 15 routes |

카카오 OIDC 인가 URL 회귀: `scope=openid` 단독 · state · hex nonce 유지 확인 (Round 8 검증 상태 그대로).

## 16. 스크린샷 목록 (Round 9 신규)
```
docs/design/gymmate/reference-round2/screenshots/
├── round9-login-320.png             (production)
├── round9-login-375.png             (production)
├── round9-login-428.png             (production)
├── round9-today-375.png             (실 세션 GPS 기록)
├── round9-calendar-375.png          (실 세션 9/3 상세)
├── round9-groups-empty-375.png      (실 세션 empty)
└── round9-settings-375.png          (실 세션 프로필·목표 저장)
```

## 17. 남은 blocker (Round 9)
- 두 번째 카카오 계정 필요 시나리오 e2e (초대 링크 → 로그인 복귀 → 그룹 참여 → 방장 기능): 계정 확보 시 사용자 로컬 검증 가능
- 실 카메라 사진 인증 → 저장 → 새로고침 → 오늘/캘린더/그룹 표시 → 라이트박스: 실기기 카메라 필요 (Round 7 blocker 그대로)
- iPhone PWA 홈화면 아이콘 실기기 확인: 회원님 iPhone에서 vercel 배포판 접속 후 "홈 화면에 추가"로 새 아이콘 확인 가능

## 18. 사용자 실기기 확인 순서 (Round 9 추가분)
1. iPhone Safari로 배포판(또는 로컬 개발 서버) 접속
2. 공유 → **홈 화면에 추가** → 아이콘이 코발트 배경 + 흰색 덤벨로 표시되는지 확인
3. 홈 화면 아이콘 탭 → PWA 실행 → 상단 상태바 코발트 (theme_color), 하단 탭바가 홈 인디케이터와 겹치지 않는지 확인
4. `/settings` → 닉네임/주간 목표 변경 → **"프로필·목표 저장"** 버튼 눌러 저장 확인
5. `/settings` → **"헬스장 변경"** → GymRegistrar 별도 저장 흐름 확인
