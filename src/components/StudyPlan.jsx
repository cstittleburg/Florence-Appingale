import { useState } from 'react'
import { BookOpen, Loader2, Sparkles, AlertCircle, ChevronDown, ChevronUp, Download, RefreshCw, ClipboardList } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { summarizeSlides } from '../utils/pptxParser'
import { generateMessage } from '../utils/api'

function daysUntil(dateStr) {
  const target = new Date(dateStr + 'T00:00:00')
  const now = new Date(); now.setHours(0,0,0,0)
  return Math.ceil((target - now) / 86400000)
}

function buildPrompt({ uploadedFiles, schedule, todayCheckin, learningProfile, today }) {
  const avg = todayCheckin ? Math.round((todayCheckin.mental + todayCheckin.physical) / 2) : null

  const upcomingExams = schedule
    .filter(e => (e.type === 'exam' || e.type === 'quiz') && daysUntil(e.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))

  const upcomingClinicals = schedule
    .filter(e => e.type === 'clinical' && daysUntil(e.date) >= 0 && daysUntil(e.date) <= 14)
    .sort((a, b) => a.date.localeCompare(b.date))

  const materialsSection = uploadedFiles.length > 0
    ? uploadedFiles.map(f => {
        const summary = summarizeSlides(f.slides)
        return `### ${f.courseName} — "${f.name}" (${f.slideCount} slides)${f.examDate ? `, Exam: ${f.examDate}` : ''}\n${summary}`
      }).join('\n\n')
    : 'No course materials uploaded yet. Create a general nursing study plan.'

  const examSection = upcomingExams.length > 0
    ? upcomingExams.map(e => `- ${e.title}: ${e.date} (${daysUntil(e.date)} days away)`).join('\n')
    : 'No exams scheduled.'

  const clinicalSection = upcomingClinicals.length > 0
    ? upcomingClinicals.map(e => `- ${e.title}: ${e.date} (${daysUntil(e.date)} days away)`).join('\n')
    : 'None in the next 2 weeks.'

  const healthSection = avg !== null
    ? `Mental: ${todayCheckin.mental}/10, Physical: ${todayCheckin.physical}/10, Average: ${avg}/10${todayCheckin.notes ? `, Notes: "${todayCheckin.notes}"` : ''}`
    : 'No check-in today.'

  const profileSection = learningProfile.howILearn
    ? [
        `How she learns: ${learningProfile.howILearn}`,
        learningProfile.weakAreas    ? `Challenging areas: ${learningProfile.weakAreas}` : '',
        learningProfile.styles?.length ? `Preferred study methods: ${learningProfile.styles.join(', ')}` : '',
        `Preferred session length: ${learningProfile.sessionLength} minutes`,
        `Best time of day: ${learningProfile.bestTimeOfDay}`,
        learningProfile.extraNotes   ? `Additional context: ${learningProfile.extraNotes}` : '',
      ].filter(Boolean).join('\n')
    : 'No learning profile set yet — use reasonable defaults.'

  return `You are a personalized nursing study coach. Create a detailed, practical, day-by-day study plan for a B.S. Nursing student.

Today's date: ${today}

## Student's Wellness Today
${healthSection}

IMPORTANT: Adjust today's study intensity based on the wellness score. If average is 4 or below, make today very light. If 7+, full sessions are appropriate.

## Learning Profile
${profileSection}

## Upcoming Exams & Quizzes
${examSection}

## Upcoming Clinical Sessions (plan lighter study the day before/after clinicals)
${clinicalSection}

## Course Materials (extracted from uploaded PowerPoints)
${materialsSection}

## Your Task
Create a day-by-day study plan from today (${today}) through the day before the next exam. For each day include:

1. **Day header** with date and day of week
2. **Study mode** for the day
3. **Topics to cover** — specific content from uploaded materials, distributed intelligently
4. **Study techniques** — personalized to her learning profile
5. **Session breakdown** — how many sessions, duration, what to focus on in each
6. **Total time estimate**
7. **Self-care reminder** — one brief, genuine note

Prioritize by: exam proximity, content breadth, and her weak areas. Keep it realistic and achievable — doable, not overwhelming. Use clear markdown headers for each day.`
}

function renderPlanHTML(md) {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2>$1</h2>')
    .replace(/^# (.+)$/gm,   '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,    '<em>$1</em>')
    .replace(/^- (.+)$/gm,   '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[h2|h3|ul|li])(.+)$/gm, m => m.startsWith('<') ? m : `<p>${m}</p>`)
}

export default function StudyPlan() {
  const { uploadedFiles, schedule, todayCheckin, learningProfile, savedPlans, savePlan, today } = useApp()
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState('')
  const [plan, setPlan]                   = useState(savedPlans[0]?.content || '')
  const [expandedHistory, setExpandedHistory] = useState(false)

  const hasFiles  = uploadedFiles.length > 0
  const hasExams  = schedule.some(e => e.type === 'exam')
  const hasCheckin = !!todayCheckin
  const hasProfile = !!learningProfile.howILearn

  async function generatePlan() {
    setLoading(true); setError('')
    try {
      const prompt = buildPrompt({ uploadedFiles, schedule, todayCheckin, learningProfile, today })
      const result = await generateMessage(prompt)
      const newPlan = {
        content: result,
        generatedAt: new Date().toISOString(),
        examCount: schedule.filter(e => e.type === 'exam').length,
        fileCount: uploadedFiles.length,
      }
      setPlan(result)
      savePlan(newPlan)
    } catch (err) {
      setError(`Failed to generate plan: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  function exportPlan() {
    const blob = new Blob([plan], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `study-plan-${today}.txt`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto animate-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList className="w-4 h-4" style={{ color: '#0091cd' }} />
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#0091cd' }}>Care Plan</p>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Study Plan Generator</h1>
        <p className="text-slate-500 text-sm mt-1">Florence analyzes your materials, exam dates, health score, and learning profile to build your daily plan.</p>
      </div>

      {/* Readiness */}
      <div className="card p-5 mb-5">
        <p className="section-header">
          <ClipboardList className="w-3.5 h-3.5" style={{ color: '#0091cd' }} />
          Plan Quality Checklist
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            { done: hasFiles,   label: `${uploadedFiles.length} course file(s) uploaded`,    required: true },
            { done: hasExams,   label: 'Exam date(s) in schedule',                           required: true },
            { done: hasCheckin, label: "Today's health check-in complete",                   required: false },
            { done: hasProfile, label: 'Learning profile filled out',                        required: false },
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
        {(!hasFiles || !hasExams) && (
          <p className="text-xs mt-3 px-3 py-2 rounded-lg" style={{ background: '#fffbeb', color: '#92400e' }}>
            For best results, upload course materials and add exam dates first. You can still generate a general plan without them.
          </p>
        )}
      </div>

      {/* Generate button */}
      <button
        onClick={generatePlan}
        disabled={loading}
        className="btn-primary w-full justify-center py-3.5 text-base mb-5"
      >
        {loading
          ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating your plan…</>
          : plan
            ? <><RefreshCw className="w-5 h-5" /> Regenerate Study Plan</>
            : <><Sparkles className="w-5 h-5" /> Generate My Study Plan</>
        }
      </button>

      {error && (
        <div className="flex items-start gap-2 text-sm px-4 py-3 rounded-xl mb-5"
          style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}
        </div>
      )}

      {/* Plan output */}
      {plan && !loading && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100"
            style={{ background: 'linear-gradient(135deg, #0d2137, #0074a4)' }}>
            <BookOpen className="w-5 h-5 text-sky-300 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm">Your Personalized Study Plan</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(186,230,253,0.8)' }}>
                {savedPlans[0] ? new Date(savedPlans[0].generatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}
                {' · '}{uploadedFiles.length} file(s) · {schedule.filter(e=>e.type==='exam').length} exam(s)
              </p>
            </div>
            <button
              onClick={exportPlan}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
          <div
            className="plan-content p-5 md:p-6"
            dangerouslySetInnerHTML={{ __html: renderPlanHTML(plan) }}
          />
        </div>
      )}

      {/* History */}
      {savedPlans.length > 1 && (
        <div className="mt-4 card overflow-hidden">
          <button
            onClick={() => setExpandedHistory(e => !e)}
            className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <span>Previous Plans ({savedPlans.length - 1})</span>
            {expandedHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {expandedHistory && (
            <div className="border-t border-slate-100">
              {savedPlans.slice(1).map((p, i) => (
                <button
                  key={i}
                  onClick={() => setPlan(p.content)}
                  className="w-full px-5 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0"
                >
                  <p className="text-sm font-medium text-slate-700">
                    {new Date(p.generatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-slate-400">{p.fileCount} file(s) · {p.examCount} exam(s)</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
