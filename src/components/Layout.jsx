import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Upload, Calendar, Heart,
  Brain, BookOpen, MessageCircle, Stethoscope,
} from 'lucide-react'
import { useApp } from '../context/AppContext'

const NAV = [
  { to: '/',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload',  icon: Upload,          label: 'Upload Materials' },
  { to: '/schedule',icon: Calendar,        label: 'Schedule' },
  { to: '/health',  icon: Heart,           label: 'Health Check-In' },
  { to: '/profile', icon: Brain,           label: 'Learning Profile' },
  { to: '/plan',    icon: BookOpen,        label: 'Study Plan' },
  { to: '/chat',    icon: MessageCircle,   label: 'Motivational Chat' },
]

function healthColor(score) {
  if (!score) return 'bg-slate-200'
  if (score <= 3) return 'bg-red-400'
  if (score <= 5) return 'bg-amber-400'
  if (score <= 7) return 'bg-blue-400'
  return 'bg-emerald-400'
}

export default function Layout({ children }) {
  const { todayCheckin, studentName } = useApp()
  const avg = todayCheckin
    ? Math.round((todayCheckin.mental + todayCheckin.physical) / 2)
    : null

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-900 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-5 pt-6 pb-4 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">Florence Appingale</p>
              <p className="text-slate-400 text-xs">Study Companion</p>
            </div>
          </div>
          {studentName && (
            <p className="text-slate-300 text-xs mt-3">
              Welcome back, <span className="font-medium text-white">{studentName}</span>
            </p>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `nav-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Health status indicator */}
        <div className="px-4 pb-5 pt-3 border-t border-slate-700">
          <p className="text-slate-500 text-xs mb-2 uppercase tracking-wider font-medium">Today's Wellness</p>
          {avg ? (
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${healthColor(avg)}`} />
              <span className="text-slate-300 text-xs">
                Score {avg}/10 — {avg <= 3 ? 'Rest mode' : avg <= 5 ? 'Light study' : avg <= 7 ? 'On track' : 'Full power!'}
              </span>
            </div>
          ) : (
            <p className="text-slate-500 text-xs">No check-in yet today</p>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
