
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, LockKeyhole, ShieldCheck, AlertCircle } from 'lucide-react'

import Logo from '../../components/common/Logo'
import Button from '../../components/common/Button'
import { supabase } from '../../lib/supabase'

function DriverPasswordReset() {
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChecking, setIsChecking] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isRecoverySession, setIsRecoverySession] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let mounted = true

    const checkRecoverySession = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) throw sessionError

        if (mounted) {
          setIsRecoverySession(Boolean(session))
          if (!session) {
            setError(
              'This password reset link is invalid or has expired. Please request a new one.',
            )
          }
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to verify your reset link.',
          )
        }
      } finally {
        if (mounted) setIsChecking(false)
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      if (event === 'PASSWORD_RECOVERY' && session) {
        setIsRecoverySession(true)
        setError('')
      }
    })

    void checkRecoverySession()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSavePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setNotice('')

    if (password.length < 8) {
      setError('Your password must contain at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }

    if (!isRecoverySession) {
      setError('Your recovery session is invalid. Request a new reset link.')
      return
    }

    setIsSaving(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) throw updateError

      setNotice('Your password has been updated successfully.')

      await supabase.auth.signOut()

      window.setTimeout(() => {
        navigate('/drivers', { replace: true })
      }, 1500)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update your password. Please try again.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-[#151a18]">
      <header className="border-b border-[#e8ece9]">
        <div className="mx-auto flex h-[76px] w-[min(100%-40px,1200px)] items-center justify-between">
          <Link to="/" aria-label="AbhiRide homepage">
            <Logo size="medium" />
          </Link>
          <Link
            to="/drivers"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#454d49]"
          >
            <ArrowLeft size={16} />
            Driver sign in
          </Link>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-77px)] items-center justify-center px-5 py-12">
        <section className="w-full max-w-[440px] rounded-[22px] border border-[#e8ece9] bg-white p-7 shadow-[0_12px_50px_rgba(21,26,24,0.06)] sm:p-9">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf7f1] text-[#087f5b]">
            <LockKeyhole size={22} />
          </div>

          <h1 className="text-[26px] font-semibold tracking-tight">
            Create a new password
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#818a85]">
            Choose a new password for your AbhiRide driver account.
          </p>

          {isChecking ? (
            <p className="mt-8 text-sm text-[#68736d]">
              Verifying your recovery link...
            </p>
          ) : !isRecoverySession ? (
            <div className="mt-6">
              {error && (
                <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5">
                  <AlertCircle size={17} className="shrink-0 text-red-600" />
                  <p className="text-xs leading-5 text-red-700">{error}</p>
                </div>
              )}

              <Link
                to="/drivers"
                className="mt-6 inline-block text-sm font-semibold text-[#087f5b]"
              >
                Return to driver sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSavePassword} className="mt-7">
              <label
                htmlFor="new-password"
                className="mb-2 block text-sm font-semibold"
              >
                New password
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                minLength={8}
                required
                className="h-[52px] w-full rounded-xl border border-[#e1e7e3] px-4 text-sm outline-none focus:border-[#087f5b]"
              />

              <label
                htmlFor="confirm-password"
                className="mb-2 mt-5 block text-sm font-semibold"
              >
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Enter the password again"
                minLength={8}
                required
                className="h-[52px] w-full rounded-xl border border-[#e1e7e3] px-4 text-sm outline-none focus:border-[#087f5b]"
              />

              {error && (
                <div
                  role="alert"
                  className="mt-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5"
                >
                  <AlertCircle size={17} className="shrink-0 text-red-600" />
                  <p className="text-xs leading-5 text-red-700">{error}</p>
                </div>
              )}

              {notice && (
                <div
                  role="status"
                  className="mt-5 rounded-xl border border-[#dcefe5] bg-[#f0f8f3] p-3.5"
                >
                  <p className="text-xs leading-5 text-[#24684e]">{notice}</p>
                </div>
              )}

              <Button
                type="submit"
                fullWidth
                size="large"
                loading={isSaving}
                disabled={isSaving}
                className="mt-6"
              >
                {isSaving ? 'Updating password...' : 'Save new password'}
              </Button>
            </form>
          )}

          <div className="mt-7 flex items-center justify-center gap-2 text-xs text-[#818a85]">
            <ShieldCheck size={15} />
            Secure password recovery
          </div>
        </section>
      </main>
    </div>
  )
}

export default DriverPasswordReset
