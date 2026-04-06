import { createContext, useContext, useState, useEffect } from 'react'

const AppContext = createContext(null)

function load(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch { return fallback }
}

function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

export function AppProvider({ children }) {
  const [studentName,     setStudentNameRaw]     = useState(() => load('nsc_studentName', ''))
  const [learningProfile, setLearningProfileRaw] = useState(() => load('nsc_learningProfile', {
    howILearn: '', sessionLength: 45, bestTimeOfDay: 'morning', styles: [],
  }))
  const [healthCheckins,  setHealthCheckinsRaw]  = useState(() => load('nsc_healthCheckins', []))
  const [courses,         setCoursesRaw]         = useState(() => load('nsc_courses', []))
  const [schedule,        setScheduleRaw]        = useState(() => load('nsc_schedule', []))
  const [savedFocuses,    setSavedFocusesRaw]    = useState(() => load('nsc_savedFocuses', []))

  // Auto-persist on change
  function setStudentName(v)     { setStudentNameRaw(v);     save('nsc_studentName', v) }
  function setLearningProfile(v) { setLearningProfileRaw(v); save('nsc_learningProfile', v) }

  function addCheckin(c) {
    setHealthCheckinsRaw(prev => {
      const next = [c, ...prev.filter(x => x.date !== c.date)].slice(0, 90)
      save('nsc_healthCheckins', next)
      return next
    })
  }

  // Courses — each has { id, name, examDate, topics: [{ id, name, logs: [{ date, confidence }] }] }
  function saveCourses(next) { setCoursesRaw(next); save('nsc_courses', next) }
  function addCourse(course)  { saveCourses([...courses, course]) }
  function updateCourse(id, data) {
    saveCourses(courses.map(c => c.id === id ? { ...c, ...data } : c))
  }
  function removeCourse(id) { saveCourses(courses.filter(c => c.id !== id)) }

  function addTopic(courseId, topic) {
    saveCourses(courses.map(c => c.id === courseId
      ? { ...c, topics: [...(c.topics || []), topic] }
      : c
    ))
  }
  function removeTopic(courseId, topicId) {
    saveCourses(courses.map(c => c.id === courseId
      ? { ...c, topics: (c.topics || []).filter(t => t.id !== topicId) }
      : c
    ))
  }
  function logConfidence(courseId, topicId, entry) {
    // entry = { date, confidence, notes }
    saveCourses(courses.map(c => {
      if (c.id !== courseId) return c
      return {
        ...c,
        topics: (c.topics || []).map(t => {
          if (t.id !== topicId) return t
          const logs = [entry, ...(t.logs || []).filter(l => l.date !== entry.date)].slice(0, 60)
          return { ...t, logs }
        })
      }
    }))
  }

  function addScheduleEvent(e) {
    setScheduleRaw(prev => { const next = [...prev, e]; save('nsc_schedule', next); return next })
  }
  function removeScheduleEvent(id) {
    setScheduleRaw(prev => { const next = prev.filter(e => e.id !== id); save('nsc_schedule', next); return next })
  }

  function saveFocus(f) {
    setSavedFocusesRaw(prev => {
      const next = [f, ...prev].slice(0, 10)
      save('nsc_savedFocuses', next)
      return next
    })
  }

  const today = new Date().toISOString().split('T')[0]
  const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0] })()
  const todayCheckin     = healthCheckins.find(c => c.date === today)     || null
  const yesterdayCheckin = healthCheckins.find(c => c.date === yesterday) || null

  return (
    <AppContext.Provider value={{
      studentName, setStudentName,
      learningProfile, setLearningProfile,
      healthCheckins, addCheckin, todayCheckin, yesterdayCheckin,
      courses, addCourse, updateCourse, removeCourse,
      addTopic, removeTopic, logConfidence,
      schedule, addScheduleEvent, removeScheduleEvent,
      savedFocuses, saveFocus,
      today,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
