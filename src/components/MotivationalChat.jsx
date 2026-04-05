import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, MessageCircle, Sparkles, RefreshCw } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { streamChat } from '../utils/api'

const SYSTEM_PROMPT = `You are Florence Appingale Coach — a warm, supportive, and knowledgeable study companion for a nursing student working toward her B.S. in Nursing. Your role is to:

1. **Motivate and encourage** — nursing school is genuinely hard. Acknowledge real struggles without minimizing them. Be honest, warm, and real — not performatively cheerful.
2. **Help with clinical debriefs** — when she's had a hard clinical day, help her process it, find the learning, and rebuild confidence. Always remind her that growth comes from difficult experiences.
3. **Support through difficult topics** — if she's stuck on pharmacology, patho, or any concept, help her understand it in plain language using analogies and clinical context.
4. **Study strategy coach** — suggest concrete study techniques, mnemonics, or frameworks on request.
5. **Emotional support** — this program is a marathon. Validate feelings of exhaustion, self-doubt, and overwhelm. Help her reconnect to her "why."

Tone: warm, direct, encouraging, occasionally funny. Treat her like a smart adult who chose a hard path on purpose.

NEVER be preachy, generic, or over-cheerful. Do NOT use toxic positivity. Be real.
Keep responses concise unless she asks for detail. Use plain language — avoid over-formatting in casual chat.`

const QUICK_PROMPTS = [
  "I just had a really rough clinical. Help me decompress.",
  "I'm feeling overwhelmed and don't know where to start.",
  "Give me a motivational boost — I'm losing steam.",
  "Help me remember why I chose nursing.",
  "I bombed a quiz. What should I do?",
  "I can't seem to memorize drug names. Any tricks?",
  "Talk me through a Pomodoro study session right now.",
  "I'm burnt out. Is it okay to take a rest day?",
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

export default function MotivationalChat() {
  const { studentName, todayCheckin, learningProfile } = useApp()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef()
  const inputRef = useRef()
  const abortRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text) {
    if (!text.trim() || streaming) return
    setError('')
    const userMsg = { role: 'user', content: text.trim() }
    const updatedMsgs = [...messages, userMsg]
    setMessages(updatedMsgs)
    setInput('')
    setStreaming(true)

    // Start assistant placeholder
    const assistantIndex = updatedMsgs.length
    setMessages(m => [...m, { role: 'assistant', content: '' }])

    const controller = new AbortController()
    abortRef.current = controller

    try {
      let accumulated = ''
      await streamChat({
        system: buildSystemWithContext({ studentName, todayCheckin, learningProfile }),
        messages: updatedMsgs.map(m => ({ role: m.role, content: m.content })),
        signal: controller.signal,
        onChunk: (text) => {
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
    setMessages([])
    setError('')
    inputRef.current?.focus()
  }

  const showQuickPrompts = messages.length === 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-5 border-b border-slate-200 bg-white flex-shrink-0">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-brand-500" />
              Motivational Chat
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Your Florence Appingale coach — always in your corner.</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg"
            >
              <RefreshCw className="w-3.5 h-3.5" /> New Chat
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Welcome */}
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-brand-600" />
              </div>
              <h2 className="font-semibold text-slate-800 mb-1">
                Hey{studentName ? `, ${studentName}` : ''}! I'm your Florence Appingale Coach.
              </h2>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                I'm here to help you stay motivated, decompress after tough clinical days, work through hard concepts, and remind you how far you've come.
              </p>
            </div>
          )}

          {/* Quick prompts */}
          {showQuickPrompts && (
            <div className="grid grid-cols-2 gap-2 mt-4">
              {QUICK_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left text-sm text-slate-600 bg-white border border-slate-200 hover:border-brand-300 hover:text-brand-700 px-4 py-3 rounded-xl transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center mr-2.5 flex-shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-brand-600 text-white rounded-br-md'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md'
              }`}>
                {msg.role === 'user' ? (
                  <p className="text-sm">{msg.content}</p>
                ) : msg.content ? (
                  <MarkdownText text={msg.content} />
                ) : (
                  <div className="flex items-center gap-1.5 py-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>
            </div>
          ))}

          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="px-8 py-5 border-t border-slate-200 bg-white flex-shrink-0">
        <div className="max-w-3xl mx-auto flex gap-3">
          <textarea
            ref={inputRef}
            className="flex-1 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            rows={2}
            placeholder="Tell me what's on your mind…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(input)
              }
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
            className="bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 text-white px-4 rounded-xl transition-colors flex items-center"
          >
            {streaming
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <Send className="w-5 h-5" />
            }
          </button>
        </div>
        <p className="text-xs text-slate-400 text-center mt-2">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}

function buildSystemWithContext({ studentName, todayCheckin, learningProfile }) {
  const parts = [SYSTEM_PROMPT]
  if (studentName) parts.push(`\nThe student's name is ${studentName}.`)
  if (todayCheckin) {
    parts.push(`\nToday's check-in: Mental ${todayCheckin.mental}/10, Physical ${todayCheckin.physical}/10.${todayCheckin.notes ? ` Her note: "${todayCheckin.notes}"` : ''}`)
  }
  if (learningProfile?.weakAreas) {
    parts.push(`\nAreas she finds challenging: ${learningProfile.weakAreas}`)
  }
  if (learningProfile?.howILearn) {
    parts.push(`\nHow she learns: ${learningProfile.howILearn.slice(0, 300)}`)
  }
  return parts.join('')
}
