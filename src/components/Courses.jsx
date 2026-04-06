import { useState } from 'react'
import { BookMarked, Plus, Trash2, X, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Star } from 'lucide-react'
import { useApp } from '../context/AppContext'

const CONFIDENCE_LABELS = ['', 'Lost 😟', 'Shaky 😕', 'Getting it 🙂', 'Solid 💪', 'Mastered ⭐']
const CONFIDENCE_COLORS = ['', '#ef4444', '#f59e0b', '#3b82f6', '#0091cd', '#10b981']
const CONFIDENCE_BG     = ['', '#fef2f2', '#fffbeb', '#eff6ff', '#e0f2fe', '#ecfdf5']

function latestConfidence(topic) {
  if (!topic.logs || topic.logs.length === 0) return null
  return topic.logs[0].confidence
}

function trend(topic) {
  const logs = topic.logs || []
  if (logs.length < 2) return 'new'
  const recent = logs.slice(0, 3).map(l => l.confidence)
  const avg1 = recent[0]
  const avg2 = recent[recent.length - 1]
  if (avg1 > avg2) return 'up'
  if (avg1 < avg2) return 'down'
  return 'flat'
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const target = new Date(dateStr + 'T00:00:00')
  const now = new Date(); now.setHours(0,0,0,0)
  return Math.ceil((target - now) / 86400000)
}

export default function Courses() {
  const { courses, addCourse, removeCourse, addTopic, removeTopic, logConfidence, today } = useApp()
  const [expandedCourse, setExpandedCourse] = useState(null)
  const [showCourseForm, setShowCourseForm] = useState(false)
  const [showTopicForm, setShowTopicForm]   = useState(null) // courseId
  const [logForm, setLogForm]               = useState(null) // { courseId, topicId }
  const [courseForm, setCourseForm] = useState({ name: '', examDate: '' })
  const [topicForm, setTopicForm]   = useState({ name: '' })
  const [logEntry, setLogEntry]     = useState({ confidence: 3, notes: '' })

  function handleAddCourse() {
    if (!courseForm.name.trim()) return
    addCourse({
      id: `c-${Date.now()}`,
      name: courseForm.name.trim(),
      examDate: courseForm.examDate,
      topics: [],
    })
    setCourseForm({ name: '', examDate: '' })
    setShowCourseForm(false)
  }

  function handleAddTopic(courseId) {
    if (!topicForm.name.trim()) return
    addTopic(courseId, {
      id: `t-${Date.now()}`,
      name: topicForm.name.trim(),
      logs: [],
    })
    setTopicForm({ name: '' })
    setShowTopicForm(null)
  }

  function handleLogConfidence() {
    if (!logForm) return
    logConfidence(logForm.courseId, logForm.topicId, {
      date: today,
      confidence: logEntry.confidence,
      notes: logEntry.notes.trim(),
    })
    setLogEntry({ confidence: 3, notes: '' })
    setLogForm(null)
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto animate-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <BookMarked className="w-4 h-4" style={{ color: '#0091cd' }} />
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#0091cd' }}>Topic Tracker</p>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Courses</h1>
            <p className="text-slate-500 text-sm mt-1">Track how confident you feel on each topic after studying in NotebookLM. Florence uses this to prioritize your daily focus.</p>
          </div>
          <button onClick={() => setShowCourseForm(true)} className="btn-primary flex-shrink-0">
            <Plus className="w-4 h-4" /> Add Course
          </button>
        </div>
      </div>

      {/* Empty state */}
      {courses.length === 0 && (
        <div className="card p-10 text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: '#e0f2fe' }}>
            <BookMarked className="w-6 h-6" style={{ color: '#0091cd' }} />
          </div>
          <p className="font-semibold text-slate-700 mb-1">No courses yet</p>
          <p className="text-slate-400 text-sm mb-4">Add your nursing courses and the topics inside them. After each NotebookLM session, log how confident you feel on each topic.</p>
          <button onClick={() => setShowCourseForm(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Your First Course
          </button>
        </div>
      )}

      {/* Course list */}
      <div className="space-y-4">
        {courses.map(course => {
          const isExpanded = expandedCourse === course.id
          const d = daysUntil(course.examDate)
          const topics = course.topics || []
          const needsAttention = topics.filter(t => {
            const c = latestConfidence(t)
            return c !== null && c <= 2
          })
          const noLog = topics.filter(t => (t.logs || []).length === 0)

          return (
            <div key={course.id} className="card overflow-hidden">
              {/* Course header */}
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #0d2137, #0074a4)' }}>
                  <BookMarked className="w-5 h-5 text-sky-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800">{course.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-slate-400">{topics.length} topic{topics.length !== 1 ? 's' : ''}</span>
                    {course.examDate && d !== null && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: d <= 3 ? '#fef2f2' : d <= 7 ? '#fffbeb' : '#e0f2fe',
                          color:      d <= 3 ? '#dc2626' : d <= 7 ? '#d97706' : '#0074a4',
                        }}>
                        Exam {d === 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d}d`}
                      </span>
                    )}
                    {needsAttention.length > 0 && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: '#fef2f2', color: '#dc2626' }}>
                        ⚠ {needsAttention.length} need{needsAttention.length === 1 ? 's' : ''} review
                      </span>
                    )}
                    {noLog.length > 0 && (
                      <span className="text-xs text-slate-400">{noLog.length} unrated</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={e => { e.stopPropagation(); removeCourse(course.id) }}
                    className="p-1.5 text-slate-300 hover:text-red-400 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </div>

              {/* Topics */}
              {isExpanded && (
                <div className="border-t border-slate-100">
                  {/* Topic list */}
                  {topics.length > 0 && (
                    <div className="p-4 space-y-2">
                      {topics.map(topic => {
                        const conf = latestConfidence(topic)
                        const t = trend(topic)
                        const lastLog = topic.logs?.[0]
                        return (
                          <div key={topic.id}
                            className="flex items-center gap-3 p-3 rounded-xl group"
                            style={{ background: conf !== null ? CONFIDENCE_BG[conf] : '#f8fafc', border: '1px solid #e2e8f0' }}>
                            {/* Confidence score */}
                            <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0 font-bold text-sm"
                              style={{ background: conf !== null ? CONFIDENCE_COLORS[conf] + '22' : '#e2e8f0', color: conf !== null ? CONFIDENCE_COLORS[conf] : '#94a3b8' }}>
                              {conf !== null ? conf : '—'}
                              {conf !== null && <Star className="w-2.5 h-2.5 mt-0.5" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-slate-800 truncate">{topic.name}</p>
                                {t === 'up'   && <TrendingUp   className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#10b981' }} />}
                                {t === 'down' && <TrendingDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#ef4444' }} />}
                                {t === 'flat' && <Minus        className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#f59e0b' }} />}
                              </div>
                              <p className="text-xs mt-0.5" style={{ color: conf !== null ? CONFIDENCE_COLORS[conf] : '#94a3b8' }}>
                                {conf !== null ? CONFIDENCE_LABELS[conf] : 'Not yet rated'}
                                {lastLog && <span className="text-slate-400 ml-1.5">· {lastLog.date}</span>}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => { setLogForm({ courseId: course.id, topicId: topic.id }); setLogEntry({ confidence: conf || 3, notes: '' }) }}
                                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                                style={{ background: '#e0f2fe', color: '#0074a4' }}
                              >
                                Log
                              </button>
                              <button
                                onClick={() => removeTopic(course.id, topic.id)}
                                className="p-1.5 text-slate-300 hover:text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Add topic */}
                  {showTopicForm === course.id ? (
                    <div className="px-4 pb-4">
                      <div className="flex gap-2">
                        <input
                          autoFocus
                          className="input flex-1 text-sm"
                          placeholder="Topic name, e.g. Acid-Base Balance"
                          value={topicForm.name}
                          onChange={e => setTopicForm({ name: e.target.value })}
                          onKeyDown={e => { if (e.key === 'Enter') handleAddTopic(course.id); if (e.key === 'Escape') setShowTopicForm(null) }}
                        />
                        <button onClick={() => handleAddTopic(course.id)} className="btn-primary text-sm px-4">Add</button>
                        <button onClick={() => setShowTopicForm(null)} className="btn-ghost text-sm px-3">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 pb-4">
                      <button
                        onClick={() => setShowTopicForm(course.id)}
                        className="w-full flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-xl border-2 border-dashed transition-colors"
                        style={{ borderColor: '#e2e8f0', color: '#94a3b8' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#0091cd'; e.currentTarget.style.color = '#0091cd' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#94a3b8' }}
                      >
                        <Plus className="w-4 h-4" /> Add Topic
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add Course modal */}
      {showCourseForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-slate-900">Add Course</h2>
              <button onClick={() => setShowCourseForm(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Course Name *</label>
                <input
                  autoFocus className="input"
                  placeholder="e.g. Pharmacology, Pathophysiology I…"
                  value={courseForm.name}
                  onChange={e => setCourseForm(f => ({ ...f, name: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddCourse() }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Exam Date (optional)</label>
                <input type="date" className="input" value={courseForm.examDate}
                  onChange={e => setCourseForm(f => ({ ...f, examDate: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowCourseForm(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
                <button onClick={handleAddCourse} disabled={!courseForm.name.trim()} className="btn-primary flex-1 justify-center disabled:opacity-50">
                  Add Course
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Log Confidence modal */}
      {logForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-slate-900">Log Confidence</h2>
              <button onClick={() => setLogForm(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-500 text-sm mb-5">
              How confident do you feel about <strong>{courses.find(c => c.id === logForm.courseId)?.topics?.find(t => t.id === logForm.topicId)?.name}</strong> right now?
            </p>

            <div className="space-y-2 mb-5">
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  onClick={() => setLogEntry(e => ({ ...e, confidence: n }))}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left"
                  style={{
                    borderColor: logEntry.confidence === n ? CONFIDENCE_COLORS[n] : '#e2e8f0',
                    background:  logEntry.confidence === n ? CONFIDENCE_BG[n] : 'white',
                  }}
                >
                  <span className="text-xl font-bold w-6" style={{ color: CONFIDENCE_COLORS[n] }}>{n}</span>
                  <span className="text-sm font-semibold text-slate-700">{CONFIDENCE_LABELS[n]}</span>
                </button>
              ))}
            </div>

            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Notes (optional)</label>
              <input className="input" placeholder="What clicked? What's still fuzzy?"
                value={logEntry.notes}
                onChange={e => setLogEntry(l => ({ ...l, notes: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') handleLogConfidence() }}
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setLogForm(null)} className="btn-ghost flex-1 justify-center">Cancel</button>
              <button onClick={handleLogConfidence} className="btn-primary flex-1 justify-center">Save Log</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
