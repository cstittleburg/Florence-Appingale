import { useState } from 'react'
import { Heart, Brain, Zap, CheckCircle2, TrendingUp } from 'lucide-react'
import { useApp } from '../context/AppContext'

function scoreColor(s) {
  if (s <= 3) return { bar: 'bg-red-400', text: 'text-red-600', bg: 'bg-red-50' }
  if (s <= 5) return { bar: 'bg-amber-400', text: 'text-amber-600', bg: 'bg-amber-50' }
  if (s <= 7) return { bar: 'bg-blue-400', text: 'text-blue-600', bg: 'bg-blue-50' }
  return { bar: 'bg-emerald-400', text: 'text-emerald-600', bg: 'bg-emerald-50' }
}

function scoreLabel(s) {
  if (s <= 2) return 'Very Low'
  if (s <= 4) return 'Low'
  if (s <= 6) return 'Moderate'
  if (s <= 8) return 'Good'
  return 'Excellent'
}

function studyAdaptation(mental, physical) {
  const avg = (mental + physical) / 2
  if (avg <= 2) return {
    mode: 'Rest Day',
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    tips: [
      'Skip heavy studying today — your brain and body need recovery.',
      'Light review only: glance over flashcards or previous notes.',
      'Prioritize sleep, hydration, and a nourishing meal.',
      'Even 15 minutes of light review counts as a good day.',
    ],
  }
  if (avg <= 4) return {
    mode: 'Light Study Mode',
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    tips: [
      'Limit sessions to 20–25 minutes with breaks in between.',
      'Focus on review and reinforcement — no new heavy topics.',
      'Use flashcards, mnemonics, or re-reading existing notes.',
      'Take a walk or short nap before studying if possible.',
    ],
  }
  if (avg <= 6) return {
    mode: 'Moderate Study Mode',
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    tips: [
      'Standard Pomodoro sessions: 45 min study / 10 min break.',
      'You can tackle new material, but pair it with review.',
      'Prioritize topics closest to your exam date.',
      'Stay hydrated and take meaningful breaks.',
    ],
  }
  if (avg <= 8) return {
    mode: 'Full Study Mode',
    color: 'text-brand-600',
    bg: 'bg-brand-50 border-brand-200',
    tips: [
      'Great day to tackle challenging new material.',
      'Aim for 2–3 focused 45–60 min sessions.',
      'Practice questions and active recall are your best tools.',
      'Build on momentum — check off key topics today.',
    ],
  }
  return {
    mode: 'Peak Performance Mode',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-200',
    tips: [
      'This is a power study day — use it well!',
      'Tackle your hardest topic or weakest area first.',
      'Do a full practice exam or question set.',
      'You are at your best — trust yourself and go deep.',
    ],
  }
}

export default function HealthCheckIn() {
  const { healthCheckins, addCheckin, todayCheckin, today } = useApp()
  const [mental, setMental] = useState(todayCheckin?.mental ?? 5)
  const [physical, setPhysical] = useState(todayCheckin?.physical ?? 5)
  const [notes, setNotes] = useState(todayCheckin?.notes ?? '')
  const [saved, setSaved] = useState(!!todayCheckin)

  function handleSave() {
    addCheckin({ date: today, mental, physical, notes: notes.trim() })
    setSaved(true)
  }

  const adaptation = studyAdaptation(mental, physical)
  const mc = scoreColor(mental)
  const pc = scoreColor(physical)

  const history = healthCheckins.slice(0, 14) // last 14 days

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Health Check-In</h1>
        <p className="text-slate-500 mt-1 text-sm">Rate how you're feeling today — the study plan adapts to your wellbeing.</p>
      </div>

      {/* Check-in form */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-slate-800">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h2>
          {saved && (
            <div className="flex items-center gap-1.5 text-emerald-600 text-sm">
              <CheckCircle2 className="w-4 h-4" /> Saved
            </div>
          )}
        </div>

        <div className="space-y-8">
          {/* Mental health */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-violet-500" />
              <span className="font-medium text-slate-700">Mental / Emotional</span>
              <span className={`ml-auto text-sm font-semibold ${mc.text}`}>{mental}/10 — {scoreLabel(mental)}</span>
            </div>
            <input
              type="range" min="1" max="10" step="1"
              value={mental}
              onChange={e => { setMental(+e.target.value); setSaved(false) }}
              className="w-full"
              style={{ background: `linear-gradient(to right, #6272f1 ${(mental - 1) / 9 * 100}%, #e2e8f0 ${(mental - 1) / 9 * 100}%)` }}
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>1 — Struggling</span>
              <span>5 — Okay</span>
              <span>10 — Amazing</span>
            </div>
          </div>

          {/* Physical health */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-rose-500" />
              <span className="font-medium text-slate-700">Physical / Energy</span>
              <span className={`ml-auto text-sm font-semibold ${pc.text}`}>{physical}/10 — {scoreLabel(physical)}</span>
            </div>
            <input
              type="range" min="1" max="10" step="1"
              value={physical}
              onChange={e => { setPhysical(+e.target.value); setSaved(false) }}
              className="w-full"
              style={{ background: `linear-gradient(to right, #f43f5e ${(physical - 1) / 9 * 100}%, #e2e8f0 ${(physical - 1) / 9 * 100}%)` }}
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>1 — Exhausted</span>
              <span>5 — Okay</span>
              <span>10 — Energized</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Notes (optional)</label>
            <textarea
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
              rows={2}
              placeholder="How are you feeling? Any stressors? Sleep quality?"
              value={notes}
              onChange={e => { setNotes(e.target.value); setSaved(false) }}
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-brand-600 text-white py-2.5 rounded-lg font-medium hover:bg-brand-700 transition-colors"
          >
            {saved ? 'Update Check-In' : 'Save Check-In'}
          </button>
        </div>
      </div>

      {/* Adaptive recommendation */}
      <div className={`border rounded-xl p-5 mb-6 ${adaptation.bg}`}>
        <div className="flex items-center gap-2 mb-3">
          <Zap className={`w-5 h-5 ${adaptation.color}`} />
          <h2 className={`font-semibold ${adaptation.color}`}>{adaptation.mode}</h2>
        </div>
        <ul className="space-y-2">
          {adaptation.tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="text-slate-400 flex-shrink-0 mt-0.5">•</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* History */}
      {history.length > 1 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-500" /> Wellness History
          </h2>
          <div className="space-y-2">
            {history.map(c => {
              const avg = Math.round((c.mental + c.physical) / 2)
              const { bar } = scoreColor(avg)
              const pct = (avg / 10) * 100
              return (
                <div key={c.date} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-20 flex-shrink-0">
                    {new Date(c.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-medium text-slate-600 w-8 text-right">{avg}/10</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
