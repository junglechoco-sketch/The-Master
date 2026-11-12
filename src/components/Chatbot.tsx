import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  BookOpen,
  Trash2,
  Copy,
  Check,
  Cpu,
  Zap,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Volume2,
  VolumeX,
  Compass,
  HelpCircle,
} from 'lucide-react';
import { sendChatMessage, type ChatMessage } from '../api/chat';

const TOPICS = [
  { id: 'travel', label: '✈️ 여행', prompt: '여행' },
  { id: 'business', label: '💼 비즈니스', prompt: '비즈니스' },
  { id: 'tech', label: '💻 IT/기술', prompt: 'IT 및 프로그래밍' },
  { id: 'daily', label: '☕ 일상 대화', prompt: '일상 대화' },
  { id: 'dining', label: '🍕 음식/식당', prompt: '음식 및 식당 주문' },
  { id: 'health', label: '🩺 건강/의료', prompt: '건강 및 병원' },
];

const LEVELS = [
  { id: 'beginner', label: '🟢 초급', desc: '기초 어휘' },
  { id: 'intermediate', label: '🟡 중급', desc: '실생활 어휘' },
  { id: 'advanced', label: '🔴 고급', desc: '고급 표현' },
];

export default function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        '안녕하세요! 영어 단어 퀴즈 챗봇입니다 🎓\n\n학습하고 싶은 **주제**(예: 여행, 비즈니스, 일상 등)나 **난이도**(초급, 중급, 고급 등)를 편하게 알려주세요!\n\n원하시는 조건을 말씀해 주시면, 딱 맞는 **영어 단어 3개**와 실생활 예문, 그리고 마지막에 **복습 퀴즈 1문제**를 내드릴게요.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('travel');
  const [selectedLevel, setSelectedLevel] = useState<string>('beginner');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (customPrompt?: string) => {
    const text = (customPrompt ?? input).trim();
    if (!text || isLoading) return;

    setErrorMessage(null);
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setIsLoading(true);

    try {
      // src/api/chat.ts 모듈을 통해 서버리스 함수(/api/chat) 호출
      const replyText = await sendChatMessage(updatedMessages);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: replyText || '(응답이 반환되지 않았습니다.)',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMessage(err.message || '네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 선택한 주제와 난이도로 바로 단어 요청
  const handleQuickRequest = (topicId?: string, levelId?: string) => {
    const t = TOPICS.find((item) => item.id === (topicId ?? selectedTopic)) || TOPICS[0];
    const l = LEVELS.find((item) => item.id === (levelId ?? selectedLevel)) || LEVELS[0];

    const prompt = `${t.prompt} 주제로 ${l.label} 난이도의 영어 단어를 알려줘!`;
    handleSendMessage(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  const copyToClipboard = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // 영어 발음 TTS 읽기
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('브라우저가 음성 재생(TTS)을 지원하지 않습니다.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleClearHistory = () => {
    if (window.confirm('대화 기록을 모두 지우시겠습니까?')) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      setMessages([]);
      setErrorMessage(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: '1020px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(6, 182, 212, 0.35)',
            }}
          >
            <BookOpen size={22} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.3px' }}>VocaQuiz 챗봇</h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(6, 182, 212, 0.15)',
                  color: '#22d3ee',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                }}
              >
                단어 3개 + 퀴즈 1개
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Cpu size={12} color="#818cf8" /> gpt-6-luna (Responses API)
              </span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Zap size={12} color="#10b981" /> reasoning.effort: none
              </span>
            </div>
          </div>
        </div>

        {/* Action Status & Clear */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '12px',
              fontWeight: '500',
            }}
            title="API Key는 프런트엔드에 노출되지 않으며, 서버의 OPENAI_API_KEY 환경 변수에서 안전하게 관리됩니다."
          >
            <ShieldCheck size={15} />
            <span className="desktop-only">서버 환경 변수 보호 중</span>
          </div>

          <button
            onClick={handleClearHistory}
            title="대화 지우기"
            style={{
              padding: '8px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </header>

      {/* Topic & Level Quick Selector */}
      <div
        style={{
          padding: '10px 20px',
          backgroundColor: 'var(--bg-tertiary)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <Compass size={14} color="#6366f1" />
            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>주제:</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {TOPICS.map((topic) => {
              const isSelected = selectedTopic === topic.id;
              return (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '14px',
                    fontSize: '12px',
                    fontWeight: isSelected ? '600' : '400',
                    backgroundColor: isSelected ? 'var(--accent-color)' : 'var(--bg-secondary)',
                    color: isSelected ? '#fff' : 'var(--text-secondary)',
                    border: `1px solid ${isSelected ? 'var(--accent-color)' : 'var(--border-color)'}`,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {topic.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <HelpCircle size={14} color="#10b981" />
            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>난이도:</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            {LEVELS.map((level) => {
              const isSelected = selectedLevel === level.id;
              return (
                <button
                  key={level.id}
                  onClick={() => setSelectedLevel(level.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '14px',
                    fontSize: '12px',
                    fontWeight: isSelected ? '600' : '400',
                    backgroundColor: isSelected ? '#10b981' : 'var(--bg-secondary)',
                    color: isSelected ? '#fff' : 'var(--text-secondary)',
                    border: `1px solid ${isSelected ? '#10b981' : 'var(--border-color)'}`,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {level.label}
                </button>
              );
            })}

            <button
              onClick={() => handleQuickRequest()}
              disabled={isLoading}
              style={{
                marginLeft: '6px',
                padding: '4px 12px',
                borderRadius: '14px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                color: '#a5b4fc',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              ⚡ 단어 3개 & 퀴즈 1개 받기
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <div
              key={message.id}
              style={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                gap: '12px',
              }}
            >
              {!isUser && (
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--accent-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  <BookOpen size={18} color="#fff" />
                </div>
              )}

              <div
                style={{
                  maxWidth: '82%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isUser ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    backgroundColor: isUser ? 'var(--user-bubble)' : 'var(--assistant-bubble)',
                    padding: '14px 18px',
                    borderRadius: '14px',
                    borderTopRightRadius: isUser ? '2px' : '14px',
                    borderTopLeftRadius: !isUser ? '2px' : '14px',
                    border: `1px solid ${isUser ? 'rgba(99, 102, 241, 0.3)' : 'var(--border-color)'}`,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontSize: '14.5px',
                    lineHeight: '1.65',
                  }}
                >
                  {message.content}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginTop: '4px',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    padding: '0 4px',
                  }}
                >
                  <span>{message.timestamp}</span>
                  {!isUser && (
                    <>
                      <button
                        onClick={() => speakText(message.content)}
                        style={{
                          color: isSpeaking ? '#38bdf8' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                        title="영어 발음 듣기 (TTS)"
                      >
                        {isSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
                        <span>{isSpeaking ? '음성 정지' : '발음 듣기'}</span>
                      </button>

                      <button
                        onClick={() => copyToClipboard(message.id, message.content)}
                        style={{
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                        title="텍스트 복사"
                      >
                        {copiedId === message.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                        {copiedId === message.id && <span style={{ color: '#10b981' }}>복사됨</span>}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading */}
        {isLoading && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                backgroundColor: 'var(--accent-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <RefreshCw size={16} color="#fff" style={{ animation: 'spin 1.5s linear infinite' }} />
            </div>
            <div
              style={{
                backgroundColor: 'var(--assistant-bubble)',
                padding: '12px 18px',
                borderRadius: '14px',
                borderTopLeftRadius: '2px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-secondary)',
                fontSize: '13.5px',
              }}
            >
              <span>단어 3개와 퀴즈 1개를 준비하고 있습니다...</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              padding: '12px 16px',
              color: '#f87171',
              fontSize: '13px',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => handleSendMessage()}
              style={{
                color: '#f87171',
                textDecoration: 'underline',
                fontSize: '12px',
                fontWeight: '600',
              }}
            >
              다시 시도
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Quick Action Suggestion Chips */}
      <div
        style={{
          padding: '6px 20px 0 20px',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          backgroundColor: 'var(--bg-secondary)',
        }}
      >
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
          💡 바로 질문하기:
        </span>
        {[
          '여행 초급 단어 알려줘',
          '비즈니스 중급 단어 알려줘',
          '일상 대화 고급 단어 알려줘',
          '퀴즈 1번 정답 채점해 줘!',
        ].map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(chip)}
            style={{
              padding: '3px 10px',
              borderRadius: '12px',
              fontSize: '11.5px',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              whiteSpace: 'nowrap',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.borderColor = 'var(--accent-color)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Footer */}
      <footer
        style={{
          padding: '12px 20px 16px 20px',
          backgroundColor: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '10px',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '8px 12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          }}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder="주제나 난이도를 말씀하시거나 퀴즈 답을 입력해 주세요 (예: 여행 초급 단어 알려줘)..."
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '14.5px',
              resize: 'none',
              maxHeight: '180px',
              lineHeight: '1.5',
              padding: '4px 0',
            }}
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            style={{
              backgroundColor: input.trim() && !isLoading ? 'var(--accent-color)' : 'var(--bg-tertiary)',
              color: input.trim() && !isLoading ? '#ffffff' : 'var(--text-muted)',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
            }}
          >
            <Send size={18} />
          </button>
        </form>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '8px',
            padding: '0 4px',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}
        >
          <span>OpenAI Responses API • Model: <b>gpt-6-luna</b> (effort: none)</span>
          <span>단어 최대 3개 • 퀴즈 1개 • 간결한 한국어 답변</span>
        </div>
      </footer>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

