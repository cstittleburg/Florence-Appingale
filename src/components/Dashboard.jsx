import { useNavigate } from 'react-router-dom'
import { Heart, BookOpen, Calendar, Upload, Brain, MessageCircle, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useApp } from '../context/AppContext'

const QUOTES = [
  "Every expert was once a beginner. You are exactly where you need to be.",
  "The care you give your patients starts with the care you give yourself.",
  "Nursing is not just a career — it's a calling. You answered it.",
  "Hard days build strong nurses. You've got this.",
  "One concept at a time. One day at a time. You are doing amazing.",
  "The patients who will one day thank you are rooting for you right now.",
  "Progress, not perfection. Keep going.",
  "You chose one of the most courageous professions. That courage is in you every day.",
]

function todayQuote() {
  const day = new Date().getDay()
  return QUOTES[day % QUOTES.length]
}

function healthLabel(score) {
  if (!score) return { text: 'Not checked in', color: 'text-slate-400', bg: 'bg-slate-100' }
  if (score <= 3) return { text: 'Rest mode', color: 'text-red-600', bg: 'bg-red-50' }
  if (score <= 5) return { text: 'Light study day', color: 'text-amber-600', bg: 'bg-amber-50' }
  if (score <= 7) return { text: 'Good to study', color: 'text-blue-600', bg: 'bg-blue-50' }
  return { text: 'High energy!', color: 'text-emerald-600', bg: 'bg-emerald-50' }
}

function daysUntil(dateStr) {
  const target = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24))
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { studentName, setStudentName, todayCheckin, uploadedFiles, schedule, savedPlans } = useApp()

  const upcomingExams = schedule
    .filter(e => e.type === 'exam' && daysUntil(e.date) >= 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3)

  const upcomingClinicals = schedule
    .filter(e => e.type === 'clinical' && daysUntil(e.date) >= 0 && daysUntil(e.date) <= 7)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  const avg = todayCheckin
    ? Math.round((todayCheckin.mental + todayCheckin.physical) / 2)
    : null
  const hl = healthLabel(avg)

  const lastPlan = savedPlans[0] || null

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        {!studentName ? (
          <div className="bg-brand-50 border border-brand-200 rounded-xl p-5 mb-6">
            <p className="text-brand-700 font-medium mb-2">Welcome! What's your name?</p>
            <div className="flex gap-3">
              <input
                className="border border-brand-300 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-brand-400"
                placeholder="Enter your name…"
                onKeyDown={e => { if (e.key === 'Enter' && e.target.value.trim()) setStudentName(e.target.value.trim()) }}
              />
              <button
                className="bg-brand-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-brand-700"
                onClick={e => {
                  const inp = e.target.previousSibling
                  if (inp.value.trim()) setStudentName(inp.value.trim())
                }}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Good {getTimeOfDay()}, {studentName} 👋
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        )}
      </div>

      {/* Daily quote */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-6 mb-6 text-white">
        <p className="text-brand-200 text-xs font-medium uppercase tracking-wider mb-2">Daily Motivation</p>
        <p className="text-lg font-medium leading-relaxed">"{todayQuote()}"</p>
      </div>

      {/* Status cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Heart className="w-5 h-5" />}
          label="Wellness"
          value={avg ? `${avg}/10` : '—'}
          sub={hl.text}
          color={avg ? (avg <= 3 ? 'red' : avg <= 5 ? 'amber' : avg <= 7 ? 'blue' : 'emerald') : 'slate'}
          onClick={() => navigate('/health')}
        />
        <StatCard
          icon={<Upload className="w-5 h-5" />}
          label="Materials"
          value={uploadedFiles.length}
          sub={`file${uploadedFiles.length !== 1 ? 's' : ''} uploaded`}
          color="violet"
          onClick={() => navigate('/upload')}
        />
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          label="Next Exam"
          value={upcomingExams.length ? `${daysUntil(upcomingExams[0].date)}d` : '—'}
          sub={upcomingExams.length ? upcomingExams[0].title : 'None scheduled'}
          color="indigo"
          onClick={() => navigate('/schedule')}
        />
        <StatCard
          icon={<BookOpen className="w-5 h-5" />}
          label="Study Plan"
          value={lastPlan ? 'Ready' : 'None'}
          sub={lastPlan ? `Generated ${formatDate(lastPlan.generatedAt)}` : 'Generate one'}
          color="teal"
          onClick={() => navigate('/plan')}
        />
      </div>

      {/* Two-column content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Check-in status */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500" /> Today's Health Check-In
          </h2>
          {todayCheckin ? (
            <div className="space-y-3">
              <ScoreRow label="Mental" score={todayCheckin.mental} />
              <ScoreRow label="Physical" score={todayCheckin.physical} />
              {todayCheckin.notes && (
                <p className="text-slate-500 text-sm italic mt-2">"{todayCheckin.notes}"</p>
              )}
              <div className={`mt-3 rounded-lg px-3 py-2 ${hl.bg}`}>
                <p className={`text-sm font-medium ${hl.color}`}>
                  Recommendation: {studyRecommendation(avg)}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-slate-400 text-sm mb-3">You haven't checked in today yet.</p>
              <button
                onClick={() => navigate('/health')}
                className="bg-rose-500 hover:bg-rose-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
              >
                Check In Now
              </button>
            </div>
          )}
        </div>

        {/* Upcoming exams */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-500" /> Upcoming Exams
          </h2>
          {upcomingExams.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-slate-400 text-sm mb-3">No exams scheduled yet.</p>
              <button
                onClick={() => navigate('/schedule')}
                className="bg-brand-600 hover:bg-brand-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
              >
                Add Exam Date
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingExams.map(exam => {
                const d = daysUntil(exam.date)
                return (
                  <div key={exam.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{exam.title}</p>
                      <p className="text-xs text-slate-400">{formatDateStr(exam.date)}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      d <= 3 ? 'bg-red-100 text-red-700' :
                      d <= 7 ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {d === 0 ? 'TODAY' : d === 1 ? 'Tomorrow' : `${d} days`}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Clinical alert */}
          {upcomingClinicals.length > 0 && (
            <div className="mt-4 bg-violet-50 border border-violet-200 rounded-lg px-3 py-2">
              <p className="text-violet-700 text-xs font-medium">
                🏥 Clinical in {daysUntil(upcomingClinicals[0].date) === 0 ? 'today' : `${daysUntil(upcomingClinicals[0].date)} day(s)`} — plan for lighter study around it.
              </p>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { icon: <Upload className="w-4 h-4" />, label: 'Upload a PowerPoint', to: '/upload', color: 'text-violet-600' },
              { icon: <BookOpen className="w-4 h-4" />, label: 'Generate Today\'s Study Plan', to: '/plan', color: 'text-brand-600' },
              { icon: <Brain className="w-4 h-4" />, label: 'Update Learning Profile', to: '/profile', color: 'text-teal-600' },
              { icon: <MessageCircle className="w-4 h-4" />, label: 'Open Motivational Chat', to: '/chat', color: 'text-rose-600' },
            ].map(({ icon, label, to, color }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className={color}>{icon}</span>
                  <span className="text-sm text-slate-700 group-hover:text-slate-900">{label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
              </button>
            ))}
          </div>
        </div>

        {/* Setup checklist */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Setup Checklist</h2>
          <div className="space-y-2.5">
            <CheckItem done={!!studentName} label="Set your name" />
            <CheckItem done={uploadedFiles.length > 0} label="Upload at least one course file" />
            <CheckItem done={schedule.filter(e => e.type === 'exam').length > 0} label="Add an exam date" />
            <CheckItem done={!!todayCheckin} label="Complete today's health check-in" />
            <CheckItem done={false} label="Fill out your learning profile" needsNav="/profile" />
            <CheckItem done={savedPlans.length > 0} label="Generate a study plan" />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sub, color, onClick }) {
  const colors = {
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    teal: 'bg-teal-50 text-teal-600',
    slate: 'bg-slate-100 text-slate-500',
  }
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 p-4 text-left hover:shadow-sm transition-shadow w-full"
    >
      <div className={`w-9 h-9 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
      <p className="text-xs text-slate-500 mt-1 truncate">{sub}</p>
    </button>
  )
}

function ScoreRow({ label, score }) {
  const pct = (score / 10) * 100
  const color = score <= 3 ? 'bg-red-400' : score <= 5 ? 'bg-amber-400' : score <= 7 ? 'bg-blue-400' : 'bg-emerald-400'
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-800">{score}/10</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function CheckItem({ done, label }) {
  return (
    <div className="flex items-center gap-2.5">
      {done
        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        : <AlertCircle className="w-4 h-4 text-slate-300 flex-shrink-0" />
      }
      <span className={`text-sm ${done ? 'text-slate-500 line-through' : 'text-slate-700'}`}>{label}</span>
    </div>
  )
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function studyRecommendation(score) {
  if (!score) return 'Complete your check-in for a recommendation.'
  if (score <= 3) return 'Take it easy today. Review light notes or rest.'
  if (score <= 5) return 'Lighter study session — flashcards and review only.'
  if (score <= 7) return 'Good day for focused study. Tackle a full topic.'
  return 'Peak energy! Tackle your hardest material today.'
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDateStr(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}
