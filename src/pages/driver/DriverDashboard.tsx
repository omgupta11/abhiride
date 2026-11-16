
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  CarFront,
  Clock3,
  FileText,
  Headset,
  LogOut,
  Phone,
  Pencil,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react'

import Logo from '../../components/common/Logo'
import AvailabilityToggle from '../../components/driver/AvailabilityToggle'
import {
  getDriverProfile,
  getDriverAvailability,
  getDriverLastLocationUpdate,
  setDriverAvailability,
  updateDriverLocation,
  updateDriverProfile,
  signOutDriver,
} from '../../lib/driverService'

import type { DriverProfile, VehicleType } from '../../types/driver'
import type { DriverProfileUpdate } from '../../lib/driverService'

const DriverDashboard = () => {
  const [driver, setDriver] = useState<DriverProfile | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [locationPermissionGranted, setLocationPermissionGranted] =
    useState(false)
  const [lastLocationUpdate, setLastLocationUpdate] =
    useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState<DriverProfileUpdate>({
    fullName: '',
    vehicleType: 'auto',
    vehicleModel: '',
    vehicleNumber: '',
  })

  const watchId = useRef<number | null>(null)
  const heartbeatTimer = useRef<number | null>(null)
  const isLiveRef = useRef(false)
  const lastUploadAt = useRef(0)
  const uploadInProgress = useRef(false)

  const stopLocationTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }

    if (heartbeatTimer.current !== null) {
      window.clearInterval(heartbeatTimer.current)
      heartbeatTimer.current = null
    }

    lastUploadAt.current = 0
    uploadInProgress.current = false
  }

  useEffect(() => {
    let mounted = true

    const loadDashboard = async () => {
      try {
        setLoading(true)
        setError('')

        const [profile, availability, locationUpdate] = await Promise.all([
          getDriverProfile(),
          getDriverAvailability(),
          getDriverLastLocationUpdate(),
        ])

        if (!mounted) return

        setDriver(profile)
        setIsLive(availability)
        isLiveRef.current = availability
        setLastLocationUpdate(locationUpdate)
      } catch (err) {
        if (!mounted) return

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load your driver account.',
        )
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void loadDashboard()

    return () => {
      mounted = false
    }
  }, [])

  // LIVE LOCATION TRACKING

  useEffect(() => {
    if (!isLive || !driver) return

    if (!navigator.geolocation) {
      setError('Location services are not supported by this browser.')
      return
    }

    let active = true

    const uploadLocation = async (
      position: GeolocationPosition,
      force = false,
    ) => {
      if (!active || !isLiveRef.current || uploadInProgress.current) return

      if (!force && Date.now() - lastUploadAt.current < 9000) return

      uploadInProgress.current = true

      try {
        const updatedAt = await updateDriverLocation(
          position.coords.latitude,
          position.coords.longitude,
          position.coords.accuracy,
        )

        if (!active || !isLiveRef.current) return

        lastUploadAt.current = Date.now()
        setLastLocationUpdate(updatedAt)
        setLocationPermissionGranted(true)
        setError('')
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? `Location update failed: ${err.message}`
              : 'Unable to update your location.',
          )
        }
      } finally {
        uploadInProgress.current = false
      }
    }

    const handleLocationError = (geoError: GeolocationPositionError) => {
      if (!active) return

      setError(
        geoError.code === 1
          ? 'Location permission denied. Allow location access in your browser settings. Your LIVE status has not been changed.'
          : geoError.code === 2
            ? 'Your current location could not be determined. Your LIVE status remains unchanged.'
            : 'Location request timed out. Your LIVE status remains unchanged.',
      )
    }

    // Upload the current position immediately when LIVE tracking starts.

    navigator.geolocation.getCurrentPosition(
      (position) => void uploadLocation(position, true),
      handleLocationError,
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    )

    // Listen for position changes reported by the browser.

    const watch = navigator.geolocation.watchPosition(
      (position) => {
        if (!active || !isLiveRef.current) return

        setLocationPermissionGranted(true)
        void uploadLocation(position)
      },
      handleLocationError,
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    )

    watchId.current = watch

    // Refresh the saved location even when the driver is stationary.

    heartbeatTimer.current = window.setInterval(() => {
      if (!active || !isLiveRef.current || uploadInProgress.current) return

      navigator.geolocation.getCurrentPosition(
        (position) => void uploadLocation(position),
        handleLocationError,
        { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
      )
    }, 10000)

    return () => {
      active = false
      navigator.geolocation.clearWatch(watch)

      if (watchId.current === watch) {
        watchId.current = null
      }

      if (heartbeatTimer.current !== null) {
        window.clearInterval(heartbeatTimer.current)
        heartbeatTimer.current = null
      }
    }
  }, [isLive, driver])

  // STOP TRACKING WHEN COMPONENT UNMOUNTS

  useEffect(() => {
    return () => {
      stopLocationTracking()
    }
  }, [])

  // CHANGE DRIVER AVAILABILITY

  const handleAvailabilityChange = async (nextStatus: boolean) => {
    if (isUpdating) return

    // SWITCH OFFLINE

    if (!nextStatus) {
      try {
        setIsUpdating(true)
        setError('')
        setNotice('')

        await setDriverAvailability(false)

        isLiveRef.current = false
        setIsLive(false)
        stopLocationTracking()

        setNotice(
          'You are now OFFLINE. Your last saved location is retained.',
        )
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to switch your availability OFFLINE.',
        )
      } finally {
        setIsUpdating(false)
      }

      return
    }

    // CHECK MOBILE VERIFICATION

    if (!driver?.phoneVerified) {
      setError('Your mobile number must be verified before going LIVE.')
      return
    }

    // CHECK GEOLOCATION SUPPORT

    if (!navigator.geolocation) {
      setError('Location services are not supported by this browser.')
      return
    }

    try {
      setIsUpdating(true)
      setError('')
      setNotice('')

      // GET CURRENT LOCATION BEFORE GOING LIVE

      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0,
          })
        },
      )

      setLocationPermissionGranted(true)

      // ENABLE DRIVER AVAILABILITY

      await setDriverAvailability(true)
      isLiveRef.current = true

      // SAVE INITIAL LOCATION

      try {
        const updatedAt = await updateDriverLocation(
          position.coords.latitude,
          position.coords.longitude,
          position.coords.accuracy,
        )

        setLastLocationUpdate(updatedAt)
        setIsLive(true)

        setNotice(
          'You are LIVE. Your location is now being shared with nearby customers.',
        )
      } catch (locationError) {
        isLiveRef.current = false

        try {
          await setDriverAvailability(false)
        } catch {
          setError(
            'Location could not be saved and the OFFLINE rollback failed. Check your connection and availability status.',
          )
          return
        }

        throw locationError
      }
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        setError(
          err.code === 1
            ? 'Location permission denied. Allow location access in your browser settings.'
            : err.code === 2
              ? 'Your current location could not be determined. Please try again.'
              : 'Location request timed out. Please try again.',
        )
      } else {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to activate LIVE status.',
        )
      }
    } finally {
      setIsUpdating(false)
    }
  }

  // EDIT DRIVER PROFILE

const handleOpenProfileEditor = () => {
  if (!driver) return

  setProfileForm({
    fullName: driver.fullName,
    vehicleType: driver.vehicleType,
    vehicleModel: driver.vehicleModel,
    vehicleNumber: driver.vehicleNumber,
  })

  setError('')
  setNotice('')
  setIsEditingProfile(true)
}

  const handleCancelProfileEdit = () => {
    if (isSavingProfile) return

    setIsEditingProfile(false)
    setError('')
  }

  const handleSaveProfile = async () => {
    if (isSavingProfile) return

    const fullName = profileForm.fullName.trim()
    const vehicleModel = profileForm.vehicleModel.trim()
    const vehicleNumber = profileForm.vehicleNumber.trim().toUpperCase()

    if (fullName.length < 2 || fullName.length > 80) {
      setError('Full name must contain between 2 and 80 characters.')
      return
    }

    if (vehicleModel.length < 2 || vehicleModel.length > 60) {
      setError('Vehicle model must contain between 2 and 60 characters.')
      return
    }

    if (!/^[A-Z0-9 -]{6,15}$/.test(vehicleNumber)) {
      setError('Please enter a valid vehicle registration number.')
      return
    }

    try {
      setIsSavingProfile(true)
      setError('')
      setNotice('')

      const updatedProfile = await updateDriverProfile({
        fullName,
        vehicleType: profileForm.vehicleType,
        vehicleModel,
        vehicleNumber,
      })

      setDriver(updatedProfile)
      setIsEditingProfile(false)
      setNotice('Your driver profile has been updated successfully.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update your driver profile. Please try again.',
      )
    } finally {
      setIsSavingProfile(false)
    }
  }

  // DRIVER LOGOUT

  const handleLogout = async () => {
    try {
      setError('')
      stopLocationTracking()

      await signOutDriver()

      window.location.assign('/drivers')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to sign out.',
      )
    }
  }

  // LOADING SCREEN

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafbfa]">
        <p className="text-sm text-[#68736d]">
          Loading your driver dashboard...
        </p>
      </div>
    )
  }

  // DRIVER PROFILE UNAVAILABLE

  if (!driver) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafbfa] px-4">
        <div className="w-full max-w-md rounded-2xl border border-[#e8ece9] bg-white p-8 text-center">
          <ShieldCheck size={36} className="mx-auto text-[#087f5b]" />

          <h1 className="mt-4 text-xl font-semibold text-[#151a18]">
            Driver account unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#68736d]">
            {error ||
              'Sign in with your registered driver account to continue.'}
          </p>

          <Link
            to="/drivers"
            className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#087f5b] px-5 text-sm font-semibold text-white"
          >
            Driver sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafbfa]">
      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-[#e8ece9] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="AbhiRide homepage">
            <Logo />
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs font-medium text-[#818a85] sm:inline">
              Driver dashboard
            </span>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#e8ece9] bg-white px-3 text-xs font-semibold text-[#454d49] transition-colors hover:bg-[#f5f8f6]"
            >
              <LogOut size={15} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN DASHBOARD */}

      <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {error && (
          <p
            role="alert"
            className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {notice && (
          <p
            role="status"
            className="mb-4 rounded-xl bg-[#f0f8f3] p-3 text-sm text-[#087f5b]"
          >
            {notice}
          </p>
        )}

        {/* DASHBOARD HEADING */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#087f5b]">
              DRIVER ACCOUNT
            </p>

            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#151a18] sm:text-3xl">
              Driver dashboard
            </h1>

            <p className="mt-2 text-sm leading-6 text-[#818a85]">
              Your driver profile, vehicle details and availability.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 self-start rounded-full border border-[#dce9df] bg-[#f0f8f3] px-3 py-2 sm:self-auto">
            <span className="h-2 w-2 rounded-full bg-[#168653]" />

            <span className="text-xs font-medium text-[#087f5b]">
              Account connected
            </span>
          </div>
        </div>

        {/* ACCOUNT CONNECTION */}

        <section className="mt-8 overflow-hidden rounded-2xl border border-[#dce9df] bg-white shadow-[0_4px_24px_rgba(20,35,27,0.035)]">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-10">
            <div className="max-w-[620px]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0f8f3] text-[#087f5b]">
                <ShieldCheck size={23} />
              </div>

              <h2 className="mt-5 text-xl font-semibold tracking-[-0.5px] text-[#151a18] sm:text-2xl">
                Welcome, {driver.fullName}
              </h2>

              <p className="mt-3 text-sm leading-7 text-[#68736d]">
                Your driver account is connected. Manage your availability
                and keep your profile details up to date.
              </p>
            </div>

            <div className="hidden h-36 w-36 items-center justify-center rounded-full bg-[#f0f8f3] lg:flex">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-[#087f5b] shadow-sm">
                <UserRound size={42} strokeWidth={1.4} />
              </div>
            </div>
          </div>
        </section>

        {/* DASHBOARD GRID */}

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* LEFT COLUMN */}

          <div className="space-y-6">
            {/* AVAILABILITY */}

            <AvailabilityToggle
              isLive={isLive}
              onToggle={handleAvailabilityChange}
              isUpdating={isUpdating}
              disabled={!driver.phoneVerified}
              lastLocationUpdate={lastLocationUpdate}
              locationPermissionGranted={locationPermissionGranted}
            />

            {/* DRIVER PROFILE */}

            <section className="overflow-hidden rounded-2xl border border-[#e8ece9] bg-white shadow-[0_2px_12px_rgba(20,35,27,0.035)]">
              <div className="flex items-center justify-between border-b border-[#edf0ed] px-5 py-4 sm:px-6">
                <div>
                  <h2 className="text-base font-semibold text-[#151a18]">
                    Driver profile
                  </h2>

                  <p className="mt-1 text-xs text-[#818a85]">
                    Your registered personal details
                  </p>
                </div>

                {!isEditingProfile ? (
                  <button
                    type="button"
                    onClick={handleOpenProfileEditor}
                    className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#dce9df] bg-[#f0f8f3] px-3 text-xs font-semibold text-[#087f5b] transition-colors hover:bg-[#e6f3eb]"
                  >
                    <Pencil size={14} />
                    Edit profile
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-[#087f5b]">
                    Editing profile
                  </span>
                )}
              </div>

              <div className="p-5 sm:p-6">
                {!isEditingProfile ? (
                  <>
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#dce4de] bg-[#fafbfa] px-5 py-7 text-center">
                      {driver.profilePhotoUrl ? (
                        <img
                          src={driver.profilePhotoUrl}
                          alt={`${driver.fullName} profile`}
                          className="h-20 w-20 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f0f8f3] text-[#087f5b]">
                          <UserRound size={28} />
                        </div>
                      )}

                      <h3 className="mt-4 text-base font-semibold text-[#151a18]">
                        {driver.fullName}
                      </h3>

                      <p className="mt-2 text-sm text-[#68736d]">
                        {driver.phone}
                      </p>

                      <div className="mt-3 flex items-center gap-2">
                        <ShieldCheck
                          size={15}
                          className={
                            driver.phoneVerified
                              ? 'text-[#168653]'
                              : 'text-[#b7791f]'
                          }
                        />

                        <span className="text-xs text-[#68736d]">
                          {driver.phoneVerified
                            ? 'Mobile verified'
                            : 'Mobile not verified'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 border-t border-[#edf0ed] pt-5 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-[#818a85]">
                          Mobile number
                        </p>

                        <div className="mt-2 flex items-center gap-2">
                          <Phone size={15} className="text-[#818a85]" />

                          <span className="text-sm font-medium text-[#454d49]">
                            {driver.phone}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-[#818a85]">
                          Account verification
                        </p>

                        <div className="mt-2 flex items-center gap-2">
                          <ShieldCheck size={15} className="text-[#818a85]" />

                          <span className="text-sm font-medium text-[#454d49]">
                            {driver.phoneVerified ? 'Verified' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <label
                        htmlFor="edit-driver-full-name"
                        className="mb-2 block text-sm font-semibold text-[#454d49]"
                      >
                        Full name
                      </label>
                      <input
                        id="edit-driver-full-name"
                        type="text"
                        autoComplete="name"
                        maxLength={80}
                        value={profileForm.fullName}
                        onChange={(event) =>
                          setProfileForm((previous) => ({
                            ...previous,
                            fullName: event.target.value,
                          }))
                        }
                        className="min-h-12 w-full rounded-xl border border-[#e8ece9] bg-white px-4 text-sm text-[#151a18] outline-none transition-colors focus:border-[#087f5b] focus:ring-4 focus:ring-[#087f5b]/10"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="edit-driver-vehicle-type"
                        className="mb-2 block text-sm font-semibold text-[#454d49]"
                      >
                        Vehicle category
                      </label>
                      <select
                        id="edit-driver-vehicle-type"
                        value={profileForm.vehicleType}
                        onChange={(event) =>
                          setProfileForm((previous) => ({
                            ...previous,
                            vehicleType: event.target.value as VehicleType,
                          }))
                        }
                        className="min-h-12 w-full rounded-xl border border-[#e8ece9] bg-white px-4 text-sm text-[#151a18] outline-none transition-colors focus:border-[#087f5b] focus:ring-4 focus:ring-[#087f5b]/10"
                      >
                        <option value="auto">Auto</option>
                        <option value="taxi">Taxi</option>
                        <option value="bike">Bike</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="edit-driver-vehicle-model"
                        className="mb-2 block text-sm font-semibold text-[#454d49]"
                      >
                        Vehicle model
                      </label>
                      <input
                        id="edit-driver-vehicle-model"
                        type="text"
                        maxLength={60}
                        placeholder="e.g. Bajaj RE, Maruti Dzire, Honda Activa"
                        value={profileForm.vehicleModel}
                        onChange={(event) =>
                          setProfileForm((previous) => ({
                            ...previous,
                            vehicleModel: event.target.value,
                          }))
                        }
                        className="min-h-12 w-full rounded-xl border border-[#e8ece9] bg-white px-4 text-sm text-[#151a18] outline-none transition-colors focus:border-[#087f5b] focus:ring-4 focus:ring-[#087f5b]/10"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="edit-driver-vehicle-number"
                        className="mb-2 block text-sm font-semibold text-[#454d49]"
                      >
                        Vehicle registration number
                      </label>
                      <input
                        id="edit-driver-vehicle-number"
                        type="text"
                        autoCapitalize="characters"
                        maxLength={15}
                        placeholder="e.g. UP78AB1234"
                        value={profileForm.vehicleNumber}
                        onChange={(event) =>
                          setProfileForm((previous) => ({
                            ...previous,
                            vehicleNumber: event.target.value
                              .toUpperCase()
                              .replace(/[^A-Z0-9 -]/g, ''),
                          }))
                        }
                        className="min-h-12 w-full rounded-xl border border-[#e8ece9] bg-white px-4 text-sm uppercase text-[#151a18] outline-none transition-colors focus:border-[#087f5b] focus:ring-4 focus:ring-[#087f5b]/10"
                      />
                    </div>

                    <div className="rounded-xl border border-[#e8ece9] bg-[#fafbfa] p-4">
                      <div className="flex items-center gap-2">
                        <Phone size={15} className="text-[#818a85]" />
                        <span className="text-xs font-semibold text-[#454d49]">
                          Registered mobile number
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-[#454d49]">
                        {driver.phone}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[#818a85]">
                        Mobile number cannot be changed from this form.
                      </p>
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-[#edf0ed] pt-5 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={handleCancelProfileEdit}
                        disabled={isSavingProfile}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#e8ece9] bg-white px-4 text-sm font-semibold text-[#454d49] transition-colors hover:bg-[#f5f8f6] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <X size={16} />
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveProfile}
                        disabled={isSavingProfile}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#087f5b] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#066b4d] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Save size={16} />
                        {isSavingProfile ? 'Saving...' : 'Save changes'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* REGISTERED VEHICLE */}

            <section className="overflow-hidden rounded-2xl border border-[#e8ece9] bg-white shadow-[0_2px_12px_rgba(20,35,27,0.035)]">
              <div className="flex items-center justify-between border-b border-[#edf0ed] px-5 py-4 sm:px-6">
                <div>
                  <h2 className="text-base font-semibold text-[#151a18]">
                    Registered vehicle
                  </h2>

                  <p className="mt-1 text-xs text-[#818a85]">
                    Vehicle associated with your account
                  </p>
                </div>

                <CarFront size={21} className="text-[#818a85]" />
              </div>

              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-4 rounded-xl border border-dashed border-[#dce4de] bg-[#fafbfa] p-5">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#f0f8f3] text-[#087f5b]">
                    <CarFront size={26} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-[#151a18]">
                      {driver.vehicleModel}
                    </h3>

                    <p className="mt-1 text-xs text-[#68736d]">
                      {driver.vehicleType.toUpperCase()}
                    </p>

                    <p className="mt-1 text-sm font-semibold tracking-wide text-[#454d49]">
                      {driver.vehicleNumber}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2 border-t border-[#edf0ed] pt-4">
                  <FileText size={15} className="text-[#818a85]" />

                  <span className="text-xs text-[#818a85]">
                    Vehicle details retrieved from your registered driver profile.
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN */}

          <aside className="space-y-6">
            {/* ACCOUNT INFORMATION */}

            <section className="rounded-2xl border border-[#e8ece9] bg-white p-5 shadow-[0_2px_12px_rgba(20,35,27,0.035)] sm:p-6">
              <h2 className="text-base font-semibold text-[#151a18]">
                Your account
              </h2>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f3faf6] text-[#087f5b]">
                      <UserRound size={17} />
                    </div>

                    <span className="text-sm text-[#454d49]">
                      Account status
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-[#168653]">
                    Connected
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f3faf6] text-[#087f5b]">
                      <ShieldCheck size={17} />
                    </div>

                    <span className="text-sm text-[#454d49]">
                      Mobile verification
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-[#818a85]">
                    {driver.phoneVerified ? 'Verified' : 'Not verified'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f3faf6] text-[#087f5b]">
                      <CarFront size={17} />
                    </div>

                    <span className="text-sm text-[#454d49]">
                      Vehicle category
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-[#818a85]">
                    {driver.vehicleType.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f3faf6] text-[#087f5b]">
                      <Clock3 size={17} />
                    </div>

                    <span className="text-sm text-[#454d49]">
                      Availability
                    </span>
                  </div>

                  <span
                    className={`text-xs font-semibold ${
                      isLive ? 'text-[#168653]' : 'text-[#818a85]'
                    }`}
                  >
                    {isLive ? 'LIVE' : 'OFFLINE'}
                  </span>
                </div>
              </div>
            </section>

            {/* HOW ABHIRIDE WORKS */}

            <section className="rounded-2xl border border-[#e8ece9] bg-white p-5 sm:p-6">
              <h2 className="text-base font-semibold text-[#151a18]">
                How AbhiRide works
              </h2>

              <div className="mt-5 space-y-5">
                <div className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f0f8f3] text-xs font-bold text-[#087f5b]">
                    1
                  </span>

                  <div>
                    <h3 className="text-sm font-semibold text-[#151a18]">
                      Register your account
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-[#818a85]">
                      Provide your personal and vehicle information to create your driver profile.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f0f8f3] text-xs font-bold text-[#087f5b]">
                    2
                  </span>

                  <div>
                    <h3 className="text-sm font-semibold text-[#151a18]">
                      Switch LIVE
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-[#818a85]">
                      Control your availability and allow customers to discover your driver profile.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f0f8f3] text-xs font-bold text-[#087f5b]">
                    3
                  </span>

                  <div>
                    <h3 className="text-sm font-semibold text-[#151a18]">
                      Get discovered
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-[#818a85]">
                      Nearby customers can find your vehicle and contact you directly.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f0f8f3] text-xs font-bold text-[#087f5b]">
                    4
                  </span>

                  <div>
                    <h3 className="text-sm font-semibold text-[#151a18]">
                      Agree on the ride
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-[#818a85]">
                      Discuss the fare and journey directly with your customer.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* SUPPORT */}

            <section className="rounded-2xl bg-[#f0f8f3] p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <Headset size={19} className="text-[#087f5b]" />

                <h2 className="text-sm font-semibold text-[#151a18]">
                  Need assistance?
                </h2>
              </div>

              <p className="mt-2 text-xs leading-6 text-[#68736d]">
                For account, registration or technical assistance, use the AbhiRide support channel when it becomes available.
              </p>

              <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#087f5b]">
                Support coming soon
                <ArrowRight size={14} />
              </span>
            </section>
          </aside>
        </div>

        {/* FOOTER */}

        <footer className="mt-12 flex flex-col gap-3 border-t border-[#e8ece9] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Logo size="small" />

          <p className="text-xs text-[#818a85]">
            © {new Date().getFullYear()} AbhiRide. All rights reserved.
          </p>

          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#087f5b] hover:text-[#066b4d]"
          >
            Visit AbhiRide
            <ArrowUpRight size={13} />
          </Link>
        </footer>
      </main>
    </div>
  )
}

export default DriverDashboard
