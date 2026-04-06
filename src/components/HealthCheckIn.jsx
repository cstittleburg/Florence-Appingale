import { useState } from 'react'
import { Heart, Brain, Zap, CheckCircle2, TrendingUp, Activity, ClipboardCheck, ChevronDown, ChevronUp } from 'lucide-react'
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
      'Minimal study today — recovery is productive.',
      '15–20 min of light review maximum. No new material.',
      'Prioritize sleep, hydration, and food first.',
    ],
  }
  if (avg <= 4) return {
    mode: 'Light Study Protocol', icon: '🌤', color: '#d97706', bg: '#fffbeb', border: '#fde68a',
    tips: [
      'Limit sessions to 25–30 minutes with breaks.',
      'Review previously learned material only — no new heavy topics.',
      'Shorter sessions are fine; consistency matters more than duration.',
    ],
  }
  if (avg <= 6) return {
    mode: 'Standard Study Protocol', icon: '📋', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe',
    tips: [
      '45-min focused sessions with 10-min breaks.',
      'Tackle new material paired with review of weaker topics.',
      'Prioritize by exam proximity — stick to the plan.',
    ],
  }
  if (avg <= 8) return {
    mode: 'Full Study Protocol', icon: '⚡', color: '#0074a4', bg: '#e0f2fe', border: '#bae6fd',
    tips: [
      'Strong day — tackle challenging new material.',
      'Aim for 2–3 focused 50–60 min sessions.',
      'Use active recall and NotebookLM quizzing features.',
    ],
  }
  return {
    mode: 'Peak Performance Protocol', icon: '🏆', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0',
    tips: [
      'Power study day — use it on your hardest material.',
      'Tackle your lowest-confidence topics first.',
      'Go deep — this is when retention is highest.',
    ],
  }
}

const CONF_LABELS = ['', 'Lost', 'Shaky', 'Getting it', 'Solid', 'Mastered']
const CONF_COLORS = ['', '#ef4444', '#f59e0b', '#3b82f6', '#0091cd', '#10b981']

export default function HealthCheckIn() {
  const { healthCheckins, addCheckin, todayCheckin, today, courses, logConfidence } = useApp()
  const [mental, setMental]     = useState(todayCheckin?.mental   ?? 5)
  const [physical, setPhysical] = useState(todayCheckin?.physical ?? 5)
  const [notes, setNotes]       = useState(todayCheckin?.notes    ?? '')
  const [saved, setSaved]       = useState(!!todayCheckin)

  // Accountability section
  const existingAcct = todayCheckin?.accountability || null
  const [acctStatus, setAcctStatus]   = useState(existingAcct?.status || null)
  const [acctNotes, setAcctNotes]     = useState(existingAcct?.notes  || '')
  const [acctExpanded, setAcctExpanded] = useState(!existingAcct)
  // topicRatings: { [topicId]: confidence (1-5) }
  const [topicRatings, setTopicRatings] = useState(() => {
    const init = {}
    existingAcct?.topicLogs?.forEach(t => { init[t.topicId] = t.confidence })
    return init
  })

  // Flat list of all topics across courses
  const allTopics = courses.flatMap(c =>
    (c.topics || []).map(t => ({ ...t, courseId: c.id, courseName: c.name }))
  )

  function handleSave() {
    const accountability = {
      status: acctStatus,
      notes: acctNotes.trim(),
      topicLogs: Object.entries(topicRatings).map(([topicId, confidence]) => {
        const topic = allTopics.find(t => t.id === topicId)
        return { topicId, courseId: topic?.courseId, topicName: topic?.name, courseName: topic?.courseName, confidence }
      }),
    }
    addCheckin({ date: today, mental, physical, notes: notes.trim(), accountability })
    // Log confidence for any rated topics
    Object.entries(topicRatings).forEach(([topicId, confidence]) => {
      const topic = allTopics.find(t => t.id === topicId)
      if (topic) logConfidence(topic.courseId, topicId, { date: today, confidence, notes: '' })
    })
    setSaved(true)
  }

  const adaptation = studyAdaptation(mental, physical)
  const mc = scoreColor(mental)
  const pc = scoreColor(physical)
  const history = healthCheckins.slice(0, 14)
  const showTopics = acctStatus === 'yes' || acctStatus === 'partial'

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto animate-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-4 h-4" style={{ color: '#0091cd' }} />
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#0091cd' }}>Daily Check-In</p>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Health & Progress</h1>
        <p className="text-slate-500 text-sm mt-1">Log your wellness and yesterday's study progress so Florence can plan today accurately.</p>
      </div>

      {/* ── SECTION 1: Wellness ── */}
      <div className="card p-5 md:p-6 mb-4">
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

        <div className="space-y-7">
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
            <label className="block text-sm font-semibold text-slate-700 mb-2">Notes (optional)</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="How are you feeling? Sleep quality? Any stressors?"
              value={notes}
              onChange={e => { setNotes(e.target.value); setSaved(false) }}
            />
          </div>
        </div>
      </div>

      {/* ── SECTION 2: Yesterday's Accountability ── */}
      <div className="card overflow-hidden mb-4">
        <button
          onClick={() => setAcctExpanded(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#e0f2fe' }}>
              <ClipboardCheck className="w-4 h-4" style={{ color: '#0074a4' }} />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">Yesterday's Progress</p>
              <p className="text-xs text-slate-400">
                {acctStatus === 'yes' ? 'Completed plan ✓' : acctStatus === 'partial' ? 'Partially completed' : acctStatus === 'no' ? 'Did not study' : 'Tap to log what you covered'}
              </p>
            </div>
          </div>
          {acctExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {acctExpanded && (
          <div className="px-5 pb-5 border-t border-slate-100">
            <p className="text-sm font-semibold text-slate-700 mt-4 mb-3">Did you complete yesterday's study plan?</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { value: 'yes',     label: 'Yes',      color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
                { value: 'partial', label: 'Partially', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
                { value: 'no',      label: 'No',        color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setAcctStatus(opt.value); setSaved(false) }}
                  className="py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
                  style={acctStatus === opt.value
                    ? { background: opt.bg, color: opt.color, borderColor: opt.border }
                    : { background: '#f8fafc', color: '#64748b', borderColor: '#e2e8f0' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Topic quick-log — only shown when yes or partial */}
            {showTopics && allTopics.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-700 mb-1">Rate your confidence on topics you worked on:</p>
                <p className="text-xs text-slate-400 mb-3">Only rate topics you actually studied. Skip the rest — they'll stay as-is.</p>
                <div className="space-y-3">
                  {allTopics.map(t => (
                    <div key={t.id} className="rounded-xl p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div className="flex items-start gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{t.name}</p>
                          <p className="text-xs text-slate-400">{t.courseName}</p>
                        </div>
                        {topicRatings[t.id] && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: `${CONF_COLORS[topicRatings[t.id]]}18`, color: CONF_COLORS[topicRatings[t.id]] }}>
                            {CONF_LABELS[topicRatings[t.id]]}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        {[1,2,3,4,5].map(n => (
                          <button
                            key={n}
                            onClick={() => {
                              setTopicRatings(prev => {
                                // toggle off if clicking same value
                                if (prev[t.id] === n) { const next = {...prev}; delete next[t.id]; return next }
                                return { ...prev, [t.id]: n }
                              })
                              setSaved(false)
                            }}
                            className="flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all"
                            style={topicRatings[t.id] === n
                              ? { background: CONF_COLORS[n], color: 'white', borderColor: CONF_COLORS[n] }
                              : { background: 'white', color: '#94a3b8', borderColor: '#e2e8f0' }}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      {topicRatings[t.id] && (
                        <p className="text-xs text-slate-400 mt-1.5 text-center">{CONF_LABELS[topicRatings[t.id]]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showTopics && allTopics.length === 0 && (
              <p className="text-sm text-slate-400 mb-4">Add topics in My Courses to log confidence here.</p>
            )}

            {acctStatus === 'no' && (
              <div className="mb-4 px-3 py-2.5 rounded-xl text-sm"
                style={{ background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}>
                That's okay — Florence will carry those topics forward in today's plan and adjust priorities accordingly.
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">What did you cover? (optional)</label>
              <textarea
                className="input resize-none text-sm"
                rows={2}
                placeholder="e.g. 'Got through acid-base balance, ran out of time for pharmacology'"
                value={acctNotes}
                onChange={e => { setAcctNotes(e.target.value); setSaved(false) }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Save button */}
      <button onClick={handleSave} className="btn-primary w-full justify-center py-3 mb-5 text-base">
        {saved ? '✓ Update Check-In' : 'Save Check-In'}
      </button>

      {/* Adaptive recommendation */}
      <div className="card p-5 mb-5" style={{ borderLeft: `4px solid ${adaptation.color}` }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">{adaptation.icon}</span>
          <div>
            <p className="font-bold text-slate-800">{adaptation.mode}</p>
            <p className="text-xs text-slate-400">Study capacity based on today's wellness</p>
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 w-8 text-right">{avg}/10</span>
                    {c.accountability?.status && (
                      <span className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          background: c.accountability.status === 'yes' ? '#ecfdf5' : c.accountability.status === 'partial' ? '#fffbeb' : '#fef2f2',
                          color: c.accountability.status === 'yes' ? '#059669' : c.accountability.status === 'partial' ? '#d97706' : '#dc2626',
                        }}>
                        {c.accountability.status === 'yes' ? '✓' : c.accountability.status === 'partial' ? '~' : '✗'}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
