import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2, X } from 'lucide-react'
import { useApp } from '../context/AppContext'

const EVENT_TYPES = [
  { value: 'exam',     label: 'Exam',           color: 'bg-red-500',    dot: 'bg-red-500',    badge: 'bg-red-100 text-red-700' },
  { value: 'clinical', label: 'Clinical',        color: 'bg-violet-500', dot: 'bg-violet-500', badge: 'bg-violet-100 text-violet-700' },
  { value: 'study',    label: 'Study Block',     color: 'bg-blue-500',  dot: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700' },
  { value: 'quiz',     label: 'Quiz',            color: 'bg-amber-500', dot: 'bg-amber-500',  badge: 'bg-amber-100 text-amber-700' },
  { value: 'other',    label: 'Other',           color: 'bg-slate-400', dot: 'bg-slate-400',  badge: 'bg-slate-100 text-slate-600' },
]

function typeInfo(type) {
  return EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[4]
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}
function firstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}
function isoDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function ScheduleBuilder() {
  const { schedule, addScheduleEvent, removeScheduleEvent } = useApp()
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', type: 'exam', time: '', notes: '' })

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  function eventsOnDate(dateStr) {
    return schedule.filter(e => e.date === dateStr)
  }

  function handleDayClick(dateStr) {
    setSelectedDate(dateStr)
  }

  function handleAddEvent() {
    if (!form.title.trim() || !selectedDate) return
    addScheduleEvent({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      date: selectedDate,
      title: form.title.trim(),
      type: form.type,
      time: form.time,
      notes: form.notes.trim(),
    })
    setForm({ title: '', type: 'exam', time: '', notes: '' })
    setShowForm(false)
  }

  const days = daysInMonth(viewYear, viewMonth)
  const firstDay = firstDayOfMonth(viewYear, viewMonth)
  const todayStr = now.toISOString().split('T')[0]

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Selected date events
  const selectedEvents = selectedDate ? eventsOnDate(selectedDate) : []

  // Upcoming events list
  const upcoming = [...schedule]
    .filter(e => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 10)

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Schedule</h1>
        <p className="text-slate-500 mt-1 text-sm">Add exams, clinicals, and study blocks to build your study plan around.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h2 className="font-semibold text-slate-800">{monthLabel}</h2>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100">
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty leading cells */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {/* Day cells */}
            {Array.from({ length: days }).map((_, i) => {
              const day = i + 1
              const dateStr = isoDate(viewYear, viewMonth, day)
              const isToday = dateStr === todayStr
              const isSelected = dateStr === selectedDate
              const events = eventsOnDate(dateStr)
              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(dateStr)}
                  className={`relative h-12 rounded-lg flex flex-col items-center justify-start pt-1.5 text-sm transition-colors ${
                    isSelected ? 'bg-brand-600 text-white' :
                    isToday ? 'bg-brand-50 text-brand-700 font-semibold' :
                    'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-sm">{day}</span>
                  {events.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {events.slice(0, 3).map(e => (
                        <span key={e.id} className={`w-1.5 h-1.5 rounded-full ${typeInfo(e.type).dot} ${isSelected ? 'opacity-80' : ''}`} />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-100">
            {EVENT_TYPES.map(t => (
              <div key={t.value} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${t.dot}`} />
                <span className="text-xs text-slate-500">{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Selected date */}
          {selectedDate && (
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800 text-sm">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </h3>
                <button
                  onClick={() => { setShowForm(true) }}
                  className="flex items-center gap-1 text-xs bg-brand-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-brand-700"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>

              {selectedEvents.length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-3">No events. Click Add to schedule one.</p>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map(e => {
                    const t = typeInfo(e.type)
                    return (
                      <div key={e.id} className="flex items-start gap-2.5 group">
                        <span className={`w-2 h-2 rounded-full ${t.dot} mt-1.5 flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{e.title}</p>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${t.badge}`}>{t.label}</span>
                            {e.time && <span className="text-xs text-slate-400">{e.time}</span>}
                          </div>
                          {e.notes && <p className="text-xs text-slate-400 mt-0.5">{e.notes}</p>}
                        </div>
                        <button
                          onClick={() => removeScheduleEvent(e.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Upcoming events */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h3 className="font-semibold text-slate-800 text-sm mb-3">Upcoming</h3>
            {upcoming.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-2">Nothing scheduled yet.</p>
            ) : (
              <div className="space-y-2.5">
                {upcoming.map(e => {
                  const t = typeInfo(e.type)
                  return (
                    <div key={e.id} className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full ${t.dot} flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-800 truncate">{e.title}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${t.badge}`}>{t.label}</span>
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-slate-800">Add Event</h2>
              <button onClick={() => setShowForm(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Event Title *</label>
                <input
                  autoFocus
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  placeholder="e.g. Pharmacology Midterm"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddEvent() }}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Type</label>
                <select
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                >
                  {EVENT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Time (optional)</label>
                <input
                  type="time"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  value={form.time}
                  onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Notes (optional)</label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  placeholder="Any details…"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 border border-slate-300 text-slate-700 text-sm py-2 rounded-lg hover:bg-slate-50">
                  Cancel
                </button>
                <button onClick={handleAddEvent} disabled={!form.title.trim()} className="flex-1 bg-brand-600 text-white text-sm py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50">
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
