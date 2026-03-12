import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { useCompany } from '../context/CompanyContext'

export default function SettingsPage () {
  const {
    company,
    loading,
    error: companyError,
    saveCompanyName
  } = useCompany()
  const [companyName, setCompanyName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (company) {
      setCompanyName(company.name)
    }
  }, [company])

  async function handleSave (e: React.FormEvent) {
    e.preventDefault()

    const nextName = companyName.trim()

    if (!nextName) {
      setError('Company name is required.')
      setMessage('')
      return
    }

    try {
      setSaving(true)
      setError('')
      setMessage('')

      await saveCompanyName(nextName)
      setMessage('Company settings saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reach API.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout
      title='Settings'
      subtitle='Company profile and system-level configuration for this BossOS workspace.'
    >
      {loading ? (
        <div className='rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 text-white/70 shadow-2xl'>
          Loading settings...
        </div>
      ) : null}

      {error || companyError ? (
        <div className='mb-4 rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-sm font-medium text-red-200'>
          {error || companyError}
        </div>
      ) : null}

      {message ? (
        <div className='mb-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-sm font-medium text-emerald-200'>
          {message}
        </div>
      ) : null}

      {!loading && company ? (
        <div className='grid gap-6'>
          <div className='rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl'>
            <div className='text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400'>
              Product
            </div>
            <h2 className='mt-3 text-2xl font-black tracking-tight text-white'>
              BossOS
            </h2>
            <p className='mt-2 text-sm text-white/65 sm:text-base'>
              Multi-division field operations platform.
            </p>
          </div>

          <form
            onSubmit={handleSave}
            className='rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl'
          >
            <div className='text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400'>
              Company
            </div>

            <div className='mt-4 grid gap-4'>
              <div className='grid gap-2'>
                <label className='text-sm font-semibold uppercase tracking-[0.18em] text-white/75'>
                  Company Name
                </label>
                <input
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className='h-14 w-full rounded-2xl border border-white/10 bg-[#0d0d0d] px-4 text-base text-white outline-none transition placeholder:text-white/30 focus:border-orange-400/60'
                  placeholder='Enter company name'
                />
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='rounded-2xl border border-white/10 bg-black/20 px-4 py-4'>
                  <div className='text-[11px] font-bold uppercase tracking-[0.22em] text-white/45'>
                    Slug
                  </div>
                  <div className='mt-2 text-base font-semibold text-white'>
                    {company.slug}
                  </div>
                </div>

                <div className='rounded-2xl border border-white/10 bg-black/20 px-4 py-4'>
                  <div className='text-[11px] font-bold uppercase tracking-[0.22em] text-white/45'>
                    Status
                  </div>
                  <div className='mt-2 text-base font-semibold text-white'>
                    {company.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>

              <button
                type='submit'
                disabled={saving}
                className='h-14 rounded-2xl bg-[#fbbf24] px-5 text-base font-black text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70'
              >
                {saving ? 'Saving...' : 'Save Company Settings'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </Layout>
  )
}
