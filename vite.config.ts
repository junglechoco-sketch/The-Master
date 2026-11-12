import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';
import { SYSTEM_PROMPT } from './api/constants';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'local-responses-api-dev-server',
        configureServer(server) {
          server.middlewares.use('/api/chat', (req: IncomingMessage, res: ServerResponse) => {
            if (req.method === 'OPTIONS') {
              res.statusCode = 200;
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
              res.end();
              return;
            }

            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
              return;
            }

            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });

            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body || '{}');
                // API 키는 오직 서버 환경 변수에서만 읽음 (.env.local 또는 process.env)
                const apiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;

                if (!apiKey) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(
                    JSON.stringify({
                      error:
                        '서버 환경 변수 OPENAI_API_KEY가 설정되지 않았습니다. 프로젝트 루트의 .env.local 파일에 OPENAI_API_KEY=sk-... 를 입력해 주세요.',
                    })
                  );
                  return;
                }

                // OpenAI Responses API 호출
                // model: gpt-6-luna
                // instructions: SYSTEM_PROMPT 상수 사용
                // reasoning: { effort: 'none' }
                const response = await fetch('https://api.openai.com/v1/responses', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                  },
                  body: JSON.stringify({
                    model: 'gpt-6-luna',
                    instructions: SYSTEM_PROMPT,
                    reasoning: {
                      effort: 'none',
                    },
                    input: parsed.messages.map((m: { role: string; content: string }) => ({
                      role: m.role,
                      content: m.content,
                    })),
                  }),
                });

                const data = (await response.json()) as any;

                if (!response.ok) {
                  res.statusCode = response.status;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(
                    JSON.stringify({
                      error: data.error?.message || 'OpenAI API 호출 중 오류가 발생했습니다.',
                      details: data,
                    })
                  );
                  return;
                }

                let replyText = data.output_text ?? '';
                if (!replyText && data.output && Array.isArray(data.output)) {
                  for (const item of data.output) {
                    if (item.content && Array.isArray(item.content)) {
                      for (const part of item.content) {
                        if (part.text) replyText += part.text;
                      }
                    }
                  }
                }

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    text: replyText,
                    id: data.id,
                    model: data.model ?? 'gpt-6-luna',
                    usage: data.usage,
                  })
                );
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message || '서버 오류가 발생했습니다.' }));
              }
            });
          });
        },
      },
    ],
  };
});
