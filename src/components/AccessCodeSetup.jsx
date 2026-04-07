import { useState } from 'react'
import { Stethoscope, RefreshCw, LogIn, Copy, CheckCircle2 } from 'lucide-react'
import { useApp } from '../context/AppContext'

function randomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export default function AccessCodeSetup() {
  const { setAccessCode } = useApp()
  const [mode, setMode]       = useState(null) // null | 'new' | 'existing'
  const [generated, setGenerated] = useState(() => randomCode())
  const [input, setInput]     = useState('')
  const [copied, setCopied]   = useState(false)
  const [error, setError]     = useState('')

  function handleNew() {
    setAccessCode(generated)
  }

  function handleExisting() {
    const code = input.trim()
    if (code.length < 4) { setError('Code must be at least 4 characters.'); return }
    setAccessCode(code)
  }

  function copyCode() {
    navigator.clipboard.writeText(generated).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(160deg, #060f1a 0%, #0d2137 50%, #0a3352 100%)' }}>

      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <Stethoscope className="w-6 h-6 text-teal-300" />
        </div>
        <div>
          <p className="text-white text-xl font-bold">Florence Appingale</p>
          <p className="text-sky-300 text-xs">Nursing Study Companion</p>
        </div>
      </div>

      <div className="w-full max-w-sm">
        {!mode ? (
          /* ── Choose mode ── */
          <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h1 className="text-white text-xl font-bold text-center mb-1">Sync Your Data</h1>
            <p className="text-sky-200 text-sm text-center mb-6">
              Your study data syncs across devices using a personal access code. No account needed.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => setMode('new')}
                className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all"
                style={{ background: '#0091cd', color: 'white' }}
              >
                🆕 &nbsp; I'm new — create my code
              </button>
              <button
                onClick={() => setMode('existing')}
                className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <LogIn className="w-4 h-4 inline mr-2 -mt-0.5" />
                I have a code — sign in
              </button>
            </div>
          </div>

        ) : mode === 'new' ? (
          /* ── New user: show generated code ── */
          <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={() => setMode(null)} className="text-sky-300 text-xs mb-4 flex items-center gap-1">
              ← Back
            </button>
            <h1 className="text-white text-xl font-bold mb-1">Your Access Code</h1>
            <p className="text-sky-200 text-sm mb-5">
              Write this down or screenshot it. Enter this same code on any other device to sync your data.
            </p>

            <div className="rounded-xl p-5 text-center mb-2"
              style={{ background: 'rgba(0,145,205,0.15)', border: '2px solid rgba(0,145,205,0.4)' }}>
              <p className="text-4xl font-bold tracking-[0.3em] text-white">{generated}</p>
            </div>

            <div className="flex gap-2 mb-5">
              <button
                onClick={copyCode}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ background: 'rgba(255,255,255,0.08)', color: copied ? '#10b981' : '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={() => setGenerated(randomCode())}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <RefreshCw className="w-4 h-4" /> New code
              </button>
            </div>

            <button
              onClick={handleNew}
              className="w-full py-3.5 rounded-xl font-semibold text-sm"
              style={{ background: '#059669', color: 'white' }}
            >
              ✓ &nbsp; I've saved it — let's go
            </button>
          </div>

        ) : (
          /* ── Existing user: enter code ── */
          <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={() => { setMode(null); setError('') }} className="text-sky-300 text-xs mb-4 flex items-center gap-1">
              ← Back
            </button>
            <h1 className="text-white text-xl font-bold mb-1">Enter Your Code</h1>
            <p className="text-sky-200 text-sm mb-5">Enter the access code from your other device to load your data.</p>

            <input
              type="text"
              className="w-full rounded-xl px-4 py-3.5 text-center text-2xl font-bold tracking-[0.3em] mb-3 outline-none"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: error ? '2px solid #ef4444' : '2px solid rgba(255,255,255,0.2)' }}
              placeholder="······"
              value={input}
              onChange={e => { setInput(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleExisting()}
              maxLength={12}
              autoFocus
            />

            {error && <p className="text-red-400 text-xs text-center mb-3">{error}</p>}

            <button
              onClick={handleExisting}
              disabled={!input.trim()}
              className="w-full py-3.5 rounded-xl font-semibold text-sm disabled:opacity-40"
              style={{ background: '#0091cd', color: 'white' }}
            >
              Load My Data →
            </button>
          </div>
        )}

        <p className="text-center text-slate-500 text-xs mt-6">
          Your data is encrypted in transit and stored securely. No personal info required.
        </p>
      </div>
    </div>
  )
}
