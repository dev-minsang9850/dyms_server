# DYMS Server (Backend)

덕영고등학교 교내 메신저 서비스(DYMS)의 백엔드 서버입니다. NestJS 프레임워크와 PostgreSQL을 사용하여 구축되었습니다.

## 기술 스택
- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL (TypeORM)
- **Authentication**: JWT (JSON Web Tokens)
- **Push Notifications**: Expo Push API

## 사전 준비 (Prerequisites)
- [Node.js](https://nodejs.org/) (v18 이상 권장)
- [pnpm](https://pnpm.io/) 패키지 매니저
- PostgreSQL 데이터베이스 (Supabase 등 활용 가능)

## 환경 변수 설정 (Environment Variables)

프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 아래의 환경 변수들을 설정해야 합니다.

```env
# Server Configuration
PORT=3000

# Admin Seed Credentials (초기 관리자 계정 생성용)
ADMIN_EMAIL=admin@dyhs.kr
ADMIN_PASSWORD=your_secure_password

# JWT Authentication Secret Key
JWT_SECRET=your_jwt_secret_key

# Database Configuration (PostgreSQL)
DB_HOST=your_db_host
DB_PORT=6543
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_DATABASE=postgres

# Supabase (Optional, if using Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

## 설치 및 실행 (Installation & Running)

```bash
# 1. 의존성 설치
$ pnpm install

# 2. 로컬 개발 서버 실행 (Watch mode)
$ pnpm run start:dev

# 3. 프로덕션 빌드
$ pnpm run build

# 4. 프로덕션 서버 실행
$ pnpm run start:prod
```

## 주요 기능
- **사용자 관리**: 학적 정보(학생/교직원) 기반 사용자 인증 및 관리
- **실시간 채팅**: WebSocket을 통한 실시간 1:1 및 그룹 채팅 지원
- **푸시 알림**: Expo Push API를 연동한 모바일 푸시 알림 전송
- **파일 업로드**: 프로필 사진 및 채팅 이미지 업로드 처리 (최대 10MB)
