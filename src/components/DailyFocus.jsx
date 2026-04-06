import { useState } from 'react'
import { Target, Loader2, Sparkles, AlertCircle, RefreshCw, ExternalLink, Download, BookMarked } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { generateMessage } from '../utils/api'

const CONFIDENCE_LABELS = ['', 'Lost', 'Shaky', 'Getting it', 'Solid', 'Mastered']

function daysUntil(dateStr) {
  if (!dateStr) return null
  const target = new Date(dateStr + 'T00:00:00')
  const now = new Date(); now.setHours(0,0,0,0)
  return Math.ceil((target - now) / 86400000)
}

function buildPrompt({ courses, schedule, todayCheckin, learningProfile, today }) {
  const avg = todayCheckin ? Math.round((todayCheckin.mental + todayCheckin.physical) / 2) : null

  // Summarize topic confidence across all courses
  const coursesSummary = courses.map(course => {
    const d = daysUntil(course.examDate)
    const topicLines = (course.topics || []).map(t => {
      const latest = t.logs?.[0]
      const trend = (() => {
        const logs = t.logs || []
        if (logs.length < 2) return 'new'
        if (logs[0].confidence > logs[1].confidence) return 'improving'
        if (logs[0].confidence < logs[1].confidence) return 'declining'
        return 'flat'
      })()
      const confStr = latest
        ? `Confidence: ${latest.confidence}/5 (${CONFIDENCE_LABELS[latest.confidence]}), trend: ${trend}, last logged: ${latest.date}${latest.notes ? `, note: "${latest.notes}"` : ''}`
        : 'Not yet rated'
      return `    - ${t.name}: ${confStr}`
    }).join('\n')
    return `## ${course.name}${course.examDate ? ` — Exam: ${course.examDate} (${d !== null ? `${d} days away` : 'date set'})` : ' — No exam date set'}
${topicLines || '  (no topics added yet)'}`
  }).join('\n\n')

  // Schedule context
  const upcomingExams = schedule
    .filter(e => (e.type === 'exam' || e.type === 'quiz') && daysUntil(e.date) >= 0)
    .sort((a,b) => a.date.localeCompare(b.date))
    .map(e => `- ${e.title}: ${e.date} (${daysUntil(e.date)}d)`)
    .join('\n') || 'None'

  const clinicals = schedule
    .filter(e => e.type === 'clinical' && daysUntil(e.date) >= 0 && daysUntil(e.date) <= 5)
    .map(e => `- ${e.title}: ${e.date}`)
    .join('\n') || 'None this week'

  const healthSection = avg !== null
    ? `Mental: ${todayCheckin.mental}/10, Physical: ${todayCheckin.physical}/10 (avg ${avg}/10)${todayCheckin.notes ? ` — "${todayCheckin.notes}"` : ''}`
    : 'No check-in today (assume moderate energy)'

  const profileSection = [
    learningProfile.howILearn    ? `How she learns: ${learningProfile.howILearn}` : '',
    learningProfile.weakAreas    ? `Challenging areas: ${learningProfile.weakAreas}` : '',
    learningProfile.styles?.length ? `Preferred methods: ${learningProfile.styles.join(', ')}` : '',
    `Session length: ${learningProfile.sessionLength || 45} min`,
    `Best time: ${learningProfile.bestTimeOfDay || 'morning'}`,
    learningProfile.extraNotes   ? learningProfile.extraNotes : '',
  ].filter(Boolean).join('\n') || 'No learning profile set'

  return `You are Florence Appingale, a nursing study coach. Today is ${today}.

The student uses NotebookLM as her primary study tool. Your job is NOT to teach content — it's to analyze her confidence data and tell her exactly what to focus on today in NotebookLM, in what order, and for how long.

## Today's Wellness
${healthSection}

## Learning Profile
${profileSection}

## Upcoming Exams & Quizzes
${upcomingExams}

## Upcoming Clinicals (consider reducing intensity around these)
${clinicals}

## Topic Confidence Tracker (all courses)
${coursesSummary}

## Instructions
Generate a focused, prioritized daily study plan. Structure it as:

### Today's Energy Level
One sentence on how today's wellness affects the plan.

### Priority Topics (Top 3–5)
For each priority topic:
- **Topic name (Course)**
- Why it's priority today (low confidence / declining / exam proximity / not yet rated)
- Specific things to focus on in NotebookLM (be concrete: "Review the mechanism of action, then quiz yourself on drug interactions")
- How long to spend
- Confidence goal for the end of today's session

### Suggested Session Order
A simple time-blocked schedule for the day (e.g. "9:00am — 45 min on Acid-Base")

### What to Skip Today
Topics she can safely deprioritize today and why.

### One Encouragement
One genuine, specific sentence of encouragement tied to her actual data (e.g. her improving trends or upcoming milestone).

Keep it practical, direct, and actionable. She should be able to open NotebookLM immediately after reading this.`
}

function renderHTML(md) {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,    '<em>$1</em>')
    .replace(/^- (.+)$/gm,   '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<)(.+)$/gm, m => `<p>${m}</p>`)
}

export default function DailyFocus() {
  const { courses, schedule, todayCheckin, learningProfile, savedFocuses, saveFocus, today } = useApp()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [focus, setFocus]     = useState(savedFocuses[0]?.content || '')

  const hasCourses = courses.length > 0
  const hasTopics  = courses.some(c => (c.topics || []).length > 0)
  const hasLogs    = courses.some(c => (c.topics || []).some(t => (t.logs || []).length > 0))

  async function generate() {
    setLoading(true); setError('')
    try {
      const prompt = buildPrompt({ courses, schedule, todayCheckin, learningProfile, today })
      const result = await generateMessage(prompt)
      setFocus(result)
      saveFocus({ content: result, generatedAt: new Date().toISOString() })
    } catch (err) {
      setError(`Failed to generate: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  function exportFocus() {
    const blob = new Blob([focus], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `daily-focus-${today}.txt`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto animate-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-4 h-4" style={{ color: '#0091cd' }} />
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#0091cd' }}>Daily Care Plan</p>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Daily Focus</h1>
        <p className="text-slate-500 text-sm mt-1">Florence analyzes your confidence history, exam dates, and today's wellness to tell you exactly what to study in NotebookLM today.</p>
      </div>

      {/* Readiness */}
      <div className="card p-5 mb-5">
        <p className="section-header">
          <Target className="w-3.5 h-3.5" style={{ color: '#0091cd' }} />
          Readiness Check
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            { done: hasCourses, label: 'At least one course added',          required: true },
            { done: hasTopics,  label: 'Topics added to your courses',       required: true },
            { done: hasLogs,    label: 'At least one confidence log',        required: false },
            { done: !!todayCheckin, label: "Today's health check-in done",   required: false },
          ].map(({ done, label, required }) => (
            <div key={label} className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
              style={{ background: done ? '#f0fdf4' : required ? '#fffbeb' : '#f8fafc' }}>
              <div className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: done ? '#10b981' : required ? '#f59e0b' : '#cbd5e1' }} />
              <span className="text-sm" style={{ color: done ? '#065f46' : required ? '#92400e' : '#64748b' }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {!hasCourses && (
          <div className="mt-3 flex items-start gap-2 text-sm px-3 py-2.5 rounded-xl"
            style={{ background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}>
            <BookMarked className="w-4 h-4 flex-shrink-0 mt-0.5" />
            Go to My Courses and add your courses + topics first. The more confidence logs you have, the smarter Florence's recommendations become.
          </div>
        )}
      </div>

      {/* Generate */}
      <button
        onClick={generate}
        disabled={loading || !hasCourses}
        className="btn-primary w-full justify-center py-3.5 text-base mb-5 disabled:opacity-50"
      >
        {loading
          ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing your progress…</>
          : focus
            ? <><RefreshCw className="w-5 h-5" /> Refresh Today's Focus</>
            : <><Sparkles className="w-5 h-5" /> Generate Today's Focus</>
        }
      </button>

      {error && (
        <div className="flex items-start gap-2 text-sm px-4 py-3 rounded-xl mb-5"
          style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}
        </div>
      )}

      {/* Focus output */}
      {focus && !loading && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100"
            style={{ background: 'linear-gradient(135deg, #0d2137, #0074a4)' }}>
            <Target className="w-5 h-5 text-sky-300 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm">Today's Study Focus</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(186,230,253,0.8)' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                {' · '}{courses.length} course{courses.length !== 1 ? 's' : ''} · {courses.reduce((n,c) => n + (c.topics||[]).length, 0)} topics tracked
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="https://notebooklm.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <ExternalLink className="w-3.5 h-3.5" /> NotebookLM
              </a>
              <button
                onClick={exportFocus}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <Download className="w-3.5 h-3.5" /> Export
              </button>
            </div>
          </div>
          <div
            className="plan-content p-5 md:p-6"
            dangerouslySetInnerHTML={{ __html: renderHTML(focus) }}
          />
        </div>
      )}
    </div>
  )
}
