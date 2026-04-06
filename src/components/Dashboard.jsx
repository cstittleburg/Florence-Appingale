import { useNavigate } from 'react-router-dom'
import {
  Heart, BookOpen, Calendar, Upload, Brain, MessageCircle,
  ChevronRight, AlertCircle, CheckCircle2, Activity,
  Stethoscope, ClipboardList, Pill, Clock,
} from 'lucide-react'
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
  return QUOTES[new Date().getDay() % QUOTES.length]
}

function daysUntil(dateStr) {
  const target = new Date(dateStr + 'T00:00:00')
  const now = new Date(); now.setHours(0,0,0,0)
  return Math.ceil((target - now) / 86400000)
}

function healthLabel(score) {
  if (!score) return { text: 'Not checked in', color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8' }
  if (score <= 3) return { text: 'Rest mode',        color: '#dc2626', bg: '#fef2f2', dot: '#ef4444' }
  if (score <= 5) return { text: 'Light study day',  color: '#d97706', bg: '#fffbeb', dot: '#f59e0b' }
  if (score <= 7) return { text: 'Good to study',    color: '#2563eb', bg: '#eff6ff', dot: '#3b82f6' }
  return               { text: 'Peak performance!',  color: '#059669', bg: '#ecfdf5', dot: '#10b981' }
}

function studyRec(score) {
  if (!score) return 'Complete your check-in for a personalized recommendation.'
  if (score <= 3) return 'Rest day — light review or flashcards only.'
  if (score <= 5) return 'Short 20–25 min sessions with frequent breaks.'
  if (score <= 7) return 'Good day for focused 45-min sessions on key topics.'
  return 'Peak day — tackle your hardest material first.'
}

function formatDateStr(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { studentName, setStudentName, todayCheckin, uploadedFiles, schedule, savedPlans } = useApp()

  const upcomingExams = schedule
    .filter(e => e.type === 'exam' && daysUntil(e.date) >= 0)
    .sort((a,b) => new Date(a.date) - new Date(b.date)).slice(0, 3)

  const upcomingClinicals = schedule
    .filter(e => e.type === 'clinical' && daysUntil(e.date) >= 0 && daysUntil(e.date) <= 7)
    .sort((a,b) => new Date(a.date) - new Date(b.date))

  const avg = todayCheckin ? Math.round((todayCheckin.mental + todayCheckin.physical) / 2) : null
  const hl = healthLabel(avg)
  const lastPlan = savedPlans[0] || null

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-in">
      {/* Page header */}
      <div className="mb-6">
        {!studentName ? (
          <div className="card p-5 border-l-4" style={{ borderLeftColor: '#0091cd' }}>
            <p className="font-semibold text-slate-800 mb-1">Welcome to Florence Appingale</p>
            <p className="text-slate-500 text-sm mb-3">Your personal nursing study companion. What's your name?</p>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Enter your name…"
                onKeyDown={e => { if (e.key === 'Enter' && e.target.value.trim()) setStudentName(e.target.value.trim()) }}
              />
              <button
                className="btn-primary"
                onClick={e => { const v = e.target.previousSibling.value.trim(); if(v) setStudentName(v) }}
              >Save</button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Stethoscope className="w-4 h-4" style={{ color: '#0091cd' }} />
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#0091cd' }}>
                Student Dashboard
              </p>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              {getGreeting()}, {studentName}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        )}
      </div>

      {/* Motivational banner */}
      <div className="rounded-2xl p-5 md:p-6 mb-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0d2137 0%, #0074a4 60%, #14b8a6 100%)' }}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 blur-2xl"
          style={{ background: 'white' }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-teal-300" />
            <p className="text-teal-300 text-xs font-semibold uppercase tracking-wider">Daily Affirmation</p>
          </div>
          <p className="text-white text-base md:text-lg font-medium leading-relaxed">
            "{todayQuote()}"
          </p>
        </div>
      </div>

      {/* Vitals row — stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <VitalCard
          icon={<Heart className="w-4 h-4" />}
          label="Wellness"
          value={avg ? `${avg}/10` : '—'}
          sub={hl.text}
          dotColor={hl.dot}
          accentColor="#ef4444"
          onClick={() => navigate('/health')}
        />
        <VitalCard
          icon={<ClipboardList className="w-4 h-4" />}
          label="Materials"
          value={uploadedFiles.length}
          sub={`file${uploadedFiles.length !== 1 ? 's' : ''} loaded`}
          dotColor="#a855f7"
          accentColor="#a855f7"
          onClick={() => navigate('/upload')}
        />
        <VitalCard
          icon={<Calendar className="w-4 h-4" />}
          label="Next Exam"
          value={upcomingExams.length ? `${daysUntil(upcomingExams[0].date)}d` : '—'}
          sub={upcomingExams.length ? upcomingExams[0].title : 'None scheduled'}
          dotColor="#f59e0b"
          accentColor="#f59e0b"
          onClick={() => navigate('/schedule')}
        />
        <VitalCard
          icon={<BookOpen className="w-4 h-4" />}
          label="Study Plan"
          value={lastPlan ? 'Active' : 'None'}
          sub={lastPlan ? `Updated ${fmtDate(lastPlan.generatedAt)}` : 'Generate one'}
          dotColor="#10b981"
          accentColor="#10b981"
          onClick={() => navigate('/plan')}
        />
      </div>

      {/* Two-col content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {/* Health status */}
        <div className="card p-5">
          <div className="section-header">
            <Heart className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
            Health Check-In
            <span className="ml-auto text-xs font-medium normal-case tracking-normal"
              style={{ color: new Date().toISOString().split('T')[0] === (todayCheckin?.date) ? '#10b981' : '#94a3b8' }}>
              {todayCheckin?.date === new Date().toISOString().split('T')[0] ? 'Completed today' : 'Pending'}
            </span>
          </div>

          {todayCheckin ? (
            <div className="space-y-3">
              <ScoreRow label="Mental / Emotional" score={todayCheckin.mental} color="#7c3aed" />
              <ScoreRow label="Physical / Energy"  score={todayCheckin.physical} color="#ef4444" />
              {todayCheckin.notes && (
                <div className="rounded-lg px-3 py-2 text-sm italic text-slate-500"
                  style={{ background: '#f8fafc', borderLeft: '3px solid #e2e8f0' }}>
                  "{todayCheckin.notes}"
                </div>
              )}
              <div className="rounded-lg px-3 py-2.5 flex items-start gap-2"
                style={{ background: hl.bg }}>
                <Activity className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: hl.dot }} />
                <p className="text-sm font-medium" style={{ color: hl.color }}>{studyRec(avg)}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-5">
              <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ background: '#fef2f2' }}>
                <Heart className="w-5 h-5" style={{ color: '#ef4444' }} />
              </div>
              <p className="text-slate-500 text-sm mb-3">No check-in yet today</p>
              <button onClick={() => navigate('/health')} className="btn-primary text-sm px-4 py-2">
                Check In Now
              </button>
            </div>
          )}
        </div>

        {/* Upcoming exams */}
        <div className="card p-5">
          <div className="section-header">
            <Calendar className="w-3.5 h-3.5" style={{ color: '#0091cd' }} />
            Upcoming Exams
          </div>

          {upcomingExams.length === 0 ? (
            <div className="text-center py-5">
              <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ background: '#eff6ff' }}>
                <Calendar className="w-5 h-5" style={{ color: '#3b82f6' }} />
              </div>
              <p className="text-slate-500 text-sm mb-3">No exams scheduled yet</p>
              <button onClick={() => navigate('/schedule')} className="btn-primary text-sm px-4 py-2">
                Add Exam Date
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingExams.map(exam => {
                const d = daysUntil(exam.date)
                return (
                  <div key={exam.id} className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{exam.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDateStr(exam.date)}</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full ml-3 flex-shrink-0"
                      style={{
                        background: d <= 3 ? '#fef2f2' : d <= 7 ? '#fffbeb' : '#eff6ff',
                        color:      d <= 3 ? '#dc2626' : d <= 7 ? '#d97706' : '#2563eb',
                      }}>
                      {d === 0 ? 'TODAY' : d === 1 ? 'Tomorrow' : `${d}d`}
                    </span>
                  </div>
                )
              })}

              {upcomingClinicals.length > 0 && (
                <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl text-sm"
                  style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#7c3aed' }}>
                  <Pill className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="font-medium">Clinical in {daysUntil(upcomingClinicals[0].date) === 0 ? 'today' : `${daysUntil(upcomingClinicals[0].date)} day(s)`} — plan lighter study around it.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="card p-5">
          <div className="section-header">
            <Clock className="w-3.5 h-3.5" style={{ color: '#0091cd' }} />
            Quick Actions
          </div>
          <div className="space-y-1.5">
            {[
              { icon: <Upload className="w-4 h-4" />, label: 'Upload a PowerPoint', to: '/upload', color: '#a855f7' },
              { icon: <BookOpen className="w-4 h-4" />, label: "Generate Today's Study Plan", to: '/plan', color: '#0091cd' },
              { icon: <Brain className="w-4 h-4" />, label: 'Update Learning Profile', to: '/profile', color: '#0d9488' },
              { icon: <MessageCircle className="w-4 h-4" />, label: 'Open Motivational Chat', to: '/chat', color: '#f43f5e' },
            ].map(({ icon, label, to, color }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                style={{ border: '1px solid transparent' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}18`, color }}>
                    {icon}
                  </div>
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Setup checklist */}
        <div className="card p-5">
          <div className="section-header">
            <ClipboardList className="w-3.5 h-3.5" style={{ color: '#0091cd' }} />
            Setup Checklist
          </div>
          <div className="space-y-2.5">
            <CheckItem done={!!studentName}                                    label="Set your name" />
            <CheckItem done={uploadedFiles.length > 0}                        label="Upload at least one course file" />
            <CheckItem done={schedule.filter(e => e.type==='exam').length > 0} label="Add an exam date" />
            <CheckItem done={!!todayCheckin}                                   label="Complete today's health check-in" />
            <CheckItem done={savedPlans.length > 0}                           label="Generate a study plan" />
          </div>
          {[!!studentName, uploadedFiles.length>0, schedule.filter(e=>e.type==='exam').length>0, !!todayCheckin, savedPlans.length>0].every(Boolean) && (
            <div className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
              <CheckCircle2 className="w-4 h-4" />
              All set — you're ready to study!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function VitalCard({ icon, label, value, sub, dotColor, accentColor, onClick }) {
  return (
    <button
      onClick={onClick}
      className="card p-4 text-left hover:shadow-soft transition-all w-full group active:scale-[0.98]"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${accentColor}18`, color: accentColor }}>
          {icon}
        </div>
        <div className="w-2 h-2 rounded-full" style={{ background: dotColor }} />
      </div>
      <p className="text-xl md:text-2xl font-bold text-slate-900 leading-none">{value}</p>
      <p className="text-xs text-slate-400 mt-1 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-xs text-slate-500 mt-1 truncate">{sub}</p>
    </button>
  )
}

function ScoreRow({ label, score, color }) {
  const pct = (score / 10) * 100
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className="font-bold text-slate-800">{score}/10</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function CheckItem({ done, label }) {
  return (
    <div className="flex items-center gap-2.5">
      {done
        ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#10b981' }} />
        : <div className="w-4 h-4 rounded-full border-2 flex-shrink-0" style={{ borderColor: '#e2e8f0' }} />
      }
      <span className={`text-sm ${done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{label}</span>
    </div>
  )
}

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
