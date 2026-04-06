import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2, X, Calendar } from 'lucide-react'
import { useApp } from '../context/AppContext'

const EVENT_TYPES = [
  { value: 'exam',     label: 'Exam',         dot: '#ef4444', badge: { bg: '#fef2f2', color: '#dc2626' } },
  { value: 'clinical', label: 'Clinical',     dot: '#7c3aed', badge: { bg: '#f5f3ff', color: '#6d28d9' } },
  { value: 'study',    label: 'Study Block',  dot: '#2563eb', badge: { bg: '#eff6ff', color: '#1d4ed8' } },
  { value: 'quiz',     label: 'Quiz',         dot: '#d97706', badge: { bg: '#fffbeb', color: '#b45309' } },
  { value: 'other',    label: 'Other',        dot: '#64748b', badge: { bg: '#f1f5f9', color: '#475569' } },
]

function typeInfo(type) { return EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[4] }
function daysInMonth(y, m)  { return new Date(y, m+1, 0).getDate() }
function firstDay(y, m)     { return new Date(y, m, 1).getDay() }
function isoDate(y, m, d)   { return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}` }

export default function ScheduleBuilder() {
  const { schedule, addScheduleEvent, removeScheduleEvent } = useApp()
  const now = new Date()
  const [viewYear, setViewYear]   = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [selected, setSelected]   = useState(null)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState({ title: '', type: 'exam', time: '', notes: '' })

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y-1); setViewMonth(11) }
    else setViewMonth(m => m-1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y+1); setViewMonth(0) }
    else setViewMonth(m => m+1)
  }

  function eventsOn(dateStr) { return schedule.filter(e => e.date === dateStr) }

  function handleAdd() {
    if (!form.title.trim() || !selected) return
    addScheduleEvent({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      date: selected, title: form.title.trim(),
      type: form.type, time: form.time, notes: form.notes.trim(),
    })
    setForm({ title: '', type: 'exam', time: '', notes: '' })
    setShowForm(false)
  }

  const days    = daysInMonth(viewYear, viewMonth)
  const first   = firstDay(viewYear, viewMonth)
  const todayStr = now.toISOString().split('T')[0]
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const selectedEvents = selected ? eventsOn(selected) : []
  const upcoming = [...schedule]
    .filter(e => e.date >= todayStr)
    .sort((a,b) => a.date.localeCompare(b.date))
    .slice(0, 8)

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-4 h-4" style={{ color: '#0091cd' }} />
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#0091cd' }}>Academic Calendar</p>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Schedule</h1>
        <p className="text-slate-500 text-sm mt-1">Add exams, clinicals, and study blocks to power your study plan.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth} className="btn-ghost p-2 rounded-xl">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-slate-800 text-base">{monthLabel}</h2>
            <button onClick={nextMonth} className="btn-ghost p-2 rounded-xl">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['S','M','T','W','T','F','S'].map((d,i) => (
              <div key={i} className="text-center text-xs font-bold text-slate-400 py-1">{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: first }).map((_,i) => <div key={`e${i}`} />)}
            {Array.from({ length: days }).map((_,i) => {
              const day = i+1
              const dateStr = isoDate(viewYear, viewMonth, day)
              const isToday    = dateStr === todayStr
              const isSelected = dateStr === selected
              const events     = eventsOn(dateStr)
              return (
                <button
                  key={day}
                  onClick={() => setSelected(dateStr)}
                  className="relative h-10 md:h-12 rounded-xl flex flex-col items-center justify-start pt-1.5 transition-all text-sm"
                  style={{
                    background: isSelected ? 'linear-gradient(135deg, #0074a4, #0091cd)'
                               : isToday   ? '#e0f2fe'
                               : 'transparent',
                    color: isSelected ? 'white' : isToday ? '#0074a4' : '#374151',
                    fontWeight: isToday || isSelected ? '700' : '500',
                  }}
                >
                  <span>{day}</span>
                  {events.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {events.slice(0,3).map(e => (
                        <span key={e.id} className="w-1.5 h-1.5 rounded-full"
                          style={{ background: isSelected ? 'rgba(255,255,255,0.7)' : typeInfo(e.type).dot }} />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-slate-100">
            {EVENT_TYPES.map(t => (
              <div key={t.value} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: t.dot }} />
                <span className="text-xs text-slate-500 font-medium">{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Selected date */}
          {selected && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-slate-800 text-sm">
                    {new Date(selected + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-slate-400">{selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={() => setShowForm(true)} className="btn-primary text-xs py-1.5 px-3">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>

              {selectedEvents.length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-3">No events. Tap Add to schedule one.</p>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map(e => {
                    const t = typeInfo(e.type)
                    return (
                      <div key={e.id} className="flex items-start gap-2.5 group p-2 rounded-xl hover:bg-slate-50">
                        <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: t.dot }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{e.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: t.badge.bg, color: t.badge.color }}>{t.label}</span>
                            {e.time && <span className="text-xs text-slate-400">{e.time}</span>}
                          </div>
                          {e.notes && <p className="text-xs text-slate-400 mt-0.5">{e.notes}</p>}
                        </div>
                        <button onClick={() => removeScheduleEvent(e.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-300 hover:text-red-400 transition-all flex-shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Upcoming */}
          <div className="card p-4">
            <p className="section-header">
              <Calendar className="w-3.5 h-3.5" style={{ color: '#0091cd' }} />
              Upcoming Events
            </p>
            {upcoming.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-2">Nothing scheduled yet.</p>
            ) : (
              <div className="space-y-2.5">
                {upcoming.map(e => {
                  const t = typeInfo(e.type)
                  return (
                    <div key={e.id} className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t.dot }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{e.title}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(e.date+'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: t.badge.bg, color: t.badge.color }}>{t.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add event modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-slate-900">Add Event</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Event Title *</label>
                <input
                  autoFocus
                  className="input"
                  placeholder="e.g. Pharmacology Midterm"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Type</label>
                <select
                  className="input"
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                >
                  {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Time (optional)</label>
                <input type="time" className="input" value={form.time}
                  onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Notes (optional)</label>
                <input className="input" placeholder="Any details…" value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowForm(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
                <button onClick={handleAdd} disabled={!form.title.trim()} className="btn-primary flex-1 justify-center disabled:opacity-50">
                  Add Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
