import { useState } from 'react'
import { Brain, Save, CheckCircle2 } from 'lucide-react'
import { useApp } from '../context/AppContext'

const STYLES = [
  { id: 'visual',      label: 'Visual',              desc: 'Diagrams, charts, color-coding' },
  { id: 'reading',     label: 'Reading / Writing',   desc: 'Notes, textbooks, summaries' },
  { id: 'auditory',    label: 'Auditory',             desc: 'Lectures, talking through content' },
  { id: 'kinesthetic', label: 'Kinesthetic',          desc: 'Practice, scenarios, case studies' },
  { id: 'flashcards',  label: 'Flashcards',           desc: 'Active recall, spaced repetition' },
  { id: 'questions',   label: 'Practice Questions',   desc: 'NCLEX-style Q&A' },
  { id: 'group',       label: 'Study Groups',         desc: 'Collaborative learning' },
  { id: 'teaching',    label: 'Teaching Back',        desc: 'Explaining concepts out loud' },
]

const TIMES = [
  { value: 'early-morning', label: 'Early Morning', sub: '5–8am' },
  { value: 'morning',       label: 'Morning',       sub: '8am–12pm' },
  { value: 'afternoon',     label: 'Afternoon',     sub: '12–5pm' },
  { value: 'evening',       label: 'Evening',       sub: '5–9pm' },
  { value: 'night',         label: 'Night',         sub: '9pm+' },
]

const LENGTHS = [
  { value: 25,  label: '25 min', sub: 'Pomodoro' },
  { value: 45,  label: '45 min', sub: 'Standard' },
  { value: 60,  label: '60 min', sub: 'Extended' },
  { value: 90,  label: '90 min', sub: 'Deep work' },
  { value: 120, label: '2 hrs',  sub: 'Marathon' },
]

export default function LearningProfile() {
  const { learningProfile, setLearningProfile } = useApp()
  const [form, setForm] = useState({ ...learningProfile })
  const [saved, setSaved] = useState(false)

  function toggleStyle(id) {
    const styles = form.styles || []
    setForm(f => ({ ...f, styles: styles.includes(id) ? styles.filter(s => s !== id) : [...styles, id] }))
    setSaved(false)
  }

  function handleSave() {
    setLearningProfile({ ...form })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto animate-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-4 h-4" style={{ color: '#0091cd' }} />
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#0091cd' }}>Patient Profile</p>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Learning Profile</h1>
        <p className="text-slate-500 text-sm mt-1">Tell Florence how you learn best — every study plan is personalized to this.</p>
      </div>

      <div className="card p-5 md:p-6 space-y-7">

        {/* Free-form */}
        <div>
          <label className="block font-semibold text-slate-800 mb-1">
            How do you learn and comprehend best?
          </label>
          <p className="text-xs text-slate-400 mb-2">Be specific — the more detail, the more personalized your plan.</p>
          <textarea
            className="input resize-none"
            rows={5}
            placeholder="e.g. I learn best by reading slides first, then making condensed notes. I struggle with pharmacology drug names and need mnemonics. I remember better when I connect concepts to real clinical scenarios. I get overwhelmed studying too many topics at once…"
            value={form.howILearn || ''}
            onChange={e => { setForm(f => ({ ...f, howILearn: e.target.value })); setSaved(false) }}
          />
        </div>

        {/* Learning styles */}
        <div>
          <label className="block font-semibold text-slate-800 mb-1">Preferred Study Methods</label>
          <p className="text-xs text-slate-400 mb-3">Select all that apply</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {STYLES.map(s => {
              const selected = (form.styles || []).includes(s.id)
              return (
                <button
                  key={s.id}
                  onClick={() => toggleStyle(s.id)}
                  className="text-left px-4 py-3 rounded-xl border transition-all"
                  style={{
                    borderColor: selected ? '#0091cd' : '#e2e8f0',
                    background:  selected ? '#e0f2fe' : 'white',
                    color:       selected ? '#0074a4' : '#374151',
                  }}
                >
                  <p className="text-sm font-semibold">{s.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: selected ? '#0091cd' : '#94a3b8' }}>{s.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Best time */}
        <div>
          <label className="block font-semibold text-slate-800 mb-3">Best Time to Study</label>
          <div className="flex flex-wrap gap-2">
            {TIMES.map(t => (
              <button
                key={t.value}
                onClick={() => { setForm(f => ({ ...f, bestTimeOfDay: t.value })); setSaved(false) }}
                className="flex flex-col items-center px-4 py-2.5 rounded-xl border transition-all"
                style={{
                  borderColor: form.bestTimeOfDay === t.value ? '#0091cd' : '#e2e8f0',
                  background:  form.bestTimeOfDay === t.value ? '#e0f2fe' : 'white',
                }}
              >
                <span className="text-sm font-semibold" style={{ color: form.bestTimeOfDay === t.value ? '#0074a4' : '#374151' }}>{t.label}</span>
                <span className="text-xs" style={{ color: form.bestTimeOfDay === t.value ? '#0091cd' : '#94a3b8' }}>{t.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Session length */}
        <div>
          <label className="block font-semibold text-slate-800 mb-3">Preferred Session Length</label>
          <div className="flex flex-wrap gap-2">
            {LENGTHS.map(l => (
              <button
                key={l.value}
                onClick={() => { setForm(f => ({ ...f, sessionLength: l.value })); setSaved(false) }}
                className="flex flex-col items-center px-4 py-2.5 rounded-xl border transition-all"
                style={{
                  borderColor: form.sessionLength === l.value ? '#0091cd' : '#e2e8f0',
                  background:  form.sessionLength === l.value ? '#e0f2fe' : 'white',
                }}
              >
                <span className="text-sm font-semibold" style={{ color: form.sessionLength === l.value ? '#0074a4' : '#374151' }}>{l.label}</span>
                <span className="text-xs" style={{ color: form.sessionLength === l.value ? '#0091cd' : '#94a3b8' }}>{l.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Weak areas */}
        <div>
          <label className="block font-semibold text-slate-800 mb-1">Challenging Areas</label>
          <p className="text-xs text-slate-400 mb-2">Topics or concepts you find harder than others</p>
          <textarea
            className="input resize-none"
            rows={2}
            placeholder="e.g. Pharmacology drug classifications, EKG interpretation, prioritization questions…"
            value={form.weakAreas || ''}
            onChange={e => { setForm(f => ({ ...f, weakAreas: e.target.value })); setSaved(false) }}
          />
        </div>

        {/* Extra notes */}
        <div>
          <label className="block font-semibold text-slate-800 mb-1">Anything Else Florence Should Know?</label>
          <textarea
            className="input resize-none"
            rows={2}
            placeholder="e.g. I have a toddler, so mornings are chaotic. Max 2 hours/day. I prefer bullet points over long paragraphs…"
            value={form.extraNotes || ''}
            onChange={e => { setForm(f => ({ ...f, extraNotes: e.target.value })); setSaved(false) }}
          />
        </div>

        <button onClick={handleSave} className="btn-primary w-full justify-center py-2.5">
          {saved
            ? <><CheckCircle2 className="w-4 h-4" /> Profile Saved!</>
            : <><Save className="w-4 h-4" /> Save Learning Profile</>
          }
        </button>
      </div>

      {/* Summary */}
      {learningProfile.howILearn && (
        <div className="mt-5 rounded-xl p-4" style={{ background: '#e0f2fe', border: '1px solid #bae6fd' }}>
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4" style={{ color: '#0074a4' }} />
            <p className="text-sm font-semibold" style={{ color: '#0074a4' }}>Saved Profile Preview</p>
          </div>
          <p className="text-sm text-slate-600 italic">
            "{learningProfile.howILearn.slice(0, 200)}{learningProfile.howILearn.length > 200 ? '…' : ''}"
          </p>
          {learningProfile.styles?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {learningProfile.styles.map(s => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: 'rgba(0,145,205,0.15)', color: '#0074a4' }}>
                  {STYLES.find(st => st.id === s)?.label || s}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
