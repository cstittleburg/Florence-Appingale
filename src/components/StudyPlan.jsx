import { useState } from 'react'
import { BookOpen, Loader2, Sparkles, AlertCircle, ChevronDown, ChevronUp, Save, RefreshCw } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { summarizeSlides } from '../utils/pptxParser'
import { generateMessage } from '../utils/api'

function daysUntil(dateStr) {
  const target = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24))
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
    : 'No course materials uploaded yet. Create a general nursing study plan based on the student\'s context.'

  const examSection = upcomingExams.length > 0
    ? upcomingExams.map(e => `- ${e.title}: ${e.date} (${daysUntil(e.date)} days away)`).join('\n')
    : 'No exams scheduled yet.'

  const clinicalSection = upcomingClinicals.length > 0
    ? upcomingClinicals.map(e => `- ${e.title}: ${e.date} (${daysUntil(e.date)} days away)`).join('\n')
    : 'None in the next 2 weeks.'

  const healthSection = avg !== null
    ? `Mental health: ${todayCheckin.mental}/10, Physical health: ${todayCheckin.physical}/10, Average: ${avg}/10${todayCheckin.notes ? `, Notes: "${todayCheckin.notes}"` : ''}`
    : 'No check-in today.'

  const profileSection = learningProfile.howILearn
    ? [
        `How she learns: ${learningProfile.howILearn}`,
        learningProfile.weakAreas ? `Challenging areas: ${learningProfile.weakAreas}` : '',
        learningProfile.styles?.length ? `Preferred study methods: ${learningProfile.styles.join(', ')}` : '',
        `Preferred session length: ${learningProfile.sessionLength} minutes`,
        `Best time of day: ${learningProfile.bestTimeOfDay}`,
        learningProfile.extraNotes ? `Additional context: ${learningProfile.extraNotes}` : '',
      ].filter(Boolean).join('\n')
    : 'No learning profile set yet — use reasonable defaults.'

  return `You are a personalized nursing study coach. Create a detailed, practical, day-by-day study plan for a nursing student.

Today's date: ${today}

## Student's Wellness Today
${healthSection}

IMPORTANT: Adjust the intensity and duration of today's study plan based on her wellness score. If the average is 4 or below, make today very light. If 7+, she can handle full sessions.

## Learning Profile
${profileSection}

## Upcoming Exams & Quizzes
${examSection}

## Upcoming Clinical Sessions (plan lighter study the day before/after)
${clinicalSection}

## Course Materials (extracted from uploaded PowerPoints)
${materialsSection}

## Your Task
Create a day-by-day study plan from today (${today}) through the day before the next exam. For each day:

1. **Day header** with the date and day of week
2. **Study mode** for the day (based on proximity to exam, clinicals, and today's health for today only)
3. **Topics to cover** — specific slide content from the uploaded materials, distributed intelligently
4. **Study techniques** — personalized to her learning profile (methods like flashcards, mnemonics, practice questions, etc.)
5. **Session breakdown** — how many sessions, how long each, what to do in each
6. **Time estimate** for the day total
7. **Self-care reminder** — one brief note

Prioritize topics by:
- Proximity to exam date (closer = more review of that content)
- Breadth of topic coverage (spread slides evenly over available days)
- Weakness areas from her learning profile

Format the output with clear markdown headers for each day. Keep it practical, encouraging, and achievable. Do NOT overwhelm her — this plan should feel doable, not terrifying.`
}

export default function StudyPlan() {
  const { uploadedFiles, schedule, todayCheckin, learningProfile, savedPlans, savePlan, today } = useApp()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [plan, setPlan] = useState(savedPlans[0]?.content || '')
  const [expandedHistory, setExpandedHistory] = useState(false)

  async function generatePlan() {
    setLoading(true)
    setError('')
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

  // Check readiness
  const hasFiles = uploadedFiles.length > 0
  const hasExams = schedule.some(e => e.type === 'exam')
  const hasProfile = !!learningProfile.howILearn
  const hasCheckin = !!todayCheckin

  function renderPlanHTML(markdown) {
    return markdown
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[h|u|l])(.+)$/gm, (m) => m.startsWith('<') ? m : `<p>${m}</p>`)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Study Plan Generator</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Claude analyzes your uploaded materials, exam dates, health score, and learning profile to build your personalized daily study plan.
        </p>
      </div>

      {/* Readiness checklist */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-5">
        <h2 className="font-semibold text-slate-800 mb-3 text-sm">Plan Quality Checklist</h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { done: hasFiles, label: `${uploadedFiles.length} course file(s) uploaded`, strong: true },
            { done: hasExams, label: 'Exam date(s) in schedule', strong: true },
            { done: hasCheckin, label: "Today's health check-in complete" },
            { done: hasProfile, label: 'Learning profile filled out' },
          ].map(({ done, label, strong }) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${done ? 'bg-emerald-500' : strong ? 'bg-amber-400' : 'bg-slate-200'}`} />
              <span className={`text-sm ${done ? 'text-slate-600' : strong ? 'text-amber-700 font-medium' : 'text-slate-400'}`}>{label}</span>
            </div>
          ))}
        </div>
        {!hasFiles && !hasExams && (
          <p className="text-xs text-amber-600 mt-3">
            Upload course materials and add exam dates for the best results. You can still generate a general plan without them.
          </p>
        )}
      </div>

      {/* Generate button */}
      <button
        onClick={generatePlan}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 text-white py-3.5 rounded-xl font-semibold text-base transition-colors mb-6"
      >
        {loading ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Generating your plan…</>
        ) : plan ? (
          <><RefreshCw className="w-5 h-5" /> Regenerate Study Plan</>
        ) : (
          <><Sparkles className="w-5 h-5" /> Generate My Study Plan</>
        )}
      </button>

      {error && (
        <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Generated plan */}
      {plan && !loading && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
            <BookOpen className="w-5 h-5 text-brand-500" />
            <div>
              <p className="font-semibold text-slate-800">Your Personalized Study Plan</p>
              <p className="text-xs text-slate-400">
                Generated {savedPlans[0] ? new Date(savedPlans[0].generatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}
                {' — '}{uploadedFiles.length} file(s), {schedule.filter(e => e.type === 'exam').length} exam(s)
              </p>
            </div>
            <button
              onClick={() => {
                const blob = new Blob([plan], { type: 'text/plain' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `study-plan-${today}.txt`
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 border border-slate-200 hover:border-brand-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Save className="w-3.5 h-3.5" /> Export
            </button>
          </div>
          <div
            className="plan-content p-6 prose-sm"
            dangerouslySetInnerHTML={{ __html: renderPlanHTML(plan) }}
          />
        </div>
      )}

      {/* Plan history */}
      {savedPlans.length > 1 && (
        <div className="mt-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setExpandedHistory(e => !e)}
            className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <span>Previous Plans ({savedPlans.length - 1})</span>
            {expandedHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {expandedHistory && (
            <div className="border-t border-slate-100">
              {savedPlans.slice(1).map((p, i) => (
                <div key={i} className="border-b border-slate-100 last:border-0">
                  <button
                    onClick={() => setPlan(p.content)}
                    className="w-full px-5 py-3 text-left hover:bg-slate-50"
                  >
                    <p className="text-sm text-slate-700">
                      {new Date(p.generatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-slate-400">{p.fileCount} file(s), {p.examCount} exam(s)</p>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
