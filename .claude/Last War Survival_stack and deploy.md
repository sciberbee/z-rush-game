# **Project Z-Rush: 모바일 웹 기술 스택 및 배포 전략**

## **1\. 핵심 기술 스택 (Core Tech Stack)**

이 프로젝트는 서버 비용을 0원으로 유지하면서, 모바일에서 네이티브 앱에 가까운 성능을 내는 것을 목표로 합니다.

### **1.1. 프론트엔드 (Game Client)**

모바일 브라우저(Chrome, Safari)에서 별도 설치 없이 실행되는 **SPA(Single Page Application)** 구조입니다.

| 구분 | 추천 기술 | 선정 이유 |
| :---- | :---- | :---- |
| **언어** | **TypeScript** | 게임 로직의 복잡도(유닛 상호작용, 물리 연산) 관리를 위해 타입 안정성이 필수입니다. |
| **빌드 도구** | **Vite** | 모바일 디버깅을 위한 빠른 HMR(Hot Module Replacement) 지원 및 최적화된 빌드 속도를 제공합니다. |
| **렌더링 엔진** | **Three.js** (또는 Pixi.js) | **Three.js:** 원작(Last War)과 같은 **3D 카툰 뷰** 를 구현하려면 필수입니다. **Pixi.js:** 2D로 타협할 경우, 물량전 성능(WebGL)이 가장 압도적입니다. |
| **UI 프레임워크** | **HTML/CSS (Vanilla)** | 게임 오버, 시작 화면 등 단순 UI는 React 등을 쓰지 않고 가벼운 HTML/CSS로 직접 제어하여 번들 사이즈를 줄입니다. |
| **조작 라이브러리** | **Nipple.js** | 모바일 화면에 **가상 조이스틱(Virtual Joystick)** 을 쉽게 구현해주는 라이브러리입니다. |

### **1.2. 백엔드 및 배포 (Backend & Infra)**

클라우드플레어의 생태계를 적극 활용하여 '완전 무료' 및 '고성능'을 달성합니다.

| 구분 | 추천 기술 | 선정 이유 |
| :---- | :---- | :---- |
| **호스팅** | **Cloudflare Pages** | 정적 웹사이트 호스팅 서비스입니다. GitHub와 연동되어 푸시만 하면 자동 배포(CI/CD)되며, 전 세계 엣지 네트워크를 통해 로딩 속도가 매우 빠릅니다. |
| **데이터 저장** | **Firebase** (또는 Supabase) | 유저 세이브 데이터(재화, 스테이지) 저장을 위한 BaaS입니다. Cloudflare와 연동하기 쉽고 무료 티어가 넉넉합니다. |
| **패키지 매니저** | **pnpm** | npm보다 빠르고 디스크 공간을 효율적으로 사용합니다. |

## **2\. 모바일 최적화 전략 (Mobile Optimization)**

스마트폰 브라우저 환경은 PC와 다릅니다. 다음 요소들을 반드시 코드에 적용해야 합니다.

### **2.1. 뷰포트 및 터치 제어 (Viewport & Touch)**

사용자가 화면을 확대하거나, 스크롤을 당겨서 새로고침하는 행위를 막아야 합니다.

* **Meta Tag 설정:**  
  \<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"\>

* **CSS 설정:**  
  body {  
    touch-action: none; /\* 브라우저 기본 터치 동작(스크롤, 줌) 차단 \*/  
    overscroll-behavior: none; /\* 바운스 효과 제거 \*/  
    user-select: none; /\* 텍스트 선택 방지 \*/  
  }

### **2.2. PWA (Progressive Web App) 적용**

웹사이트를 앱처럼 홈 화면에 아이콘으로 추가하고, 전체 화면으로 실행할 수 있게 합니다.

* manifest.json 파일 작성 (아이콘, 앱 이름, 배경색 설정).  
* 서비스 워커(Service Worker) 등록: 오프라인 캐싱을 통해 리소스 로딩 속도 향상.

### **2.3. 성능 최적화 (Performance)**

* **Asset 압축:** 3D 모델(.glb)은 **Draco Compression** 을 사용하여 용량을 줄입니다.  
* **해상도 조절 (DPR):** 모바일의 높은 픽셀 밀도(Retina 등)를 그대로 렌더링하면 발열이 심합니다. window.devicePixelRatio 를 2 이하로 제한합니다.

## **3\. Cloudflare 배포 파이프라인 (Deployment)**

Cloudflare 계정만 있다면 5분 안에 배포 시스템을 구축할 수 있습니다.

### **단계 1: 프로젝트 준비**

1. GitHub에 리포지토리 생성.  
2. 로컬에서 Vite 프로젝트 생성 및 커밋.  
   npm create vite@latest z-rush-game \-- \--template vanilla-ts

### **단계 2: Cloudflare Pages 연결**

1. Cloudflare 대시보드 로그인 \-\> **Workers & Pages** \-\> **Create Application** \-\> **Pages** \-\> **Connect to Git**.  
2. GitHub 리포지토리 선택.  
3. **Build Settings** 입력:  
   * **Framework Preset:** Vite  
   * **Build Command:** npm run build (또는 pnpm build)  
   * **Output Directory:** dist

### **단계 3: 배포 및 확인**

* **Save and Deploy** 버튼 클릭.  
* Cloudflare가 자동으로 코드를 빌드하고 https://z-rush-game.pages.dev 와 같은 무료 도메인을 생성해 줍니다.  
* 이후 코드를 수정해서 GitHub에 push 할 때마다 자동으로 재배포됩니다.

## **4\. 폴더 구조 예시 (Project Structure)**

/  
├── public/              \# 정적 파일 (이미지, 3D 모델, 사운드)  
│   ├── models/  
│   ├── sounds/  
│   └── manifest.json    \# PWA 설정  
├── src/  
│   ├── assets/          \# 코드에서 import할 이미지 등  
│   ├── core/            \# 게임 엔진 코어  
│   │   ├── Game.ts      \# 메인 게임 루프  
│   │   ├── Input.ts     \# 터치/조이스틱 입력 처리  
│   │   └── Resources.ts \# 리소스 로더  
│   ├── entities/        \# 게임 오브젝트  
│   │   ├── Player.ts  
│   │   ├── Gate.ts      \# 수학 게이트 로직  
│   │   └── Enemy.ts  
│   ├── ui/              \# HTML UI 관리  
│   ├── utils/           \# 수학 계산 등 유틸리티  
│   ├── main.ts          \# 엔트리 포인트  
│   └── style.css        \# 전체 스타일 (모바일 뷰포트 설정 포함)  
├── index.html  
├── package.json  
└── vite.config.ts

## **5\. 결론**

제안하는 스택은 **\[Vite \+ TypeScript \+ Three.js\]** 로 게임을 개발하고, **\[Cloudflare Pages\]** 로 무료 호스팅하는 방식입니다.

이 조합은 초기 비용이 전혀 들지 않으며, 추후 사용자가 늘어나도 Cloudflare의 강력한 CDN 덕분에 서버가 다운될 걱정이 거의 없습니다. 특히 모바일 웹 게임 배포에 있어 현재 가장 효율적인 구성입니다.