import { createContext, useContext } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [studentName, setStudentName] = useLocalStorage('nsc_studentName', '')
  const [learningProfile, setLearningProfile] = useLocalStorage('nsc_learningProfile', {
    howILearn: '',
    sessionLength: 45,
    bestTimeOfDay: 'morning',
    styles: [],
  })
  const [healthCheckins, setHealthCheckins] = useLocalStorage('nsc_healthCheckins', [])
  const [uploadedFiles, setUploadedFiles] = useLocalStorage('nsc_uploadedFiles', [])
  const [schedule, setSchedule] = useLocalStorage('nsc_schedule', [])
  const [savedPlans, setSavedPlans] = useLocalStorage('nsc_savedPlans', [])

  // Latest check-in for today
  const today = new Date().toISOString().split('T')[0]
  const todayCheckin = healthCheckins.find(c => c.date === today) || null

  function addCheckin(checkin) {
    setHealthCheckins(prev => {
      const filtered = prev.filter(c => c.date !== checkin.date)
      return [checkin, ...filtered].slice(0, 90) // keep 90 days
    })
  }

  function addUploadedFile(file) {
    setUploadedFiles(prev => [file, ...prev])
  }

  function removeUploadedFile(id) {
    setUploadedFiles(prev => prev.filter(f => f.id !== id))
  }

  function addScheduleEvent(event) {
    setSchedule(prev => [...prev, event])
  }

  function removeScheduleEvent(id) {
    setSchedule(prev => prev.filter(e => e.id !== id))
  }

  function savePlan(plan) {
    setSavedPlans(prev => [plan, ...prev].slice(0, 10))
  }

  return (
    <AppContext.Provider value={{
      studentName, setStudentName,
      learningProfile, setLearningProfile,
      healthCheckins, addCheckin, todayCheckin,
      uploadedFiles, addUploadedFile, removeUploadedFile,
      schedule, addScheduleEvent, removeScheduleEvent,
      savedPlans, savePlan,
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
