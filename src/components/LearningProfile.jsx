import { useState } from 'react'
import { Brain, CheckCircle2, Save } from 'lucide-react'
import { useApp } from '../context/AppContext'

const STYLES = [
  { id: 'visual',     label: 'Visual',         desc: 'Diagrams, charts, color-coding' },
  { id: 'reading',    label: 'Reading/Writing', desc: 'Notes, textbooks, summaries' },
  { id: 'auditory',   label: 'Auditory',        desc: 'Lectures, talking through content' },
  { id: 'kinesthetic',label: 'Kinesthetic',     desc: 'Practice, scenarios, case studies' },
  { id: 'flashcards', label: 'Flashcards',      desc: 'Active recall and spaced repetition' },
  { id: 'questions',  label: 'Practice Questions', desc: 'NCLEX-style Q&A' },
  { id: 'group',      label: 'Study Groups',    desc: 'Collaborative learning with peers' },
  { id: 'teaching',   label: 'Teaching Back',   desc: 'Explaining concepts out loud' },
]

const TIMES = [
  { value: 'early-morning', label: 'Early Morning (5–8am)' },
  { value: 'morning',       label: 'Morning (8am–12pm)' },
  { value: 'afternoon',     label: 'Afternoon (12–5pm)' },
  { value: 'evening',       label: 'Evening (5–9pm)' },
  { value: 'night',         label: 'Night (9pm+)' },
]

const LENGTHS = [
  { value: 25,  label: '25 min (Pomodoro)' },
  { value: 45,  label: '45 min' },
  { value: 60,  label: '60 min' },
  { value: 90,  label: '90 min' },
  { value: 120, label: '2 hours' },
]

export default function LearningProfile() {
  const { learningProfile, setLearningProfile } = useApp()
  const [form, setForm] = useState({ ...learningProfile })
  const [saved, setSaved] = useState(false)

  function toggleStyle(id) {
    const styles = form.styles || []
    const next = styles.includes(id) ? styles.filter(s => s !== id) : [...styles, id]
    setForm(f => ({ ...f, styles: next }))
    setSaved(false)
  }

  function handleSave() {
    setLearningProfile({ ...form })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Learning Profile</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Tell us how you study and comprehend best — Claude uses this to personalize every study plan it generates.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-7">

        {/* Free-form learning description */}
        <div>
          <label className="block font-medium text-slate-800 mb-1">
            How do you learn and comprehend best?
          </label>
          <p className="text-slate-500 text-xs mb-2">
            Be as specific as you like — the more detail, the better your personalized plan.
          </p>
          <textarea
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            rows={5}
            placeholder="e.g. I learn best by reading through the slides first, then making my own condensed notes. I struggle with pharmacology drug names and need mnemonics. I remember concepts better when I can relate them to real clinical scenarios. I get overwhelmed when I try to study too many topics in one session…"
            value={form.howILearn || ''}
            onChange={e => { setForm(f => ({ ...f, howILearn: e.target.value })); setSaved(false) }}
          />
        </div>

        {/* Learning styles */}
        <div>
          <label className="block font-medium text-slate-800 mb-1">Preferred Study Methods</label>
          <p className="text-slate-500 text-xs mb-3">Select all that apply.</p>
          <div className="grid grid-cols-2 gap-2">
            {STYLES.map(s => {
              const selected = (form.styles || []).includes(s.id)
              return (
                <button
                  key={s.id}
                  onClick={() => toggleStyle(s.id)}
                  className={`text-left px-4 py-3 rounded-xl border transition-all ${
                    selected
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Best time of day */}
        <div>
          <label className="block font-medium text-slate-800 mb-2">Best Time to Study</label>
          <div className="flex flex-wrap gap-2">
            {TIMES.map(t => (
              <button
                key={t.value}
                onClick={() => { setForm(f => ({ ...f, bestTimeOfDay: t.value })); setSaved(false) }}
                className={`text-sm px-3 py-1.5 rounded-lg border transition-all ${
                  form.bestTimeOfDay === t.value
                    ? 'border-brand-500 bg-brand-50 text-brand-700 font-medium'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Session length */}
        <div>
          <label className="block font-medium text-slate-800 mb-2">Preferred Session Length</label>
          <div className="flex flex-wrap gap-2">
            {LENGTHS.map(l => (
              <button
                key={l.value}
                onClick={() => { setForm(f => ({ ...f, sessionLength: l.value })); setSaved(false) }}
                className={`text-sm px-3 py-1.5 rounded-lg border transition-all ${
                  form.sessionLength === l.value
                    ? 'border-brand-500 bg-brand-50 text-brand-700 font-medium'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Weak areas */}
        <div>
          <label className="block font-medium text-slate-800 mb-1">Areas You Find Challenging</label>
          <p className="text-slate-500 text-xs mb-2">
            Any specific topics, concepts, or course areas that feel harder for you?
          </p>
          <textarea
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            rows={3}
            placeholder="e.g. Pharmacology drug classifications, EKG interpretation, prioritization questions…"
            value={form.weakAreas || ''}
            onChange={e => { setForm(f => ({ ...f, weakAreas: e.target.value })); setSaved(false) }}
          />
        </div>

        {/* Additional notes */}
        <div>
          <label className="block font-medium text-slate-800 mb-1">Anything Else Claude Should Know?</label>
          <textarea
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            rows={2}
            placeholder="e.g. I have a toddler, so mornings are chaotic. I have 2 hours max per day. I learn better with bullet points, not long paragraphs…"
            value={form.extraNotes || ''}
            onChange={e => { setForm(f => ({ ...f, extraNotes: e.target.value })); setSaved(false) }}
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-2.5 rounded-lg font-medium hover:bg-brand-700 transition-colors"
        >
          {saved ? (
            <><CheckCircle2 className="w-4 h-4" /> Profile Saved!</>
          ) : (
            <><Save className="w-4 h-4" /> Save Learning Profile</>
          )}
        </button>
      </div>

      {/* Profile summary */}
      {learningProfile.howILearn && (
        <div className="mt-5 bg-brand-50 border border-brand-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-brand-600" />
            <p className="text-sm font-medium text-brand-700">Current Profile Summary</p>
          </div>
          <p className="text-sm text-slate-600 italic">"{learningProfile.howILearn.slice(0, 200)}{learningProfile.howILearn.length > 200 ? '…' : ''}"</p>
          {learningProfile.styles?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {learningProfile.styles.map(s => (
                <span key={s} className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">
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
