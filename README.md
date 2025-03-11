# 📌 ERP 프로젝트 개발 역할 분담 및 진행 가이드라인

## 🚀 개발 스택

- **프론트엔드**: Vite + React + TypeScript + Zustand + Tailwind CSS
- **백엔드**: Django REST Framework (DRF)
- **상태 관리**: Zustand
- **API 통신**: Axios

---

## 📂 프로젝트 폴더 구조

```bash
📂 ERP
├── 📂 public
├── 📂 src
│   ├── 📂 api           # Axios API 요청 코드
│   ├── 📂 assets        # 이미지, 아이콘, 폰트 등 정적 자원
│   ├── 📂 components    # 재사용 가능한 공통 컴포넌트
│   ├── 📂 hooks         # 커스텀 React 훅
│   ├── 📂 pages         # 라우팅 페이지 (UI 페이지 구현)
│   ├── 📂 routes        # React Router 라우팅 설정
│   ├── 📂 store         # Zustand 상태 관리(store) 파일
│   ├── 📂 utils         # 공통 유틸리티 함수 (날짜 변환 등)
│   ├── App.tsx          # App 컴포넌트 (최상위 컴포넌트)
│   ├── main.tsx         # 프로젝트 진입점(entry point)
│   ├── index.css        # Tailwind CSS & Global Style
│   └── vite-env.d.ts    # Vite 타입 정의
├── .env                 # 환경변수 파일 (API 주소 등)
├── tailwind.config.js   # Tailwind CSS 설정
├── postcss.config.js    # PostCSS 설정 (Tailwind 사용 시 필요)
├── tsconfig.json        # TypeScript 설정
├── vite.config.ts       # Vite 프로젝트 설정
└── package.json         # 프로젝트 종속성 및 스크립트
```


## 📌 개발자 역할 분담

각 담당자는 본인이 맡은 페이지의 아래 3가지 작업을 모두 책임지고 개발합니다.
단, 배연준의 도움이 필요하면 편하게 연락 바랍니다.

- API 설계 및 연동 (DRF와 협업)
- Zustand 상태관리(store) 설계
- UI 페이지 구현

| 담당자 | 브랜치명 (`feature/...`) | 카테고리 | 페이지 이름 및 경로 | 주요 기능 |
|-------------|---------------------------|---------|-----------|-----------|
| 🧑‍💻 김도원 | `feature/auth-dashboard` | 인증, 대시보드 | 로그인 (`/login`) | 사용자 로그인, 세션 유지 |
|        |                           |              | 대시보드 (`/`) | 최신 재고 부족 알림, 최근 발주 목록 |
| 🧑‍💻 김은성 | `feature/inventory-alerts` | 재고 관리, 재고 부족 알림 | 재고 목록 (`/inventory`) | 전체 재고 목록 조회 및 검색 |
|        |                           |              | 재고 상세 (`/inventory/:id`) | 특정 상품 재고 조정 |
|        |                           |              | 알림 목록 (`/alerts`) | 부족 재고 확인 및 해제 |
| 🧑‍💻 김강민 | `feature/orders-hr` | 발주 관리, HR 관리 | 발주 목록 (`/orders`) | 전체 발주 조회 |
|        |                           |              | 발주 상세 (`/orders/:id`) | 발주 승인 및 상태 변경 |
|        |                           |              | 직원 목록 (`/hr`) | 직원 정보 관리 |
|        |                           |              | 직원 상세 (`/hr/:id`) | 특정 직원 상태 변경 |

---

## 📌📌 개발 전 필수 안내사항

### ✅ 1. Branch 전략

각 담당자는 반드시 본인의 **Feature branch**에서만 작업을 진행합니다.

**예시**:

```bash
git checkout -b feature/auth-dashboard
```
작업 완료 시 dev 브랜치로 Pull Request(PR) 를 진행 (리뷰 후 Merge)합니다.

브랜치 구조:

```bash

main (배포 브랜치)
 └─ dev (개발 브랜치, PR 리뷰 후 Merge)
      ├─ feature/auth-dashboard
      ├─ feature/inventory-alerts
      └─ feature/orders-hr
```

### ✅ 2. 각자 개발할 업무 범위
각 페이지 개발자는 본인이 담당한 페이지의 모든 업무를 담당합니다.

### ① API 설계 및 Axios 연동

- API URL, HTTP 메서드(GET, POST 등) 설계 (백엔드 개발자와 협의) Axios 기반 API 요청 로직 구현
### ② Zustand 상태 관리(store) 설계

- API에서 받아온 데이터를 Zustand를 통해 상태로 저장 및 관리 (상태 모델 설계)
### ③ UI 페이지 설계 및 구현

- React 페이지 구현 및 Tailwind CSS를 이용한 스타일링


### ✅ 3. 컴포넌트 공동 제작 (개발 초기)
페이지 개발 시작 전, 모든 개발자(배연준 포함)가 협력하여 공통 컴포넌트를 제작합니다.

공통 컴포넌트 예시: 버튼, 인풋 폼, 모달, 테이블 등
작업 디렉토리: `src/components/`
