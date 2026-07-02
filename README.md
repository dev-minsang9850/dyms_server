# DYMS Backend Server

이 저장소는 덕영고등학교 메신저(DYMS)의 백엔드(NestJS) 소스 코드를 포함하고 있습니다.
서버를 처음 클론(Clone)하여 설정하는 개발자를 위한 가이드입니다.

## ⚙️ 초기 설정 방법 (Getting Started)

### 1. 패키지 설치
Node.js(v18 이상 권장)가 설치되어 있는지 확인한 후, 다음 명령어를 실행하여 의존성을 설치합니다.
```bash
npm install
```

### 2. 환경 변수 설정 (`.env`)
저장소를 클론한 후, 프로젝트 루트 디렉토리에 `.env` 파일을 직접 생성해야 합니다.
미리 만들어진 `.env.example` 파일을 복사하여 사용할 수 있습니다.

```bash
cp .env.example .env
```
생성된 `.env` 파일을 열어 `JWT_SECRET`, `DB_PASSWORD`, `ADMIN_PASSWORD` 등 실제 운영(또는 개발) 환경에 맞는 데이터베이스 및 암호화 키 값으로 수정해 주세요.

### 3. Firebase 서비스 계정 키 설정
푸시 알림(FCM) 등 Firebase 연동을 위해 서비스 계정 키 파일이 필요합니다.
보안상 이 파일은 깃허브에 올라가지 않습니다.
1. `firebase-service-account.example.json` 파일을 복사하여 `firebase-service-account.json` 파일을 만듭니다.
```bash
cp firebase-service-account.example.json firebase-service-account.json
```
2. 파이어베이스 콘솔(Firebase Console) -> 프로젝트 설정 -> 서비스 계정에서 **'새 비공개 키 생성'**을 눌러 다운로드 받은 `.json` 파일의 내용을 `firebase-service-account.json` 파일에 덮어씁니다.

---

## 🚀 실행 방법

### 로컬 개발 환경 실행
```bash
# 개발 모드로 실행 (코드가 변경되면 자동으로 재시작됩니다)
npm run start:dev
```

### 프로덕션(운영) 환경 빌드 및 실행
실제 서버에 배포할 때는 빌드 과정을 거친 후 PM2와 같은 프로세스 매니저를 사용하여 무중단 실행하는 것을 권장합니다.
```bash
# 1. 빌드
npm run build

# 2. 실행 (PM2 사용 예시)
pm2 start dist/main.js --name "dyms-server"
```

---

## 🔒 보안 주의 사항
- `.env` 파일과 `firebase-service-account.json` 파일은 절대 깃허브나 외부 저장소에 업로드(Commit)되면 안 됩니다. (현재 `.gitignore`에 등록되어 안전합니다.)
- 운영 서버에 배포 시, `src/main.ts` 파일의 **CORS (Cross-Origin Resource Sharing)** 설정을 확인하여, 승인되지 않은 외부 도메인의 접근을 차단하세요.
