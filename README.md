# Z-Rush

Last War: Survival 스타일의 "무한 증식 슈팅 디펜스" 웹 게임

## 게임 소개

Z-Rush는 병사 군단을 이끌고 좀비 무리를 물리치는 슈팅 디펜스 게임입니다. 플레이어는 자동으로 전진하며, 수학 게이트를 통과해 병력을 증식시키고 적을 처치합니다.

### 주요 기능

- **자동 전진 시스템**: 병사들이 자동으로 전진하며 적을 향해 사격
- **수학 게이트**: +, -, x, / 연산으로 병력 증감
- **웨이브 시스템**: 점점 강해지는 좀비 무리
- **보스전**: 레벨 끝에 등장하는 강력한 보스
- **영웅 시스템**: Tank, Dealer, Support 3종 영웅
- **PWA 지원**: 모바일에서 앱처럼 설치 가능

## 기술 스택

- **TypeScript** + **Vite** - 빠른 개발 환경
- **Three.js** - 3D 렌더링
- **Nipple.js** - 모바일 조이스틱
- **Howler.js** - 오디오 관리
- **Vite PWA Plugin** - PWA 지원

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

개발 서버 실행 후 http://localhost:5173 에서 게임을 플레이할 수 있습니다.

## 조작법

| 플랫폼 | 조작 |
|--------|------|
| 모바일 | 화면 좌측 하단 조이스틱으로 좌우 이동 |
| PC | 방향키 또는 A/D 키로 좌우 이동 |

사격은 자동으로 이루어집니다.

## 프로젝트 구조

```
src/
├── core/           # 핵심 시스템
│   ├── Game.ts           # 메인 게임 루프
│   ├── SceneManager.ts   # Three.js 씬 관리
│   ├── Input.ts          # 입력 처리
│   ├── EventBus.ts       # 이벤트 시스템
│   ├── AudioManager.ts   # 사운드 관리
│   └── Resources.ts      # 리소스 로딩
├── entities/       # 게임 엔티티
│   ├── Entity.ts         # 베이스 클래스
│   ├── Player.ts         # 플레이어 (병사 그룹)
│   ├── Soldier.ts        # 개별 병사
│   ├── Enemy.ts          # 적 베이스
│   ├── Zombie.ts         # 좀비
│   ├── Boss.ts           # 보스
│   ├── Gate.ts           # 수학 게이트
│   ├── Bullet.ts         # 총알
│   └── Hero.ts           # 영웅
├── systems/        # 게임 시스템
│   ├── MovementSystem.ts   # 이동
│   ├── CombatSystem.ts     # 전투
│   ├── SpawnSystem.ts      # 스폰
│   ├── CollisionSystem.ts  # 충돌
│   └── WaveSystem.ts       # 웨이브 관리
├── ui/             # UI 컴포넌트
│   ├── UIManager.ts      # UI 총괄
│   ├── HUD.ts            # 인게임 HUD
│   ├── MainMenu.ts       # 메인 메뉴
│   └── GameOver.ts       # 게임오버/승리 화면
├── config/         # 설정
│   ├── GameConfig.ts     # 게임 상수
│   ├── LevelConfig.ts    # 레벨 데이터
│   └── HeroConfig.ts     # 영웅 데이터
├── utils/          # 유틸리티
│   ├── ObjectPool.ts     # 오브젝트 풀링
│   └── MathUtils.ts      # 수학 유틸
├── types/          # 타입 정의
│   └── index.ts
├── main.ts         # 진입점
└── style.css       # 스타일
```

## 게임 설정값

주요 게임 밸런스 설정은 `src/config/GameConfig.ts`에서 조정할 수 있습니다:

```typescript
INITIAL_SOLDIER_COUNT: 5    // 초기 병사 수
MAX_SOLDIER_COUNT: 100      // 최대 병사 수
FORWARD_SPEED: 10           // 전진 속도
HORIZONTAL_SPEED: 15        // 좌우 이동 속도
FIRE_RATE: 0.2              // 사격 간격 (초)
BULLET_SPEED: 50            // 총알 속도
AUTO_AIM_RANGE: 30          // 자동 조준 범위
```

## 배포

Cloudflare Pages에 배포하기:

```bash
npm run build
# dist 폴더를 Cloudflare Pages에 업로드
```

## 라이선스

MIT License
