import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

import Logo from '../../components/common/Logo'
import DriverForm from '../../components/driver/DriverForm'
import { supabase } from '../../lib/supabase'

import type { DriverRegistrationInput } from '../../types/driver'

const DriverRegistration = () => {
  const navigate = useNavigate()

  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  /*
  =========================================
  CHECK EXISTING DRIVER SESSION
  =========================================
  */

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

        // A signed-in user without a driver profile should not
        // accidentally continue with a second registration.
        await supabase.auth.signOut()

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

  /*
  =========================================
  DRIVER REGISTRATION
  =========================================
  */

  const handleRegistration = async (data: DriverRegistrationInput) => {
    if (isSubmitting) return

    setIsSubmitting(true)
    setError('')

    try {
      const normalizedEmail = data.email.trim().toLowerCase()
      const phone = `+91${data.phone.trim()}`

      // Create the driver authentication account.
      const {
        data: authData,
        error: signUpError,
      } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName.trim(),
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
          'Registration requires an active session. Please check that email confirmation is disabled in your Supabase authentication settings.',
        )
      }

      // Check whether a driver profile already exists.
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

      // Create the driver profile.
      const { error: insertError } = await supabase
        .from('drivers')
        .insert({
          id: user.id,
          full_name: data.fullName.trim(),
          phone,
          phone_verified: false,
          vehicle_type: data.vehicleType,
          vehicle_model: data.vehicleModel.trim(),
          vehicle_number: data.vehicleNumber.trim().toUpperCase(),
          profile_photo_url: null,
        })

      if (insertError) throw insertError

      // Upload optional profile photo.
      if (data.profilePhoto) {
        const file = data.profilePhoto
        const fileExtension = file.name.split('.').pop() || 'jpg'
        const filePath = `${user.id}/profile.${fileExtension}`

        const { error: uploadError } = await supabase.storage
          .from('driver-photos')
          .upload(filePath, file, {
            upsert: true,
            contentType: file.type,
          })

        if (uploadError) {
          throw new Error(
            `Your driver profile was created, but the profile photo could not be uploaded: ${uploadError.message}`,
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
          throw new Error(
            `Your driver profile was created, but the profile photo could not be saved: ${photoUpdateError.message}`,
          )
        }
      }

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

  /*
  =========================================
  SESSION CHECK SCREEN
  =========================================
  */

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafbfa]">
        <p className="text-sm text-[#68736d]">
          Checking your account...
        </p>
      </div>
    )
  }

  /*
  =========================================
  REGISTRATION PAGE
  =========================================
  */

  return (
    <div className="min-h-screen bg-[#fafbfa]">

      <header className="border-b border-[#e8ece9] bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">

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

      <main className="mx-auto max-w-[760px] px-4 py-10 sm:px-6 sm:py-14">

        <div className="mb-8 text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0f8f3] text-[#087f5b]">
            <ShieldCheck size={27} />
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-[-0.04em] text-[#151a18]">
            Become an AbhiRide driver
          </h1>

          <p className="mx-auto mt-3 max-w-[480px] text-sm leading-6 text-[#68736d]">
            Create your driver account and connect with nearby customers.
          </p>

        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-700"
          >
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-[#e8ece9] bg-white p-5 shadow-[0_4px_24px_rgba(20,35,27,0.035)] sm:p-8">

          <DriverForm
            onSubmit={handleRegistration}
            isSubmitting={isSubmitting}
            registrationEnabled
          />

        </section>

        <p className="mt-7 text-center text-sm text-[#68736d]">
          Already registered?{' '}
          <Link
            to="/drivers"
            className="font-semibold text-[#087f5b] hover:text-[#066b4d]"
          >
            Sign in to your account
          </Link>
        </p>

        <p className="mt-5 text-center text-xs leading-5 text-[#929a95]">
          Your account uses email and password authentication.
          Mobile verification is not required for the current prototype.
        </p>

      </main>
    </div>
  )
}

export default DriverRegistration
