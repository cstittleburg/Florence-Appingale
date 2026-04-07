import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { fetchUserData, saveUserData } from '../utils/supabase'

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
  const [accessCode,      setAccessCodeRaw]      = useState(() => load('nsc_accessCode', null))
  const [syncStatus,      setSyncStatus]         = useState('idle') // idle | loading | synced | error
  const [syncError,       setSyncError]          = useState('')

  const [studentName,     setStudentNameRaw]     = useState(() => load('nsc_studentName', ''))
  const [learningProfile, setLearningProfileRaw] = useState(() => load('nsc_learningProfile', {
    howILearn: '', sessionLength: 45, bestTimeOfDay: 'morning', styles: [],
  }))
  const [healthCheckins,  setHealthCheckinsRaw]  = useState(() => load('nsc_healthCheckins', []))
  const [courses,         setCoursesRaw]         = useState(() => load('nsc_courses', []))
  const [schedule,        setScheduleRaw]        = useState(() => load('nsc_schedule', []))
  const [savedFocuses,    setSavedFocusesRaw]    = useState(() => load('nsc_savedFocuses', []))

  // Track whether we've done the initial Supabase load
  const initialLoadDone = useRef(false)
  // Debounce timer ref
  const saveTimer = useRef(null)

  // ── Load from Supabase on mount / when access code is set ──
  useEffect(() => {
    if (!accessCode || initialLoadDone.current) return
    initialLoadDone.current = true
    setSyncStatus('loading')

    fetchUserData(accessCode).then(remote => {
      if (!remote) {
        // New code — nothing on server yet, push local data up
        setSyncStatus('synced')
        return
      }
      // Merge remote → local (remote wins)
      if (remote.studentName     !== undefined) { setStudentNameRaw(remote.studentName);     save('nsc_studentName', remote.studentName) }
      if (remote.learningProfile !== undefined) { setLearningProfileRaw(remote.learningProfile); save('nsc_learningProfile', remote.learningProfile) }
      if (remote.healthCheckins  !== undefined) { setHealthCheckinsRaw(remote.healthCheckins);  save('nsc_healthCheckins', remote.healthCheckins) }
      if (remote.courses         !== undefined) { setCoursesRaw(remote.courses);         save('nsc_courses', remote.courses) }
      if (remote.schedule        !== undefined) { setScheduleRaw(remote.schedule);       save('nsc_schedule', remote.schedule) }
      if (remote.savedFocuses    !== undefined) { setSavedFocusesRaw(remote.savedFocuses); save('nsc_savedFocuses', remote.savedFocuses) }
      setSyncStatus('synced')
    }).catch(err => {
      setSyncError(err.message)
      setSyncStatus('error')
    })
  }, [accessCode])

  // ── Debounced save to Supabase whenever data changes ──
  const triggerRemoteSave = useCallback((patch) => {
    if (!accessCode) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      setSyncStatus('loading')
      saveUserData(accessCode, patch)
        .then(() => setSyncStatus('synced'))
        .catch(err => { setSyncError(err.message); setSyncStatus('error') })
    }, 1200)
  }, [accessCode])

  // ── Setters ──
  function setStudentName(v) {
    setStudentNameRaw(v); save('nsc_studentName', v)
    triggerRemoteSave({ studentName: v, learningProfile, healthCheckins, courses, schedule, savedFocuses })
  }
  function setLearningProfile(v) {
    setLearningProfileRaw(v); save('nsc_learningProfile', v)
    triggerRemoteSave({ studentName, learningProfile: v, healthCheckins, courses, schedule, savedFocuses })
  }

  function addCheckin(c) {
    setHealthCheckinsRaw(prev => {
      const next = [c, ...prev.filter(x => x.date !== c.date)].slice(0, 90)
      save('nsc_healthCheckins', next)
      triggerRemoteSave({ studentName, learningProfile, healthCheckins: next, courses, schedule, savedFocuses })
      return next
    })
  }

  // Courses
  function saveCourses(next) {
    setCoursesRaw(next); save('nsc_courses', next)
    triggerRemoteSave({ studentName, learningProfile, healthCheckins, courses: next, schedule, savedFocuses })
  }
  function addCourse(course)  { saveCourses([...courses, course]) }
  function updateCourse(id, data) { saveCourses(courses.map(c => c.id === id ? { ...c, ...data } : c)) }
  function removeCourse(id)   { saveCourses(courses.filter(c => c.id !== id)) }

  function addTopic(courseId, topic) {
    saveCourses(courses.map(c => c.id === courseId
      ? { ...c, topics: [...(c.topics || []), topic] } : c))
  }
  function removeTopic(courseId, topicId) {
    saveCourses(courses.map(c => c.id === courseId
      ? { ...c, topics: (c.topics || []).filter(t => t.id !== topicId) } : c))
  }
  function logConfidence(courseId, topicId, entry) {
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
    setScheduleRaw(prev => {
      const next = [...prev, e]; save('nsc_schedule', next)
      triggerRemoteSave({ studentName, learningProfile, healthCheckins, courses, schedule: next, savedFocuses })
      return next
    })
  }
  function removeScheduleEvent(id) {
    setScheduleRaw(prev => {
      const next = prev.filter(e => e.id !== id); save('nsc_schedule', next)
      triggerRemoteSave({ studentName, learningProfile, healthCheckins, courses, schedule: next, savedFocuses })
      return next
    })
  }

  function saveFocus(f) {
    setSavedFocusesRaw(prev => {
      const next = [f, ...prev].slice(0, 10); save('nsc_savedFocuses', next)
      triggerRemoteSave({ studentName, learningProfile, healthCheckins, courses, schedule, savedFocuses: next })
      return next
    })
  }

  function setAccessCode(code) {
    setAccessCodeRaw(code)
    save('nsc_accessCode', code)
    initialLoadDone.current = false // allow re-load
  }

  function clearAccessCode() {
    setAccessCodeRaw(null)
    save('nsc_accessCode', null)
    initialLoadDone.current = false
    setSyncStatus('idle')
  }

  const today = new Date().toISOString().split('T')[0]
  const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0] })()
  const todayCheckin     = healthCheckins.find(c => c.date === today)     || null
  const yesterdayCheckin = healthCheckins.find(c => c.date === yesterday) || null

  return (
    <AppContext.Provider value={{
      accessCode, setAccessCode, clearAccessCode,
      syncStatus, syncError,
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
