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

function buildPrompt({ courses, schedule, todayCheckin, yesterdayCheckin, learningProfile, today }) {
  const avg = todayCheckin ? Math.round((todayCheckin.mental + todayCheckin.physical) / 2) : null

  // Summarize topic confidence across all courses
  const coursesSummary = courses.map(course => {
    const d = daysUntil(course.examDate)
    const urgency = d !== null ? (d <= 3 ? 'CRITICAL' : d <= 7 ? 'HIGH' : d <= 14 ? 'MODERATE' : 'NORMAL') : 'NORMAL'
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
    return `## ${course.name} [Urgency: ${urgency}]${course.examDate ? ` — Exam: ${course.examDate} (${d !== null ? `${d} days away` : ''})` : ' — No exam date set'}
${topicLines || '  (no topics added yet)'}`
  }).join('\n\n')

  // Schedule context
  const upcomingExams = schedule
    .filter(e => (e.type === 'exam' || e.type === 'quiz') && daysUntil(e.date) >= 0)
    .sort((a,b) => a.date.localeCompare(b.date))
    .map(e => `- ${e.title}: ${e.date} (${daysUntil(e.date)}d away)`)
    .join('\n') || 'None scheduled'

  const clinicals = schedule
    .filter(e => e.type === 'clinical' && daysUntil(e.date) >= 0 && daysUntil(e.date) <= 5)
    .map(e => `- ${e.title}: ${e.date}`)
    .join('\n') || 'None this week'

  // Wellness context — informs session length only, NOT what topics to skip
  const wellnessNote = avg !== null
    ? `Score: ${avg}/10 (mental ${todayCheckin.mental}, physical ${todayCheckin.physical})${todayCheckin.notes ? ` — "${todayCheckin.notes}"` : ''}. Use this to calibrate SESSION LENGTH only (lower score = shorter sessions). Do NOT use it to excuse skipping critical topics.`
    : 'No check-in today. Assume moderate energy. Default to 45-min sessions.'

  // Yesterday's accountability
  let accountabilitySection = 'No accountability data for yesterday.'
  if (yesterdayCheckin?.accountability) {
    const acct = yesterdayCheckin.accountability
    const statusMap = { yes: 'Completed', partial: 'Partially completed', no: 'Did not study' }
    const topicSummary = acct.topicLogs?.length
      ? acct.topicLogs.map(t => `    - ${t.topicName} (${t.courseName}): updated confidence to ${t.confidence}/5 (${CONFIDENCE_LABELS[t.confidence] || ''})`).join('\n')
      : '    (no specific topic ratings logged)'
    accountabilitySection = `Yesterday's plan status: ${statusMap[acct.status] || 'Unknown'}
${acct.notes ? `What she covered: "${acct.notes}"` : ''}
Topic confidence updates from yesterday:
${topicSummary}

INSTRUCTION: If she did not complete or only partially completed yesterday's plan, the unfinished topics MUST be prioritized today — do not let them slide unless the exam is still more than 2 weeks away and confidence is Solid or better.`
  }

  const profileSection = [
    learningProfile.howILearn    ? `Study style: ${learningProfile.howILearn}` : '',
    learningProfile.weakAreas    ? `Known weak areas: ${learningProfile.weakAreas}` : '',
    learningProfile.styles?.length ? `Preferred methods: ${learningProfile.styles.join(', ')}` : '',
    `Session length: ${learningProfile.sessionLength || 45} min`,
    `Best time of day: ${learningProfile.bestTimeOfDay || 'morning'}`,
    learningProfile.extraNotes   ? learningProfile.extraNotes : '',
  ].filter(Boolean).join('\n') || 'No learning profile set'

  return `You are Florence Appingale, a no-nonsense nursing study strategist. Today is ${today}.

Your job is to produce a realistic, data-driven study plan for today based on the student's confidence history, exam proximity, and what she did (or didn't do) yesterday. You are a tutor, not a cheerleader. Your plan must reflect what needs to happen to pass, not what feels comfortable.

## Core Principles
- Exam proximity and low confidence drive priority — feelings and energy level only affect session LENGTH
- If she skipped yesterday's plan, those topics get prioritized today — they don't disappear
- Be direct. Tell her exactly what to study, in what order, for how long
- She studies in NotebookLM — all study actions refer to NotebookLM (reviewing notebooks, quizzing, exploring sources)
- Do NOT suggest creating flashcards, quizzes, or study content — she uses NotebookLM for actual study

## Today's Wellness
${wellnessNote}

## Yesterday's Accountability
${accountabilitySection}

## Learning Profile
${profileSection}

## Upcoming Exams & Quizzes
${upcomingExams}

## Upcoming Clinicals (reduce intensity the day before and day of)
${clinicals}

## Topic Confidence Data (all courses)
${coursesSummary}

## Output Format

### Today's Capacity
One sentence: state the session length appropriate for today's wellness score, and how many total study hours to plan for.

### Priority Topics (Top 3–5)
For each topic, state:
- **Topic name — Course** [Urgency level]
- Why it's priority (exam in X days / confidence is X / not covered yesterday / declining trend)
- Exactly what to do in NotebookLM (e.g. "Open the pharmacology notebook, review the mechanism section, then use the Q&A feature to test yourself on drug interactions")
- Time allocation (be specific — e.g. "45 minutes")
- Target confidence by end of today's session (e.g. "aim to move from Shaky to Getting It")

### Today's Schedule
Time-blocked plan for the day. Use her best time of day as the anchor. Be realistic — include breaks.
Example format:
- 9:00 AM — 45 min: [Topic] in NotebookLM
- 9:45 AM — 10 min: Break
- etc.

### What to Skip Today (and Why)
List any topics she can safely deprioritize today, with a brief justification (e.g. "confidence already Solid, exam 3 weeks away").

### Carry-Forward Alert
If she missed anything yesterday that isn't in today's priority list, flag it here and state when it should be addressed.

Keep the plan direct, practical, and something she can act on immediately by opening NotebookLM.`
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
  const { courses, schedule, todayCheckin, yesterdayCheckin, learningProfile, savedFocuses, saveFocus, today } = useApp()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [focus, setFocus]     = useState(savedFocuses[0]?.content || '')

  const hasCourses = courses.length > 0
  const hasTopics  = courses.some(c => (c.topics || []).length > 0)
  const hasLogs    = courses.some(c => (c.topics || []).some(t => (t.logs || []).length > 0))

  async function generate() {
    setLoading(true); setError('')
    try {
      const prompt = buildPrompt({ courses, schedule, todayCheckin, yesterdayCheckin, learningProfile, today })
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

  const acctStatus = yesterdayCheckin?.accountability?.status
  const acctBadge = acctStatus === 'yes'
    ? { label: 'Completed yesterday', color: '#059669', bg: '#ecfdf5' }
    : acctStatus === 'partial'
      ? { label: 'Partial yesterday', color: '#d97706', bg: '#fffbeb' }
      : acctStatus === 'no'
        ? { label: 'Missed yesterday', color: '#dc2626', bg: '#fef2f2' }
        : null

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto animate-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-4 h-4" style={{ color: '#0091cd' }} />
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#0091cd' }}>Study Strategy</p>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Daily Focus</h1>
        <p className="text-slate-500 text-sm mt-1">Florence builds a realistic, data-driven plan based on your confidence history, exam dates, and what you covered yesterday.</p>
      </div>

      {/* Readiness */}
      <div className="card p-5 mb-5">
        <p className="section-header">
          <Target className="w-3.5 h-3.5" style={{ color: '#0091cd' }} />
          Plan Inputs
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            { done: hasCourses,      label: 'At least one course added',       required: true },
            { done: hasTopics,       label: 'Topics added to your courses',    required: true },
            { done: hasLogs,         label: 'Confidence logs on file',         required: false },
            { done: !!todayCheckin,  label: "Today's health check-in done",    required: false },
            { done: !!acctStatus,    label: "Yesterday's progress logged",     required: false },
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
            Add your courses and topics first. The more confidence data you have, the more accurate the plan.
          </div>
        )}

        {acctBadge && (
          <div className="mt-3 flex items-center gap-2 text-sm px-3 py-2 rounded-xl"
            style={{ background: acctBadge.bg, color: acctBadge.color }}>
            <span className="font-medium">{acctBadge.label}</span>
            <span style={{ color: acctBadge.color, opacity: 0.7 }}>— Florence will factor this into today's priorities</span>
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
          ? <><Loader2 className="w-5 h-5 animate-spin" /> Building your plan…</>
          : focus
            ? <><RefreshCw className="w-5 h-5" /> Refresh Today's Plan</>
            : <><Sparkles className="w-5 h-5" /> Generate Today's Plan</>
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
              <p className="font-semibold text-white text-sm">Today's Study Plan</p>
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
