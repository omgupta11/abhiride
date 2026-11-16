
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
  AlertCircle,
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
        setError(
          'No driver profile was found for this account. Please register as a driver first.',
        )
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to check your session.',
          )
        }
      } finally {
        if (mounted) setIsCheckingSession(false)
      }
    }

    void checkSession()

    return () => {
      mounted = false
    }
  }, [navigate])

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitting || isCheckingSession) return

    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail || !password) {
      setError('Please enter your email address and password.')
      return
    }

    setIsSubmitting(true)
    setError('')
    setNotice('')

    try {
      const { data, error: authError } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        })

      if (authError) throw authError

      if (!data.user || !data.session) {
        throw new Error('Unable to sign in. Please try again.')
      }

      const { data: driver, error: profileError } = await supabase
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

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo,
        })

      if (resetError) throw resetError

      setNotice(
        'If an account exists for this email, a password reset link has been sent. Check your inbox.',
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to send the password reset email.',
      )
    } finally {
      setIsSendingReset(false)
    }
  }

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-[#68736d]">
          Checking your driver account...
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-[#151a18]">
      <header className="border-b border-[#e8ece9]">
        <div className="mx-auto flex h-[76px] w-[min(100%-40px,1200px)] items-center justify-between">
          <Link to="/" aria-label="AbhiRide homepage">
            <Logo size="medium" />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#454d49]"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-77px)] w-[min(100%-40px,1100px)] grid-cols-1 items-center gap-14 py-12 lg:grid-cols-[1fr_440px]">
        <section className="mx-auto w-full max-w-[490px] lg:mx-0">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#dcefe5] bg-[#f0f8f3] px-3.5 py-2 text-xs font-semibold text-[#087f5b]">
            <ShieldCheck size={15} />
            Driver partner access
          </div>

          <h1 className="text-[36px] font-semibold tracking-[-1.5px] sm:text-[44px]">
            Your next ride starts with being{' '}
            <span className="text-[#087f5b]">available.</span>
          </h1>

          <p className="mt-5 text-[15px] leading-7 text-[#69736d]">
            Sign in to manage your driver profile, control your availability
            and help nearby customers find you.
          </p>
        </section>

        <section className="mx-auto w-full max-w-[440px]">
          <div className="rounded-[22px] border border-[#e8ece9] bg-white p-7 shadow-[0_12px_50px_rgba(21,26,24,0.06)] sm:p-9">
            <div className="mb-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf7f1] text-[#087f5b]">
                <UserRound size={22} />
              </div>
              <h2 className="text-[25px] font-semibold">
                Driver sign in
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#818a85]">
                Enter your registered email address and password.
              </p>
            </div>

            <form onSubmit={handleLogin} noValidate>
              <label
                htmlFor="driver-login-email"
                className="mb-2 block text-sm font-semibold"
              >
                Email address
              </label>
              <div className="flex h-[52px] items-center rounded-xl border border-[#e1e7e3]">
                <Mail className="mx-4 text-[#818a85]" size={17} />
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
                  className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
                />
              </div>

              <label
                htmlFor="driver-login-password"
                className="mb-2 mt-5 block text-sm font-semibold"
              >
                Password
              </label>
              <div className="flex h-[52px] items-center rounded-xl border border-[#e1e7e3]">
                <LockKeyhole className="mx-4 text-[#818a85]" size={17} />
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
                  disabled={isSubmitting}
                  className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="px-4 text-[#818a85]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              <div className="mt-3 text-right">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isSendingReset || isSubmitting}
                  className="text-sm font-semibold text-[#087f5b] hover:underline disabled:opacity-50"
                >
                  {isSendingReset ? 'Sending link...' : 'Forgot password?'}
                </button>
              </div>

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
                loading={isSubmitting}
                disabled={isSubmitting || isSendingReset}
                rightIcon={<ArrowRight size={17} />}
                className="mt-6"
              >
                {isSubmitting ? 'Signing in...' : 'Sign in to dashboard'}
              </Button>
            </form>

            <div className="mt-8 border-t border-[#e8ece9] pt-6 text-center">
              <p className="text-sm text-[#818a85]">
                New to AbhiRide?{' '}
                <Link
                  to="/drivers/register"
                  className="font-semibold text-[#087f5b]"
                >
                  Register as a driver
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default DriverLogin
