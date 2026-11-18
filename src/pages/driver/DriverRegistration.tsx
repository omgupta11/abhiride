
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

import Logo from '../../components/common/Logo'
import DriverForm from '../../components/driver/DriverForm'
import { supabase } from '../../lib/supabase'

import type { DriverRegistrationInput } from '../../types/driver'

const normalizeIndianPhone = (value: string) => {
  let digits = value.replace(/\D/g, '')

  if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.slice(2)
  }

  if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1)
  }

  if (!/^[6-9]\d{9}$/.test(digits)) {
    throw new Error('Please enter a valid 10-digit Indian mobile number.')
  }

  return `+91${digits}`
}

const DriverRegistration = () => {
  const navigate = useNavigate()

  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // CHECK EXISTING DRIVER SESSION

  useEffect(() => {
    let mounted = true

    const checkExistingSession = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) throw sessionError

        if (!session) {
          if (mounted) setIsCheckingSession(false)
          return
        }

        const { data: driver, error: driverError } = await supabase
          .from('drivers')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle()

        if (driverError) throw driverError

        if (driver) {
          navigate('/drivers/dashboard', { replace: true })
          return
        }

        // Clear an incomplete or non-driver session before registration.
        const { error: signOutError } = await supabase.auth.signOut()

        if (signOutError) throw signOutError

        if (mounted) setIsCheckingSession(false)
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to check your account. Please try again.',
          )
          setIsCheckingSession(false)
        }
      }
    }

    void checkExistingSession()

    return () => {
      mounted = false
    }
  }, [navigate])

  // DRIVER REGISTRATION

  const handleRegistration = async (data: DriverRegistrationInput) => {
    if (isSubmitting) return

    setIsSubmitting(true)
    setError('')

    try {
      const normalizedEmail = data.email.trim().toLowerCase()
      const fullName = data.fullName.trim()
      const phone = normalizeIndianPhone(data.phone)

      // CREATE AUTHENTICATION ACCOUNT

      const {
        data: authData,
        error: signUpError,
      } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: data.password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (signUpError) throw signUpError

      const user = authData.user

      if (!user) {
        throw new Error(
          'Your account could not be created. Please try again.',
        )
      }

      if (!authData.session) {
        throw new Error(
          'Registration could not start an active session. Please check that email confirmation is disabled in your Supabase authentication settings for this prototype.',
        )
      }

      // CHECK FOR AN EXISTING DRIVER PROFILE

      const {
        data: existingDriver,
        error: existingDriverError,
      } = await supabase
        .from('drivers')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (existingDriverError) throw existingDriverError

      if (existingDriver) {
        navigate('/drivers/dashboard', { replace: true })
        return
      }

      // CREATE DRIVER PROFILE

      const { error: insertError } = await supabase
        .from('drivers')
        .insert({
          id: user.id,
          full_name: fullName,
          phone,
          phone_verified: false,
          vehicle_type: data.vehicleType,
          vehicle_model: data.vehicleModel.trim(),
          vehicle_number: data.vehicleNumber.trim().toUpperCase(),
          profile_photo_url: null,
        })

      if (insertError) throw insertError

      // UPLOAD OPTIONAL PROFILE PHOTO

      if (data.profilePhoto) {
        const file = data.profilePhoto

        const fileExtension =
          file.type === 'image/png'
            ? 'png'
            : file.type === 'image/webp'
              ? 'webp'
              : 'jpg'

        const filePath = `${user.id}/profile-${crypto.randomUUID()}.${fileExtension}`

        const { error: uploadError } = await supabase.storage
          .from('driver-photos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type,
          })

        if (uploadError) {
          throw new Error(
            `Your driver account was created, but the profile photo could not be uploaded: ${uploadError.message}`,
          )
        }

        const {
          data: { publicUrl },
        } = supabase.storage
          .from('driver-photos')
          .getPublicUrl(filePath)

        const { error: photoUpdateError } = await supabase
          .from('drivers')
          .update({
            profile_photo_url: publicUrl,
          })
          .eq('id', user.id)

        if (photoUpdateError) {
          try {
            await supabase.storage
              .from('driver-photos')
              .remove([filePath])
          } catch {
            // Keep the driver profile even if photo cleanup fails.
          }

          throw new Error(
            `Your driver account was created, but the profile photo could not be saved: ${photoUpdateError.message}`,
          )
        }
      }

      // REGISTRATION COMPLETE

      navigate('/drivers/dashboard', { replace: true })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Registration failed. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // SESSION CHECK SCREEN

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafbfa]">
        <p className="text-sm text-[#68736d]">
          Checking your account...
        </p>
      </div>
    )
  }

  // REGISTRATION PAGE

  return (
    <div className="min-h-screen bg-[#fafbfa]">
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

      <main className="mx-auto flex min-h-[calc(100vh-145px)] max-w-[760px] flex-col px-4 py-9 sm:px-6 sm:py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0f8f3] text-[#087f5b]">
            <ShieldCheck size={27} />
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-[-0.04em] text-[#151a18]">
            Driver registration
          </h1>

          <p className="mx-auto mt-3 max-w-[460px] text-sm leading-6 text-[#68736d]">
            Create your AbhiRide driver account.
          </p>
        </div>

        {/* ERROR MESSAGE */}

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-700"
          >
            {error}
          </div>
        )}

        {/* REGISTRATION FORM */}

        <section className="rounded-2xl border border-[#e8ece9] bg-white p-5 shadow-[0_4px_24px_rgba(20,35,27,0.035)] sm:p-8">
          <DriverForm
            onSubmit={handleRegistration}
            isSubmitting={isSubmitting}
            registrationEnabled
          />
        </section>

        {/* SIGN IN LINK */}

        <p className="mt-7 text-center text-sm text-[#68736d]">
          Already registered?{' '}
          <Link
            to="/drivers"
            className="font-semibold text-[#087f5b] transition-colors hover:text-[#066b4d]"
          >
            Sign in to your account
          </Link>
        </p>

        {/* FOOTER */}

        <footer className="mt-auto flex flex-col items-center gap-3 border-t border-[#e8ece9] pt-6 sm:flex-row sm:justify-between">
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
        </footer>
      </main>
    </div>
  )
}

export default DriverRegistration
