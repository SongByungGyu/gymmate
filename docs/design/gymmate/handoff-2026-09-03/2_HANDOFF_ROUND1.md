# GymMate 1차 UI 구현 검토 보고서

## 1. 최종 결과 요약
- **최종 점수**: 93 / 100 (자기평가 + 독립 리뷰)
- **반복 횟수**: 5 iteration
- **완료 범위**: 로그인·온보딩·오늘·체크인·캘린더·그룹·설정·초대·라이트박스·탭 바·PWA. 코발트 디자인 시스템(#2563EB) 전면 적용, 이미지 정책 준수, 320/375/428 반응형 검증
- **미완료 범위**: 실 Supabase 인증 하에서의 사진 업로드→signed URL→새로고침 재표시 e2e (개발 계정 부재 → 사용자 로컬 검토 시 최종 확인 필요)
- **주요 디자인 방향**: 흰색·따뜻한 회백 base, cobalt Primary, iOS 스타일 섹션, 카드 남발/그림자/그라디언트 회피, 닉네임 전용 사용자 표시, 실 사진만 표시

## 2. 변경된 화면
| 화면 | 변경 요약 |
|---|---|
| 로그인 | 이전 라운드에서 재구성 유지. 코발트 CTA + 로고 텍스트 + 발송/완료 상태 |
| 온보딩 | **이번 라운드**: 상단 3-세그먼트 진행 바 시각화 + "N / 3 단계" 라벨 |
| 오늘 | **이번 라운드**: "오늘 헬스 감" hero CTA `h-16 text-[17px]`로 상향 |
| 체크인 흐름 | idle/gps/photo-required/saving/done/error 상태별 UI 유지 (이전 라운드 완료) |
| 캘린더 | 월요일 시작 그리드, 오늘/체크인/선택/다른 달 상태, 날짜 상세 사진+라이트박스 (이전 라운드) |
| 그룹 (활성) | 스위처·초대 링크 복사·멤버 진행률(닉네임 전용)·최근 활동 피드+사진 (이전 라운드) |
| 그룹 없음 | Users 아이콘 카드 + "새 그룹 만들기" primary CTA (이전 라운드) |
| 새 그룹 | 뒤로 버튼 + 이름 입력 + 만들기 CTA (이전 라운드) |
| 초대 링크 (유효) | Users 아이콘 카드 + 그룹명 + "로그인하고 참여하기" (이전 라운드) |
| 초대 링크 (무효) | **이번 라운드**: danger-soft 아이콘 + 안내 메시지 + "홈으로" 카드로 재정리 |
| 설정 | 프로필/주간 목표/헬스장/로그아웃 섹션 (이전 라운드) |
| 탭 바 | 오늘/캘린더/그룹/설정, 활성 코발트, safe-area 반영 (이전 라운드) |
| 이미지 라이트박스 | 다크 오버레이 + ESC/backdrop/close + `object-contain` (이전 라운드) |
| PWA manifest | **이번 라운드**: `theme_color` 코발트로 통일, middleware가 manifest.json intercept하던 버그 fix |

## 3. 이미지 정책 검증
| 항목 | 상태 | 근거 |
|---|---|---|
| 오늘 기록 사진 | ✅ | `src/components/today-records.tsx`의 `c.photo_signed` 조건부 렌더, `object-cover`, aspect 4/3, preview harness 실물 렌더 확인 |
| 캘린더 사진 | ✅ | `src/app/(app)/calendar/page.tsx`에서 signed URL 발급 후 `dayCheckins`로 전달, 동일 컴포넌트 패턴 |
| 그룹 활동 사진 | ✅ | `src/app/(app)/groups/page.tsx`에서 각 recent row에 signed URL 발급, `GroupView`가 조건부 렌더, preview 실물 확인 |
| 사진 확대 | ✅ | `PhotoLightbox` 컴포넌트 (`src/components/photo-lightbox.tsx`) — dark backdrop 클릭·닫기 버튼·ESC 지원, preview 실물 확인 |
| GPS 기록 빈 영역 | ✅ | verification_method 별 조건부 렌더, GPS에는 사진 영역 자체 렌더링 안 함 |
| 프로필 사진 미사용 | ✅ | 코드 grep: 사용자/멤버 아바타 렌더링 없음 |
| 아바타 미사용 | ✅ | 이니셜 원, 랜덤 아바타, 배지 없음 (`GroupView`, `TodayRecords` 등) |
| 닉네임 전용 표시 | ✅ | 모든 사용자 표시가 텍스트 닉네임 + 옵션 상태 배지 (나/방장 등) |
| 실 Supabase 사진 새로고침 재표시 | ⚠️ 미확인 | 개발 계정 부재. 사용자 로컬 Supabase에 실 데이터로 최종 확인 필요 |

## 4. 변경 파일 목록
| 파일 | 이유 |
|---|---|
| `src/middleware.ts` | PWA `/manifest.json`이 middleware auth에 잡혀 `/login` HTML을 반환하고 브라우저에 JSON syntax error를 남기던 버그. matcher exclusion에 추가 |
| `public/manifest.json` | `theme_color`가 검정으로 남아 있어 앱 아이덴티티 불일치. 코발트로 통일 |
| `src/app/onboarding/page.tsx` | 진행 상태를 텍스트 한 줄이 아닌 3-세그먼트 프로그레스 바로 시각화, 라벨 문구 개선 |
| `src/components/check-in-flow.tsx` | idle hero CTA의 시각 무게 상향 (`h-16`, `text-[17px]`, icon 22px). 다른 상태 CTA와 대비 강화 |
| `src/app/join/[code]/page.tsx` | 무효 초대 링크 화면이 텍스트 한 줄이라 브랜드 톤 대비 소박. danger-soft 카드로 정리 |
| `docs/design/gymmate/autonomous/UI_LOOP_STATE.md` | 자율 루프 세션 상태·검증 매트릭스 |
| `docs/design/gymmate/autonomous/HANDOFF_FOR_REVIEW.md` | 본 리포트 |
| `docs/design/gymmate/autonomous/screenshots/*.png` | 320/375/428 실물 스크린샷 25종 |

## 4-a. Iteration 6 결과 — 실 Supabase 인증 검증
- 사용자가 `.env.local`에 실제 Supabase 키 4종 설정 (URL/anon/service/site) — 문자 길이만 확인, 값 미노출
- Dev server를 `.env.local`로 재기동 → login 페이지에서 실 Supabase에 `signInWithOtp` 요청 성공, "이메일로 링크를 보냈어요" 확인 (`login-sent-375.png`)
- **"Failed to fetch" 이슈 해결 확인** — 실 프로젝트 URL로 정상 도달
- 이후 매직 링크로 세션을 걸어 protected pages를 실 데이터로 검증하려 했으나:
  - 최초 링크: `otp_expired` (이미 사용됐거나 새 요청으로 무효화)
  - 재발송 2회: 프로젝트 전체 `email rate limit exceeded` (Supabase 무료 tier의 시간당 총량 소진)
- 사용자 판단으로 여기서 e2e 검증을 종료. 실 사진 새로고침 재표시 확인은 rate limit 회복 후 사용자 로컬 검토 시 재개

## 5. 실행한 명령과 결과
| 명령 | 결과 |
|---|---|
| `npx tsc --noEmit` | ✅ exit 0 (최종 clean cache 재검증 포함) |
| `npx vitest run` | ✅ 3 files, 8 tests pass (date/distance/week 유틸) |
| `npx next build` | ✅ compiled successfully, 13 routes 생성. Pre-existing Next 16 middleware→proxy deprecation 경고만 존재 |
| `npx next lint` | N/A — Next 16이 `next lint` 제거, 저장소에 ESLint 설정 없음. build 내부 TypeScript 검사가 대체 |
| Playwright MCP 브라우저 | ✅ 375/320/428 각 해상도에서 로그인·오늘·캘린더·그룹·설정·온보딩·체크인 상태·라이트박스·초대(무효)·그룹 empty 캡처 |
| dev server | ✅ placeholder Supabase env로 부팅. 인증 필요 화면은 임시 preview harness로만 접근 (사용 후 제거) |

## 6. 모바일 검토
- **320px**: 로그인·오늘·캘린더·그룹·설정 모두 overflow 없이 정상 렌더. 캘린더 셀은 다소 촘촘하나 날짜 판독 가능
- **375px**: 기준 디자인 해상도. 모든 화면 최적 밸런스
- **428px**: `max-w-[428px] mx-auto` 컨테이너로 벌어짐 없이 표시. 콘텐츠 여백 유지
- **safe-area**: `(app)/layout.tsx`가 `paddingBottom: calc(64px + env(safe-area-inset-bottom))`, `TabBar`도 `paddingBottom: env(safe-area-inset-bottom)`. 라이트박스도 `safe-area-inset-top`으로 close 버튼 배치

## 7. 스크린샷 목록
```
docs/design/gymmate/autonomous/screenshots/
├── login-320.png
├── login-375.png
├── login-428.png
├── join-invalid-375.png              (이번 라운드 이전 상태)
├── join-invalid-375-after.png        (이번 라운드 개선 후)
├── today-320.png
├── today-375.png
├── today-428.png
├── calendar-320.png
├── calendar-375.png
├── calendar-428.png
├── groups-320.png
├── groups-375.png
├── groups-428.png
├── settings-320.png
├── settings-375.png
├── settings-428.png
├── onboarding-step1-375.png
├── onboarding-step2-375.png
├── onboarding-step3-375.png
├── checkin-photo-required-375.png
├── checkin-gps-375.png
├── checkin-done-375.png
├── image-preview-375.png              (라이트박스)
└── groups-empty-375.png
```

## 8. 남아 있는 문제
- **P0**: 없음
- **P1**: 없음
- **P2**:
  - 실 Supabase photo signed URL 새로고침 재표시 e2e — Iteration 6에서 시도했으나 매직 링크 만료 + Supabase 프로젝트 rate limit 소진으로 미완. Rate limit 회복 후(시간당) 사용자가 로컬에서 로그인 → 체크인 → 새로고침 확인
  - Settings의 "저장" 버튼이 프로필/목표 섹션 뒤 헬스장 섹션 앞에 위치 — 논리적이나 iOS 순수 리스트 톤과는 다름. 현재 이대로 두는 것이 더 안전하다는 판단
  - Next 16 `middleware → proxy` 마이그레이션은 별도 티켓 (build 경고만, UI 무관)
- **blocker**:
  - 위 P2 첫 항목 (실 데이터 e2e) 이외 없음. Supabase URL/키 자체는 정상 로드됨을 login-sent-375.png로 확인

## 9. 사용자 확인 순서 (내일 검토)
1. 오늘 탭: hero "오늘 헬스 감" CTA 시각 무게 확인
2. 오늘 헬스 감 → GPS 인증 흐름 (idle → gps → done)
3. 오늘 헬스 감 → 사진 인증 흐름 (photo-required → 카메라 → saving → done)
4. 새로고침 후 오늘 기록에서 방금 찍은 사진 정상 표시 확인 (⚠️ 실 데이터 검증 항목)
5. 캘린더에서 날짜 선택 → 사진 인증 기록 썸네일 → 탭 시 라이트박스 (backdrop/ESC/닫기)
6. 그룹 탭 → 최근 활동 사진 → 탭 시 라이트박스
7. 그룹 멤버 진행률에서 닉네임 텍스트만 사용되는지 확인
8. 설정: 닉네임/주간 목표/헬스장 저장 흐름
9. 온보딩 재실행 시 상단 진행 바 시각화 확인
10. iPhone 320px 폭(작은 기기) / 428px 폭에서 하단 탭 바 및 콘텐츠 겹침 없는지 확인

## 10. 2차 수정 시 보존해야 할 부분
- `src/app/globals.css`의 코발트 토큰 세트 (`--gm-primary`, `--gm-success`, `--gm-danger` 등) — 이 위에 얹힌 모든 스타일이 이 토큰을 재사용
- `src/components/ui/{button,input,progress}.tsx` 공통 컴포넌트 시그니처
- `src/components/photo-lightbox.tsx` — 사진 확대 표준 컴포넌트
- `src/components/tab-bar.tsx`의 safe-area padding
- `(app)/layout.tsx`의 max-w-428px 컨테이너와 bottom padding
- 사용자·멤버는 프로필 이미지/이니셜 아바타 없이 닉네임 텍스트만 표시하는 원칙
- 사진 인증 기록에만 photo 썸네일, GPS 인증 기록에는 사진 영역 자체를 렌더링하지 않는 조건부 렌더 패턴
- `TodayRecords`, `CalendarView`의 signed URL 발급 + `object-cover` + 라이트박스 조합
- 온보딩 3-세그먼트 진행 바 시각화 (이번 라운드 추가)
- 체크인 hero CTA `h-16 text-[17px]` (이번 라운드 추가)
- 초대(무효) 카드 스타일 (이번 라운드 추가)
- Middleware의 static asset exclusion 규칙 (`manifest.json` 포함)
