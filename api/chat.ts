import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { SYSTEM_PROMPT } from './constants';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // API Key는 오직 서버 환경 변수 OPENAI_API_KEY에서만 읽음 (프런트엔드 노출 원천 차단)
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error:
          '서버 환경 변수 OPENAI_API_KEY가 설정되지 않았습니다. Vercel의 Environment Variables 또는 프로젝트 루트의 .env.local에 API 키를 설정해 주세요.',
      });
    }

    const { messages } = req.body || {};

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: '유효한 messages 배열이 필요합니다.' });
    }

    const client = new OpenAI({ apiKey });

    // OpenAI Responses API 호출
    // 모델: gpt-6-luna
    // System Prompt: SYSTEM_PROMPT 상수 사용
    // reasoning.effort: 'none'
    const response = await client.responses.create({
      model: 'gpt-6-luna' as any,
      instructions: SYSTEM_PROMPT,
      reasoning: {
        effort: 'none' as any,
      },
      input: messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })) as any,
    });

    let replyText = response.output_text ?? '';

    // output_text fallback
    if (!replyText && (response as any).output && Array.isArray((response as any).output)) {
      for (const item of (response as any).output) {
        if (item.content && Array.isArray(item.content)) {
          for (const part of item.content) {
            if (part.text) replyText += part.text;
          }
        }
      }
    }

    return res.status(200).json({
      text: replyText,
      id: response.id,
      model: response.model ?? 'gpt-6-luna',
      usage: response.usage,
    });
  } catch (error: any) {
    console.error('OpenAI Responses API Handler Error:', error);
    return res.status(error.status || 500).json({
      error: error.message || 'OpenAI Responses API 호출 중 오류가 발생했습니다.',
      details: error.error || error,
    });
  }
}
