import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, MessageCircle, RefreshCw, Heart } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { streamChat } from '../utils/api'

const SYSTEM_PROMPT = `You are Florence Appingale Coach — a warm, supportive, and knowledgeable study companion for a nursing student working toward her B.S. in Nursing. Your role is to:

1. **Motivate and encourage** — nursing school is genuinely hard. Acknowledge real struggles without minimizing them. Be honest, warm, and real — not performatively cheerful.
2. **Help with clinical debriefs** — when she's had a hard clinical day, help her process it, find the learning, and rebuild confidence. Growth comes from difficult experiences.
3. **Support through difficult topics** — if she's stuck on pharmacology, patho, or any concept, explain it in plain language using analogies and clinical context.
4. **Study strategy coach** — suggest concrete study techniques, mnemonics, or frameworks on request.
5. **Emotional support** — this is a marathon. Validate feelings of exhaustion, self-doubt, and overwhelm. Help her reconnect to her "why."

Tone: warm, direct, encouraging, occasionally funny. Treat her like a smart adult who chose a hard path on purpose.
NEVER be preachy, generic, or use toxic positivity. Be real. Keep responses concise unless she asks for detail.`

const QUICK_PROMPTS = [
  { emoji: '🏥', text: 'I just had a really rough clinical. Help me decompress.' },
  { emoji: '😰', text: "I'm feeling overwhelmed and don't know where to start." },
  { emoji: '⚡', text: "Give me a motivational boost — I'm losing steam." },
  { emoji: '💙', text: 'Help me remember why I chose nursing.' },
  { emoji: '📝', text: 'I bombed a quiz. What should I do?' },
  { emoji: '💊', text: "I can't seem to memorize drug names. Any tricks?" },
  { emoji: '⏱', text: 'Talk me through a Pomodoro study session right now.' },
  { emoji: '🛌', text: "I'm burnt out. Is it okay to take a rest day?" },
]

function MarkdownText({ text }) {
  const html = text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
  return (
    <div
      className="chat-message text-sm leading-relaxed"
      dangerouslySetInnerHTML={{ __html: `<p>${html}</p>` }}
    />
  )
}

function buildSystem({ studentName, todayCheckin, learningProfile }) {
  const parts = [SYSTEM_PROMPT]
  if (studentName) parts.push(`\nThe student's name is ${studentName}.`)
  if (todayCheckin) {
    parts.push(`\nToday's wellness: Mental ${todayCheckin.mental}/10, Physical ${todayCheckin.physical}/10.${todayCheckin.notes ? ` Her note: "${todayCheckin.notes}"` : ''}`)
  }
  if (learningProfile?.weakAreas) parts.push(`\nAreas she finds challenging: ${learningProfile.weakAreas}`)
  if (learningProfile?.howILearn)  parts.push(`\nHow she learns: ${learningProfile.howILearn.slice(0, 300)}`)
  return parts.join('')
}

export default function MotivationalChat() {
  const { studentName, todayCheckin, learningProfile } = useApp()
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError]       = useState('')
  const bottomRef  = useRef()
  const inputRef   = useRef()
  const abortRef   = useRef()

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function sendMessage(text) {
    if (!text.trim() || streaming) return
    setError('')
    const userMsg = { role: 'user', content: text.trim() }
    const updatedMsgs = [...messages, userMsg]
    setMessages(updatedMsgs)
    setInput('')
    setStreaming(true)
    const assistantIndex = updatedMsgs.length
    setMessages(m => [...m, { role: 'assistant', content: '' }])

    const controller = new AbortController()
    abortRef.current = controller

    try {
      let accumulated = ''
      await streamChat({
        system: buildSystem({ studentName, todayCheckin, learningProfile }),
        messages: updatedMsgs.map(m => ({ role: m.role, content: m.content })),
        signal: controller.signal,
        onChunk: text => {
          accumulated += text
          setMessages(m => {
            const copy = [...m]
            copy[assistantIndex] = { role: 'assistant', content: accumulated }
            return copy
          })
        },
      })
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(`Connection error: ${err.message}`)
        setMessages(m => m.slice(0, -1))
      }
    } finally {
      setStreaming(false)
    }
  }

  function clearChat() {
    if (streaming) abortRef.current?.abort()
    setMessages([]); setError('')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>

      {/* Header */}
      <div className="flex-shrink-0 px-4 md:px-8 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0d2137, #0074a4)' }}>
              <Heart className="w-4 h-4 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-900 text-sm">Florence Appingale Coach</p>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: '#ecfdf5', color: '#059669' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Online
                </div>
              </div>
              <p className="text-slate-400 text-xs">Your personal nursing study coach</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button onClick={clearChat} className="btn-ghost text-xs py-1.5 px-3">
              <RefreshCw className="w-3.5 h-3.5" /> New Chat
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-5">
        <div className="max-w-3xl mx-auto">

          {/* Welcome */}
          {messages.length === 0 && (
            <div className="text-center py-6 md:py-10">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #0d2137, #0074a4)' }}>
                <MessageCircle className="w-7 h-7 text-sky-300" />
              </div>
              <h2 className="font-bold text-slate-900 text-lg mb-1">
                Hey{studentName ? `, ${studentName}` : ''}! I'm your Florence Appingale Coach.
              </h2>
              <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                I'm here to help you stay motivated, decompress after tough clinical days, work through hard concepts, and remind you how far you've come.
              </p>

              {/* Quick prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 text-left">
                {QUICK_PROMPTS.map(({ emoji, text }) => (
                  <button
                    key={text}
                    onClick={() => sendMessage(text)}
                    className="flex items-start gap-3 text-sm text-slate-600 bg-white hover:bg-slate-50 px-4 py-3 rounded-xl text-left transition-colors"
                    style={{ border: '1px solid #e2e8f0' }}
                  >
                    <span className="text-base flex-shrink-0">{emoji}</span>
                    <span className="leading-snug">{text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message thread */}
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex items-end gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg flex-shrink-0 mb-1 flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #0d2137, #0074a4)' }}>
                    <Heart className="w-3.5 h-3.5 text-sky-300" />
                  </div>
                )}
                <div className={`max-w-[82%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'text-white rounded-br-sm'
                    : 'bg-white text-slate-800 rounded-bl-sm'
                }`}
                  style={msg.role === 'user'
                    ? { background: 'linear-gradient(135deg, #0074a4, #0091cd)', boxShadow: '0 2px 8px rgba(0,145,205,0.3)' }
                    : { border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }
                  }>
                  {msg.role === 'user' ? (
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  ) : msg.content ? (
                    <MarkdownText text={msg.content} />
                  ) : (
                    <div className="flex items-center gap-1 py-1">
                      {[0, 150, 300].map(d => (
                        <span key={d} className="w-2 h-2 rounded-full bg-slate-300 animate-bounce"
                          style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-4 text-sm px-4 py-3 rounded-xl"
              style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 md:px-8 py-4 bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto flex gap-3">
          <textarea
            ref={inputRef}
            className="input flex-1 resize-none py-3"
            rows={2}
            placeholder="Tell me what's on your mind…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
            className="btn-primary px-4 py-2 self-end flex-shrink-0"
          >
            {streaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-xs text-slate-400 text-center mt-2">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
