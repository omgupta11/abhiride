
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
} from 'lucide-react'

import Logo from '../../components/common/Logo'
import Button from '../../components/common/Button'
import { supabase } from '../../lib/supabase'

function DriverPasswordReset() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [isChecking, setIsChecking] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isRecoverySession, setIsRecoverySession] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // VERIFY PASSWORD RECOVERY SESSION

  useEffect(() => {
    let mounted = true
    let recoveryEventReceived = false

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      if (event === 'PASSWORD_RECOVERY' && session) {
        recoveryEventReceived = true
        setIsRecoverySession(true)
        setError('')
        setIsChecking(false)
      }

      if (event === 'SIGNED_OUT') {
        setIsRecoverySession(false)
      }
    })

    const checkRecoverySession = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) throw sessionError
        if (!mounted) return

        const hashParams = new URLSearchParams(
          window.location.hash.replace(/^#/, ''),
        )

        const searchParams = new URLSearchParams(window.location.search)

        const recoveryTypeInUrl =
          hashParams.get('type') === 'recovery' ||
          searchParams.get('type') === 'recovery'

        const isValidRecovery =
          Boolean(session) &&
          (recoveryEventReceived || recoveryTypeInUrl)

        setIsRecoverySession(isValidRecovery)

        if (!isValidRecovery) {
          setError(
            'This password reset link is invalid or has expired. Please request a new one.',
          )
        }
      } catch (err) {
        if (mounted) {
          setIsRecoverySession(false)

          setError(
            err instanceof Error
              ? err.message
              : 'Unable to verify your password reset link.',
          )
        }
      } finally {
        if (mounted) {
          setIsChecking(false)
        }
      }
    }

    void checkRecoverySession()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // SAVE NEW PASSWORD

  const handleSavePassword = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (isSaving || isCompleted) return

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
      setError('Your recovery session is invalid. Please request a new reset link.')
      return
    }

    setIsSaving(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) throw updateError

      // PASSWORD SUCCESSFULLY UPDATED

      setPassword('')
      setConfirmPassword('')
      setIsCompleted(true)
      setIsRecoverySession(false)

      setNotice(
        'Your password has been updated successfully. Please sign in using your new password.',
      )

      // SIGN OUT THE RECOVERY SESSION

      await supabase.auth.signOut({
        scope: 'local',
      })
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

  // LOADING SCREEN

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafbfa]">
        <p className="text-sm text-[#68736d]">
          Verifying your reset link...
        </p>
      </div>
    )
  }

  // PAGE LAYOUT

  return (
    <div className="flex min-h-screen flex-col bg-[#fafbfa] text-[#151a18]">
      {/* HEADER */}

      <header className="border-b border-[#e8ece9] bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1100px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="AbhiRide homepage">
            <Logo />
          </Link>

          <Link
            to="/drivers"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#68736d] transition-colors hover:text-[#087f5b]"
          >
            <ArrowLeft size={16} />
            Driver sign in
          </Link>
        </div>
      </header>

      {/* MAIN CONTENT */}

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
        <section className="w-full max-w-[440px] rounded-2xl border border-[#e8ece9] bg-white p-6 shadow-[0_4px_24px_rgba(20,35,27,0.035)] sm:p-9">

          {/* SUCCESS SCREEN */}

          {isCompleted ? (
            <div className="py-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0f8f3] text-[#087f5b]">
                <CheckCircle2 size={30} />
              </div>

              <h1 className="mt-6 text-2xl font-semibold tracking-tight text-[#151a18]">
                Password updated
              </h1>

              <p className="mt-3 text-sm leading-6 text-[#68736d]">
                Your new password is ready. Sign in to your driver account using it.
              </p>

              <Link
                to="/drivers"
                className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#087f5b] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#066b4d]"
              >
                Continue to driver sign in
              </Link>
            </div>
          ) : (
            <>
              {/* PAGE TITLE */}

              <div className="mb-7">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0f8f3] text-[#087f5b]">
                  <LockKeyhole size={23} />
                </div>

                <h1 className="text-2xl font-semibold tracking-[-0.04em] text-[#151a18] sm:text-3xl">
                  Create a new password
                </h1>

                <p className="mt-2 text-sm leading-6 text-[#818a85]">
                  Choose a new password for your AbhiRide driver account.
                </p>
              </div>

              {/* INVALID RESET LINK */}

              {!isRecoverySession ? (
                <>
                  {error && (
                    <div
                      role="alert"
                      className="flex gap-3 rounded-xl border border-red-100 bg-red-50 p-4"
                    >
                      <AlertCircle
                        size={18}
                        className="mt-0.5 shrink-0 text-red-600"
                      />

                      <p className="text-sm leading-6 text-red-700">
                        {error}
                      </p>
                    </div>
                  )}

                  <Link
                    to="/drivers"
                    className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#087f5b] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#066b4d]"
                  >
                    Return to driver sign in
                  </Link>
                </>
              ) : (
                /* PASSWORD RESET FORM */

                <form onSubmit={handleSavePassword} noValidate>
                  {/* NEW PASSWORD */}

                  <div>
                    <label
                      htmlFor="new-password"
                      className="mb-2 block text-sm font-semibold text-[#454d49]"
                    >
                      New password
                    </label>

                    <div className="flex h-12 items-center rounded-xl border border-[#e1e7e3] transition-colors focus-within:border-[#087f5b] focus-within:ring-4 focus-within:ring-[#087f5b]/10">
                      <LockKeyhole
                        size={17}
                        className="ml-4 shrink-0 text-[#818a85]"
                      />

                      <input
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value)
                          setError('')
                        }}
                        placeholder="At least 8 characters"
                        minLength={8}
                        required
                        disabled={isSaving}
                        className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-[#a0a8a3]"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((value) => !value)
                        }
                        aria-label={
                          showPassword ? 'Hide password' : 'Show password'
                        }
                        className="flex h-full items-center px-4 text-[#818a85] hover:text-[#087f5b]"
                      >
                        {showPassword ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                    </div>

                    <p className="mt-2 text-xs text-[#929a95]">
                      Use at least 8 characters.
                    </p>
                  </div>

                  {/* CONFIRM PASSWORD */}

                  <div className="mt-5">
                    <label
                      htmlFor="confirm-password"
                      className="mb-2 block text-sm font-semibold text-[#454d49]"
                    >
                      Confirm new password
                    </label>

                    <div className="flex h-12 items-center rounded-xl border border-[#e1e7e3] transition-colors focus-within:border-[#087f5b] focus-within:ring-4 focus-within:ring-[#087f5b]/10">
                      <LockKeyhole
                        size={17}
                        className="ml-4 shrink-0 text-[#818a85]"
                      />

                      <input
                        id="confirm-password"
                        type={
                          showConfirmPassword ? 'text' : 'password'
                        }
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) => {
                          setConfirmPassword(event.target.value)
                          setError('')
                        }}
                        placeholder="Enter the password again"
                        minLength={8}
                        required
                        disabled={isSaving}
                        className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-[#a0a8a3]"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword((value) => !value)
                        }
                        aria-label={
                          showConfirmPassword
                            ? 'Hide confirmation password'
                            : 'Show confirmation password'
                        }
                        className="flex h-full items-center px-4 text-[#818a85] hover:text-[#087f5b]"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* ERROR */}

                  {error && (
                    <div
                      role="alert"
                      className="mt-5 flex gap-3 rounded-xl border border-red-100 bg-red-50 p-3.5"
                    >
                      <AlertCircle
                        size={17}
                        className="mt-0.5 shrink-0 text-red-600"
                      />

                      <p className="text-xs leading-5 text-red-700">
                        {error}
                      </p>
                    </div>
                  )}

                  {/* NOTICE */}

                  {notice && (
                    <div
                      role="status"
                      className="mt-5 rounded-xl border border-[#dcefe5] bg-[#f0f8f3] p-3.5"
                    >
                      <p className="text-xs leading-5 text-[#24684e]">
                        {notice}
                      </p>
                    </div>
                  )}

                  {/* SAVE BUTTON */}

                  <Button
                    type="submit"
                    fullWidth
                    size="large"
                    loading={isSaving}
                    disabled={isSaving}
                    className="mt-6"
                  >
                    {isSaving
                      ? 'Updating password...'
                      : 'Save new password'}
                  </Button>
                </form>
              )}
            </>
          )}

        </section>
      </main>

      {/* FOOTER */}

      <footer className="border-t border-[#e8ece9] bg-white">
        <div className="mx-auto flex max-w-[1100px] flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <Logo size="small" />

          <p className="text-xs text-[#818a85]">
            © {new Date().getFullYear()} AbhiRide. All rights reserved.
          </p>

          <a
            href="mailto:contactabhiride@gmail.com"
            className="text-xs font-semibold text-[#087f5b] hover:text-[#066b4d]"
          >
            Contact Us
          </a>
        </div>
      </footer>
    </div>
  )
}

export default DriverPasswordReset
