# 📌 ERP 프로젝트 개발 역할 분담 및 진행 가이드라인

## 🚀 개발 스택

- **프론트엔드**: Vite + React + TypeScript + Zustand + Tailwind CSS
- **백엔드**: Django REST Framework (DRF)
- **상태 관리**: Zustand
- **API 통신**: Axios

---

## 📌 개발자 역할 분담

각 담당자는 본인이 맡은 페이지의 아래 3가지 작업을 모두 책임지고 개발합니다.

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

