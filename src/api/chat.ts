/**
 * 프런트엔드 API 호출 모듈 (src/api/chat.ts)
 * 브라우저에서는 오직 /api/chat 엔드포인트만 호출하며,
 * 실제 OpenAI API 호출 및 API Key 관리는 서버리스 함수(api/chat.ts)에서 안전하게 수행됩니다.
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatApiResponse {
  text: string;
  id?: string;
  model?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

/**
 * /api/chat 엔드포인트로 메시지 목록을 전송하고 AI 답변을 반환받습니다.
 */
export async function sendChatMessage(messages: ChatMessage[]): Promise<string> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '답변을 불러오는 중 오류가 발생했습니다.');
  }

  return data.text || '';
}

