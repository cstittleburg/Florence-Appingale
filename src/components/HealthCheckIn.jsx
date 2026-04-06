import { useState } from 'react'
import { Heart, Brain, Zap, CheckCircle2, TrendingUp, Activity } from 'lucide-react'
import { useApp } from '../context/AppContext'

function scoreColor(s) {
  if (s <= 3) return { bar: '#ef4444', text: '#dc2626', bg: '#fef2f2', label: 'Low' }
  if (s <= 5) return { bar: '#f59e0b', text: '#d97706', bg: '#fffbeb', label: 'Moderate' }
  if (s <= 7) return { bar: '#3b82f6', text: '#2563eb', bg: '#eff6ff', label: 'Good' }
  return             { bar: '#10b981', text: '#059669', bg: '#ecfdf5', label: 'Excellent' }
}

function studyAdaptation(mental, physical) {
  const avg = (mental + physical) / 2
  if (avg <= 2) return {
    mode: 'Rest Protocol', icon: '🛌', color: '#dc2626', bg: '#fef2f2', border: '#fecaca',
    tips: [
      'Skip heavy studying — your brain and body need recovery.',
      'Light review only: glance over flashcards or previous notes.',
      'Prioritize sleep, hydration, and a nourishing meal.',
      'Even 15 minutes of light review counts as a win today.',
    ],
  }
  if (avg <= 4) return {
    mode: 'Light Study Protocol', icon: '🌤', color: '#d97706', bg: '#fffbeb', border: '#fde68a',
    tips: [
      'Limit sessions to 20–25 minutes with breaks in between.',
      'Focus on review and reinforcement — no new heavy topics.',
      'Use flashcards, mnemonics, or re-reading existing notes.',
      'Take a walk or short nap before studying if possible.',
    ],
  }
  if (avg <= 6) return {
    mode: 'Standard Study Protocol', icon: '📋', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe',
    tips: [
      'Standard Pomodoro: 45 min study / 10 min break.',
      'You can tackle new material, but pair it with review.',
      'Prioritize topics closest to your exam date.',
      'Stay hydrated and take meaningful breaks.',
    ],
  }
  if (avg <= 8) return {
    mode: 'Full Study Protocol', icon: '⚡', color: '#0074a4', bg: '#e0f2fe', border: '#bae6fd',
    tips: [
      'Great day to tackle challenging new material.',
      'Aim for 2–3 focused 45–60 min sessions.',
      'Practice questions and active recall are your best tools.',
      'Build on momentum — check off key topics today.',
    ],
  }
  return {
    mode: 'Peak Performance Protocol', icon: '🏆', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0',
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
  const [mental, setMental]   = useState(todayCheckin?.mental   ?? 5)
  const [physical, setPhysical] = useState(todayCheckin?.physical ?? 5)
  const [notes, setNotes]     = useState(todayCheckin?.notes    ?? '')
  const [saved, setSaved]     = useState(!!todayCheckin)

  function handleSave() {
    addCheckin({ date: today, mental, physical, notes: notes.trim() })
    setSaved(true)
  }

  const adaptation = studyAdaptation(mental, physical)
  const mc = scoreColor(mental)
  const pc = scoreColor(physical)
  const history = healthCheckins.slice(0, 14)

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto animate-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-4 h-4" style={{ color: '#0091cd' }} />
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#0091cd' }}>Wellness Monitoring</p>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Health Check-In</h1>
        <p className="text-slate-500 text-sm mt-1">Rate how you're feeling — your study plan adapts to your wellbeing.</p>
      </div>

      {/* Check-in card */}
      <div className="card p-5 md:p-6 mb-5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="font-semibold text-slate-800">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Daily wellness assessment</p>
          </div>
          {saved && (
            <div className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full"
              style={{ background: '#ecfdf5', color: '#059669' }}>
              <CheckCircle2 className="w-4 h-4" /> Logged
            </div>
          )}
        </div>

        <div className="space-y-8">
          {/* Mental */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#f5f3ff' }}>
                <Brain className="w-4 h-4" style={{ color: '#7c3aed' }} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 text-sm">Mental / Emotional</p>
                <p className="text-xs text-slate-400">Stress, focus, mood</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold" style={{ color: mc.text }}>{mental}</p>
                <p className="text-xs font-medium" style={{ color: mc.text }}>{mc.label}</p>
              </div>
            </div>
            <input
              type="range" min="1" max="10" step="1"
              value={mental}
              onChange={e => { setMental(+e.target.value); setSaved(false) }}
              className="w-full"
              style={{ background: `linear-gradient(to right, ${mc.bar} ${(mental-1)/9*100}%, #e2e8f0 ${(mental-1)/9*100}%)` }}
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1.5">
              <span>1 — Struggling</span><span>5 — Okay</span><span>10 — Amazing</span>
            </div>
          </div>

          {/* Physical */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#fef2f2' }}>
                <Heart className="w-4 h-4" style={{ color: '#ef4444' }} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 text-sm">Physical / Energy</p>
                <p className="text-xs text-slate-400">Energy, fatigue, soreness</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold" style={{ color: pc.text }}>{physical}</p>
                <p className="text-xs font-medium" style={{ color: pc.text }}>{pc.label}</p>
              </div>
            </div>
            <input
              type="range" min="1" max="10" step="1"
              value={physical}
              onChange={e => { setPhysical(+e.target.value); setSaved(false) }}
              className="w-full"
              style={{ background: `linear-gradient(to right, ${pc.bar} ${(physical-1)/9*100}%, #e2e8f0 ${(physical-1)/9*100}%)` }}
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1.5">
              <span>1 — Exhausted</span><span>5 — Okay</span><span>10 — Energized</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Clinical Notes (optional)</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="How are you feeling? Sleep quality? Any stressors?"
              value={notes}
              onChange={e => { setNotes(e.target.value); setSaved(false) }}
            />
          </div>

          <button onClick={handleSave} className="btn-primary w-full justify-center py-2.5">
            {saved ? '✓ Update Check-In' : 'Log Check-In'}
          </button>
        </div>
      </div>

      {/* Adaptive recommendation */}
      <div className="card p-5 mb-5" style={{ borderLeft: `4px solid ${adaptation.color}` }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">{adaptation.icon}</span>
          <div>
            <p className="font-bold text-slate-800">{adaptation.mode}</p>
            <p className="text-xs text-slate-400">Study recommendation based on today's wellness</p>
          </div>
        </div>
        <ul className="space-y-2">
          {adaptation.tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: adaptation.color }} />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* History chart */}
      {history.length > 1 && (
        <div className="card p-5">
          <div className="section-header">
            <TrendingUp className="w-3.5 h-3.5" style={{ color: '#0091cd' }} />
            Wellness History
          </div>
          <div className="space-y-2.5">
            {history.map(c => {
              const avg = Math.round((c.mental + c.physical) / 2)
              const { bar } = scoreColor(avg)
              return (
                <div key={c.date} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-20 flex-shrink-0">
                    {new Date(c.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(avg/10)*100}%`, background: bar }} />
                  </div>
                  <span className="text-xs font-bold text-slate-600 w-8 text-right">{avg}/10</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
