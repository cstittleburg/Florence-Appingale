import { Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import Courses from './components/Courses'
import ScheduleBuilder from './components/ScheduleBuilder'
import HealthCheckIn from './components/HealthCheckIn'
import LearningProfile from './components/LearningProfile'
import DailyFocus from './components/DailyFocus'
import MotivationalChat from './components/MotivationalChat'

export default function App() {
  return (
    <AppProvider>
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
    </AppProvider>
  )
}
