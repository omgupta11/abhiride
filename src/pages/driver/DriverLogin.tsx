
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from 'lucide-react'

import Logo from '../../components/common/Logo'
import Button from '../../components/common/Button'
import { supabase } from '../../lib/supabase'

function DriverLogin() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [isSendingReset, setIsSendingReset] = useState(false)

  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // CHECK EXISTING SESSION

  useEffect(() => {
    let mounted = true

    const checkSession = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) throw sessionError

        if (!session?.user) return

        const { data: driver, error: profileError } = await supabase
          .from('drivers')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle()

        if (profileError) throw profileError

        if (!mounted) return

        if (driver) {
          navigate('/drivers/dashboard', { replace: true })
          return
        }

        await supabase.auth.signOut()

        if (!mounted) return

        setError(
          'No driver profile was found for this account. Please register as a driver first.',
        )
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to check your account. Please try again.',
          )
        }
      } finally {
        if (mounted) {
          setIsCheckingSession(false)
        }
      }
    }

    void checkSession()

    return () => {
      mounted = false
    }
  }, [navigate])

  // DRIVER LOGIN

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitting || isCheckingSession || isSendingReset) return

    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail || !password) {
      setError('Please enter your email address and password.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    setIsSubmitting(true)
    setError('')
    setNotice('')

    try {
      // AUTHENTICATE WITH SUPABASE

      const {
        data,
        error: authError,
      } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })

      if (authError) throw authError

      if (!data.user || !data.session) {
        throw new Error('Unable to sign in. Please try again.')
      }

      // CHECK DRIVER PROFILE

      const {
        data: driver,
        error: profileError,
      } = await supabase
        .from('drivers')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle()

      if (profileError) throw profileError

      if (!driver) {
        await supabase.auth.signOut()

        throw new Error(
          'No driver profile was found for this account. Please register as a driver first.',
        )
      }

      // LOGIN SUCCESSFUL

      navigate('/drivers/dashboard', { replace: true })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to sign in. Please check your details.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // FORGOT PASSWORD

  const handleForgotPassword = async () => {
    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail) {
      setError('Enter your registered email address first.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    setIsSendingReset(true)
    setError('')
    setNotice('')

    try {
      const redirectTo = `${window.location.origin}/drivers/reset-password`

      const {
        error: resetError,
      } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo,
      })

      if (resetError) throw resetError

      setNotice(
        'If an account exists for this email, a password reset link has been sent. Please check your inbox.',
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to send the password reset email. Please try again.',
      )
    } finally {
      setIsSendingReset(false)
    }
  }

  // LOADING SCREEN

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafbfa]">
        <p className="text-sm text-[#68736d]">
          Checking your account...
        </p>
      </div>
    )
  }

  // LOGIN PAGE

  return (
    <div className="flex min-h-screen flex-col bg-[#fafbfa] text-[#151a18]">
      {/* HEADER */}

      <header className="border-b border-[#e8ece9] bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1100px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="AbhiRide homepage">
            <Logo />
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#68736d] transition-colors hover:text-[#087f5b]"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>
        </div>
      </header>

      {/* MAIN LOGIN CONTENT */}

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
        <section className="w-full max-w-[440px]">
          <div className="rounded-2xl border border-[#e8ece9] bg-white p-6 shadow-[0_4px_24px_rgba(20,35,27,0.035)] sm:p-9">
            {/* TITLE */}

            <div className="mb-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0f8f3] text-[#087f5b]">
                <UserRound size={23} />
              </div>

              <h1 className="text-2xl font-semibold tracking-[-0.04em] text-[#151a18] sm:text-3xl">
                Driver sign in
              </h1>

              <p className="mt-2 text-sm leading-6 text-[#818a85]">
                Sign in to access your AbhiRide dashboard.
              </p>
            </div>

            {/* LOGIN FORM */}

            <form onSubmit={handleLogin} noValidate>
              {/* EMAIL */}

              <div>
                <label
                  htmlFor="driver-login-email"
                  className="mb-2 block text-sm font-semibold text-[#454d49]"
                >
                  Email address
                </label>

                <div className="flex h-12 items-center rounded-xl border border-[#e1e7e3] transition-colors focus-within:border-[#087f5b] focus-within:ring-4 focus-within:ring-[#087f5b]/10">
                  <Mail
                    className="ml-4 shrink-0 text-[#818a85]"
                    size={17}
                  />

                  <input
                    id="driver-login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      setError('')
                      setNotice('')
                    }}
                    required
                    disabled={isSubmitting || isSendingReset}
                    className="h-full min-w-0 flex-1 bg-transparent px-3 pr-4 text-sm text-[#151a18] outline-none placeholder:text-[#a0a8a3] disabled:opacity-60"
                  />
                </div>
              </div>

              {/* PASSWORD */}

              <div className="mt-5">
                <label
                  htmlFor="driver-login-password"
                  className="mb-2 block text-sm font-semibold text-[#454d49]"
                >
                  Password
                </label>

                <div className="flex h-12 items-center rounded-xl border border-[#e1e7e3] transition-colors focus-within:border-[#087f5b] focus-within:ring-4 focus-within:ring-[#087f5b]/10">
                  <LockKeyhole
                    className="ml-4 shrink-0 text-[#818a85]"
                    size={17}
                  />

                  <input
                    id="driver-login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value)
                      setError('')
                      setNotice('')
                    }}
                    required
                    disabled={isSubmitting || isSendingReset}
                    className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-[#151a18] outline-none placeholder:text-[#a0a8a3] disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="flex h-full items-center px-4 text-[#818a85] transition-colors hover:text-[#087f5b]"
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>

              {/* FORGOT PASSWORD */}

              <div className="mt-3 text-right">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isSendingReset || isSubmitting}
                  className="text-sm font-semibold text-[#087f5b] transition-colors hover:text-[#066b4d] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSendingReset ? 'Sending link...' : 'Forgot password?'}
                </button>
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

              {/* SUCCESS NOTICE */}

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

              {/* SIGN IN BUTTON */}

              <Button
                type="submit"
                fullWidth
                size="large"
                loading={isSubmitting}
                disabled={isSubmitting || isSendingReset}
                rightIcon={<ArrowRight size={17} />}
                className="mt-6"
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            {/* REGISTRATION LINK */}

            <div className="mt-7 border-t border-[#e8ece9] pt-6 text-center">
              <p className="text-sm text-[#818a85]">
                New to AbhiRide?{' '}
                <Link
                  to="/drivers/register"
                  className="font-semibold text-[#087f5b] transition-colors hover:text-[#066b4d]"
                >
                  Register as a driver
                </Link>
              </p>
            </div>
          </div>
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
            className="text-xs font-semibold text-[#087f5b] transition-colors hover:text-[#066b4d]"
          >
            Contact Us
          </a>
        </div>
      </footer>
    </div>
  )
}

export default DriverLogin
