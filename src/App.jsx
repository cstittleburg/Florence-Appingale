import { Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { useApp } from './context/AppContext'
import Layout from './components/Layout'
import AccessCodeSetup from './components/AccessCodeSetup'
import Dashboard from './components/Dashboard'
import Courses from './components/Courses'
import ScheduleBuilder from './components/ScheduleBuilder'
import HealthCheckIn from './components/HealthCheckIn'
import LearningProfile from './components/LearningProfile'
import DailyFocus from './components/DailyFocus'
import MotivationalChat from './components/MotivationalChat'

function AppInner() {
  const { accessCode, syncStatus } = useApp()

  // Show setup screen until user has an access code
  if (!accessCode) return <AccessCodeSetup />

  // Brief loading overlay while fetching from Supabase
  if (syncStatus === 'loading' && !accessCode) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: '#060f1a' }}>
      <p className="text-sky-300 text-sm animate-pulse">Loading your data…</p>
    </div>
  )

  return (
    <Layout>
      <Routes>
        <Route path="/"         element={<Dashboard />} />
        <Route path="/courses"  element={<Courses />} />
        <Route path="/schedule" element={<ScheduleBuilder />} />
        <Route path="/health"   element={<HealthCheckIn />} />
        <Route path="/profile"  element={<LearningProfile />} />
        <Route path="/focus"    element={<DailyFocus />} />
        <Route path="/chat"     element={<MotivationalChat />} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  )
}
