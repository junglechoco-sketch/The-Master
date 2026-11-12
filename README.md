# VocaQuiz - 영어 단어 & 복습 퀴즈 챗봇 (Vite + React + TypeScript)

사용자가 원하는 **주제**나 **난이도**를 입력하면, 관련 핵심 영어 단어를 **최대 3개** 알려주고 뜻과 짧은 예문을 보여준 뒤, 마지막에 **1개의 복습 퀴즈**를 출제해 주는 챗봇 서비스입니다.

---

## 🎯 챗봇 동작 규칙

1. **간결한 한국어 답변**: 불필요한 군더더기 없이 깔끔하고 간결하게 설명합니다.
2. **단어 최대 3개**: 한 번에 과도한 단어를 제시하지 않고 핵심 단어 최대 3개만 엄선합니다.
3. **뜻 & 짧은 예문 필수**: 각 단어의 품사, 뜻, 실생활 예문 및 한국어 해석을 함께 제공합니다.
4. **복습 퀴즈 1문제**: 답변 끝에 방금 소개한 단어를 활용한 복습 퀴즈를 딱 1문제 출제합니다.
5. **정보 확인**: 사용자가 주제나 난이도를 말하지 않으면 필요한 정보를 먼저 정중히 되물어봅니다.

---

## 📁 파일 구조

```text
├── api/
│   ├── constants.ts         # ⭐ 서버 측 System Prompt 상수 분리 (규칙 및 튜터 지침)
│   └── chat.ts              # Vercel Serverless Function (gpt-6-luna Responses API)
├── src/
│   ├── api/
│   │   └── chat.ts          # ⭐ 프런트엔드 전용 API 호출 모듈 (sendChatMessage)
│   ├── components/
│   │   └── Chatbot.tsx      # ⭐ 챗봇 메인 UI 컴포넌트
│   ├── App.tsx              # Chatbot 렌더링 진입점
│   ├── index.css            # 글로벌 다크 테마 스타일
│   ├── main.tsx             # React 마운트
│   └── vite-env.d.ts        # 타입 정의
├── .env.example             # 환경 변수 템플릿
├── .env.local               # ⭐ 로컬 개발용 API Key 파일 (git 추적 제외)
├── vercel.json              # Vercel 배포 및 라우팅 설정
├── vite.config.ts           # 로컬 개발용 /api/chat 미들웨어 및 Vite 빌드 설정
└── package.json
```

---

## 🚀 빠른 시작 가이드

### 1. API Key 입력
프로젝트 루트의 `.env.local` 파일을 열고 발급받으신 OpenAI API Key를 입력합니다:
```env
OPENAI_API_KEY=sk-proj-...
```

### 2. 로컬 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:5173`으로 접속하면, 로컬 Vite 서버가 `.env.local`의 키를 읽어 `/api/chat` 요청을 OpenAI Responses API(`gpt-6-luna`, `reasoning.effort: "none"`)로 안전하게 전달합니다.

---

## ☁️ Vercel 배포 안내

1. GitHub 레포지토리에 프로젝트를 푸시합니다.
2. Vercel 대시보드에서 프로젝트를 임포트하고 **Environment Variables**에 다음을 등록합니다:
   - `OPENAI_API_KEY`: 사용자의 OpenAI API Key
3. 배포가 완료되면 프런트엔드와 `api/chat.ts` 서버리스 함수가 자동으로 연동됩니다.
