import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { clearStoredToken, getStoredToken } from '../lib/auth'
import { useCompany } from '../context/CompanyContext'

type LayoutProps = {
  children: React.ReactNode
  kicker?: string
  title?: string
  subtitle?: string
}

function navClass (isActive: boolean) {
  return [
    'rounded-full px-4 py-2 text-sm font-semibold transition',
    isActive
      ? 'bg-white text-black'
      : 'text-white/70 hover:bg-white/10 hover:text-white'
  ].join(' ')
}

export default function Layout ({
  children,
  kicker,
  title,
  subtitle
}: LayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const token = getStoredToken()
  const { company } = useCompany()

  const isDashboard = location.pathname === '/dashboard'
  const isReports = location.pathname.startsWith('/logs')
  const isDivisions = location.pathname === '/divisions'
  const isSettings = location.pathname === '/settings'

  const resolvedKicker = kicker || company?.name || 'BossOS'

  return (
    <div className='min-h-screen bg-black text-white'>
      <div className='mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8'>
        <div className='overflow-hidden rounded-[28px] border border-white/10 bg-[#111111] shadow-[0_20px_80px_rgba(0,0,0,0.45)]'>
          <header className='border-b border-white/10 px-5 py-4 sm:px-6'>
            <div className='flex flex-wrap items-start gap-3'>
              <div>
                <p className='text-[12px] font-bold uppercase tracking-[0.28em] text-orange-400'>
                  {resolvedKicker}
                </p>
                <div className='mt-2 text-lg font-black tracking-tight text-white sm:text-xl'>
                  BossOS Admin
                </div>
              </div>

              {token ? (
                <button
                  onClick={() => {
                    clearStoredToken()
                    navigate('/login')
                  }}
                  className='ml-auto rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-300 transition hover:bg-orange-500/20'
                >
                  Logout
                </button>
              ) : null}
            </div>

            {token ? (
              <nav className='mt-4 flex flex-wrap gap-2'>
                <Link to='/dashboard' className={navClass(isDashboard)}>
                  Dashboard
                </Link>
                <Link to='/logs' className={navClass(isReports)}>
                  Reports
                </Link>
                <Link to='/divisions' className={navClass(isDivisions)}>
                  Divisions
                </Link>
                <Link to='/settings' className={navClass(isSettings)}>
                  Settings
                </Link>
              </nav>
            ) : null}
          </header>

          <main className='px-5 py-6 sm:px-6 sm:py-8'>
            {title || subtitle ? (
              <section className='mb-6 sm:mb-8'>
                <h1 className='text-4xl font-black tracking-tight text-white sm:text-5xl'>
                  {title}
                </h1>

                {subtitle ? (
                  <p className='mt-3 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg'>
                    {subtitle}
                  </p>
                ) : null}
              </section>
            ) : null}

            <div className='mx-auto w-full max-w-4xl'>{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
