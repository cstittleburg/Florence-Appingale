import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Upload, Calendar, Heart,
  Brain, BookOpen, MessageCircle, Stethoscope,
  Menu, X,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useState } from 'react'

const NAV = [
  { to: '/',         icon: LayoutDashboard, label: 'Dashboard',       short: 'Home' },
  { to: '/upload',   icon: Upload,          label: 'Upload Materials', short: 'Upload' },
  { to: '/schedule', icon: Calendar,        label: 'Schedule',         short: 'Schedule' },
  { to: '/health',   icon: Heart,           label: 'Health Check-In',  short: 'Health' },
  { to: '/profile',  icon: Brain,           label: 'Learning Profile', short: 'Profile' },
  { to: '/plan',     icon: BookOpen,        label: 'Study Plan',       short: 'Plan' },
  { to: '/chat',     icon: MessageCircle,   label: 'Motivational Chat',short: 'Chat' },
]

// Bottom nav shows 5 items; remaining go in "More" drawer
const BOTTOM_NAV   = NAV.slice(0, 4)
const BOTTOM_EXTRA = NAV.slice(4)

function wellnessInfo(score) {
  if (!score) return { label: 'No check-in', color: '#64748b', bg: 'rgba(100,116,139,0.15)' }
  if (score <= 3) return { label: 'Rest mode',    color: '#ef4444', bg: 'rgba(239,68,68,0.12)' }
  if (score <= 5) return { label: 'Light study',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' }
  if (score <= 7) return { label: 'Good to go',   color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' }
  return                  { label: 'Peak energy!', color: '#10b981', bg: 'rgba(16,185,129,0.12)' }
}

export default function Layout({ children }) {
  const { todayCheckin, studentName } = useApp()
  const [mobileOpen, setMobileOpen] = useState(false)
  const avg = todayCheckin ? Math.round((todayCheckin.mental + todayCheckin.physical) / 2) : null
  const wellness = wellnessInfo(avg)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">

      {/* ── DESKTOP SIDEBAR (hidden on mobile) ── */}
      <aside className="hidden md:flex w-64 flex-col flex-shrink-0 relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #060f1a 0%, #0d2137 100%)' }}>

        {/* Decorative glow */}
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #0091cd, transparent)' }} />
        <div className="absolute bottom-24 left-0 w-28 h-28 rounded-full opacity-10 blur-2xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #14b8a6, transparent)' }} />

        {/* Logo */}
        <div className="relative px-5 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #0074a4, #14b8a6)' }}>
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Florence</p>
              <p className="font-bold text-sm leading-tight" style={{ color: '#38bdf8' }}>Appingale</p>
            </div>
          </div>

          {studentName && (
            <div className="mt-4 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs" style={{ color: 'rgba(148,163,184,0.8)' }}>Welcome back,</p>
              <p className="text-white text-sm font-semibold">{studentName} 💙</p>
            </div>
          )}
        </div>

        <div className="mx-5 mb-3 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />

        {/* Nav links */}
        <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `nav-link group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-white'
                }`
              }
              style={({ isActive }) => isActive
                ? { background: 'linear-gradient(135deg, rgba(0,116,164,0.6), rgba(20,184,166,0.3))', border: '1px solid rgba(0,145,205,0.35)' }
                : { border: '1px solid transparent' }
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Wellness widget */}
        <div className="relative mx-3 mb-5 mt-2 rounded-xl p-3.5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: 'rgba(148,163,184,0.7)' }}>
            Today's Wellness
          </p>
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: wellness.bg }}>
              <span className="text-xs font-bold" style={{ color: wellness.color }}>
                {avg ?? '—'}
              </span>
            </div>
            <div>
              <p className="text-white text-xs font-semibold">{avg ? `${avg} / 10` : 'Not checked in'}</p>
              <p className="text-xs" style={{ color: 'rgba(148,163,184,0.7)' }}>{wellness.label}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MOBILE HEADER (visible on mobile only) ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3"
        style={{ background: 'linear-gradient(180deg, #060f1a, #0d2137)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0074a4, #14b8a6)' }}>
            <Stethoscope className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">Florence Appingale</p>
            {studentName && <p className="text-xs mt-0.5" style={{ color: '#38bdf8' }}>{studentName}</p>}
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-slate-300 hover:text-white"
          style={{ background: 'rgba(255,255,255,0.07)' }}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* ── MOBILE DRAWER ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          {/* Drawer */}
          <div className="relative w-72 flex flex-col ml-auto h-full"
            style={{ background: 'linear-gradient(180deg, #060f1a 0%, #0d2137 100%)' }}>
            <div className="flex items-center justify-between px-5 pt-6 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #0074a4, #14b8a6)' }}>
                  <Stethoscope className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Florence Appingale</p>
                  {studentName && <p className="text-xs" style={{ color: '#38bdf8' }}>{studentName}</p>}
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mx-5 mb-3 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />

            <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
              {NAV.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`
                  }
                  style={({ isActive }) => isActive
                    ? { background: 'linear-gradient(135deg, rgba(0,116,164,0.6), rgba(20,184,166,0.3))', border: '1px solid rgba(0,145,205,0.35)' }
                    : { border: '1px solid transparent' }
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                      {label}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Wellness in drawer */}
            <div className="mx-3 mb-6 mt-2 rounded-xl p-3.5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(148,163,184,0.7)' }}>
                Today's Wellness
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: wellness.bg }}>
                  <span className="text-xs font-bold" style={{ color: wellness.color }}>{avg ?? '—'}</span>
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">{avg ? `${avg} / 10` : 'Not checked in'}</p>
                  <p className="text-xs" style={{ color: 'rgba(148,163,184,0.7)' }}>{wellness.label}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-y-auto pt-0 md:pt-0">
        {/* Spacer for mobile header */}
        <div className="md:hidden h-14" />
        {children}
        {/* Spacer for mobile bottom nav */}
        <div className="md:hidden h-16" />
      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-1 py-2"
        style={{ background: 'linear-gradient(180deg, #0d2137, #060f1a)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {BOTTOM_NAV.map(({ to, icon: Icon, short }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-0 flex-1 ${
                isActive ? 'text-sky-400' : 'text-slate-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium truncate">{short}</span>
              </>
            )}
          </NavLink>
        ))}
        {/* More button */}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl flex-1 text-slate-500"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>
    </div>
  )
}
