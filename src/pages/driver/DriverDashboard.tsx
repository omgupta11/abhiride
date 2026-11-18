
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import { Link } from 'react-router-dom'
import {
  CarFront,
  ImagePlus,
  LogOut,
  Pencil,
  Phone,
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

import { supabase } from '../../lib/supabase'

import type { DriverProfile, VehicleType } from '../../types/driver'
import type { DriverProfileUpdate } from '../../lib/driverService'

const MAX_PHOTO_SIZE = 5 * 1024 * 1024

const ALLOWED_PHOTO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

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

  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

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

  // CLEAN UP PHOTO PREVIEW

  useEffect(() => {
    if (!photoPreview) return

    return () => {
      URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  // STOP LOCATION TRACKING

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

  // LOAD DRIVER DASHBOARD

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

    const handleLocationError = (
      geoError: GeolocationPositionError,
    ) => {
      if (!active) return

      setError(
        geoError.code === 1
          ? 'Location permission denied. Allow location access in your browser settings. Your LIVE status has not been changed.'
          : geoError.code === 2
            ? 'Your current location could not be determined. Your LIVE status remains unchanged.'
            : 'Location request timed out. Your LIVE status remains unchanged.',
      )
    }

    navigator.geolocation.getCurrentPosition(
      (position) => void uploadLocation(position, true),
      handleLocationError,
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20000,
      },
    )

    const watch = navigator.geolocation.watchPosition(
      (position) => {
        if (!active || !isLiveRef.current) return

        setLocationPermissionGranted(true)
        void uploadLocation(position)
      },
      handleLocationError,
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 20000,
      },
    )

    watchId.current = watch

    heartbeatTimer.current = window.setInterval(() => {
      if (!active || !isLiveRef.current || uploadInProgress.current) return

      navigator.geolocation.getCurrentPosition(
        (position) => void uploadLocation(position),
        handleLocationError,
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 20000,
        },
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

  // CLEAN UP LOCATION TRACKING

  useEffect(() => {
    return () => {
      stopLocationTracking()
    }
  }, [])

  // CHANGE DRIVER AVAILABILITY

  const handleAvailabilityChange = async (nextStatus: boolean) => {
    if (isUpdating) return

    if (!nextStatus) {
      try {
        setIsUpdating(true)
        setError('')
        setNotice('')

        await setDriverAvailability(false)

        isLiveRef.current = false
        setIsLive(false)
        stopLocationTracking()

        setNotice('You are now OFFLINE.')
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

    if (!driver?.phoneVerified) {
      setError('Your mobile number must be verified before going LIVE.')
      return
    }

    if (!navigator.geolocation) {
      setError('Location services are not supported by this browser.')
      return
    }

    try {
      setIsUpdating(true)
      setError('')
      setNotice('')

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

      await setDriverAvailability(true)
      isLiveRef.current = true

      try {
        const updatedAt = await updateDriverLocation(
          position.coords.latitude,
          position.coords.longitude,
          position.coords.accuracy,
        )

        setLastLocationUpdate(updatedAt)
        setIsLive(true)

        setNotice(
          'You are LIVE. Nearby customers can now discover your vehicle.',
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

  // OPEN PROFILE EDITOR

  const handleOpenProfileEditor = () => {
    if (!driver) return

    setProfileForm({
      fullName: driver.fullName,
      vehicleType: driver.vehicleType,
      vehicleModel: driver.vehicleModel,
      vehicleNumber: driver.vehicleNumber,
    })

    setSelectedPhoto(null)
    setPhotoPreview(null)
    setError('')
    setNotice('')
    setIsEditingProfile(true)
  }

  // SELECT PROFILE PHOTO

  const handleProfilePhotoChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]

    if (!file) return

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setError('Please select a JPG, PNG or WebP image.')
      event.target.value = ''
      return
    }

    if (file.size > MAX_PHOTO_SIZE) {
      setError('Profile photo must be smaller than 5 MB.')
      event.target.value = ''
      return
    }

    setError('')
    setSelectedPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))

    event.target.value = ''
  }

  // CANCEL PROFILE EDITING

  const handleCancelProfileEdit = () => {
    if (isSavingProfile) return

    setIsEditingProfile(false)
    setSelectedPhoto(null)
    setPhotoPreview(null)
    setError('')
  }

  // SAVE DRIVER PROFILE AND PHOTO

  const handleSaveProfile = async () => {
    if (isSavingProfile || !driver) return

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

      if (selectedPhoto) {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError) throw authError

        if (!user) {
          throw new Error('Please sign in again to update your photo.')
        }

        const extension =
          selectedPhoto.type === 'image/png'
            ? 'png'
            : selectedPhoto.type === 'image/webp'
              ? 'webp'
              : 'jpg'

        const photoPath = `${user.id}/${crypto.randomUUID()}.${extension}`

        const { error: uploadError } = await supabase.storage
          .from('driver-photos')
          .upload(photoPath, selectedPhoto, {
            cacheControl: '3600',
            upsert: false,
            contentType: selectedPhoto.type,
          })

        if (uploadError) throw uploadError

        const { data: photoData } = supabase.storage
          .from('driver-photos')
          .getPublicUrl(photoPath)

        const { error: photoUpdateError } = await supabase
          .from('drivers')
          .update({
            profile_photo_url: photoData.publicUrl,
          })
          .eq('id', user.id)

        if (photoUpdateError) {
          try {
            await supabase.storage
              .from('driver-photos')
              .remove([photoPath])
          } catch {
            // Retain the existing profile photo if linking fails.
          }

          throw photoUpdateError
        }

        setDriver({
          ...updatedProfile,
          profilePhotoUrl: photoData.publicUrl,
        })
      }

      setIsEditingProfile(false)
      setSelectedPhoto(null)
      setPhotoPreview(null)

      setNotice(
        selectedPhoto
          ? 'Your profile and photo have been updated successfully.'
          : 'Your driver profile has been updated successfully.',
      )
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

    window.location.replace('/')
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
          Loading your dashboard...
        </p>
      </div>
    )
  }

  // DRIVER PROFILE UNAVAILABLE

  if (!driver) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafbfa] px-4">
        <div className="w-full max-w-md rounded-2xl border border-[#e8ece9] bg-white p-8 text-center">
          <ShieldCheck
            size={36}
            className="mx-auto text-[#087f5b]"
          />

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
        <div className="mx-auto flex h-[72px] max-w-[1100px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="AbhiRide homepage">
            <Logo />
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#e8ece9] bg-white px-3 text-xs font-semibold text-[#454d49] transition-colors hover:bg-[#f5f8f6]"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        {/* ALERTS */}

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

        {/* DASHBOARD TITLE */}

        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#087f5b]">
            DRIVER DASHBOARD
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#151a18] sm:text-3xl">
            Welcome, {driver.fullName}
          </h1>
        </div>

        {/* AVAILABILITY */}

        <section className="mb-6">
          <AvailabilityToggle
            isLive={isLive}
            onToggle={handleAvailabilityChange}
            isUpdating={isUpdating}
            disabled={!driver.phoneVerified}
            lastLocationUpdate={lastLocationUpdate}
            locationPermissionGranted={locationPermissionGranted}
          />
        </section>

        {/* DRIVER PROFILE */}

        <section className="overflow-hidden rounded-2xl border border-[#e8ece9] bg-white shadow-[0_2px_12px_rgba(20,35,27,0.035)]">
          <div className="flex items-center justify-between border-b border-[#edf0ed] px-5 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-[#151a18]">
              Your profile
            </h2>

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
                Editing
              </span>
            )}
          </div>

          <div className="p-5 sm:p-6">
            {!isEditingProfile ? (
              <>
                {/* PROFILE SUMMARY */}

                <div className="flex flex-col items-center gap-4 rounded-xl bg-[#fafbfa] px-5 py-7 text-center sm:flex-row sm:text-left">
                  {driver.profilePhotoUrl ? (
                    <img
                      src={driver.profilePhotoUrl}
                      alt={`${driver.fullName} profile`}
                      className="h-20 w-20 shrink-0 rounded-full border border-[#e8ece9] object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#f0f8f3] text-[#087f5b]">
                      <UserRound size={34} />
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-[#151a18]">
                      {driver.fullName}
                    </h3>

                    <p className="mt-1 flex items-center justify-center gap-2 text-sm text-[#68736d] sm:justify-start">
                      <Phone size={14} />
                      {driver.phone}
                    </p>
                  </div>
                </div>

                {/* PROFILE AND VEHICLE DETAILS */}

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-[#818a85]">
                      Vehicle category
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <CarFront
                        size={17}
                        className="text-[#087f5b]"
                      />

                      <span className="text-sm font-semibold capitalize text-[#454d49]">
                        {driver.vehicleType}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-[#818a85]">
                      Vehicle model
                    </p>

                    <p className="mt-2 text-sm font-semibold text-[#454d49]">
                      {driver.vehicleModel}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-xs font-medium text-[#818a85]">
                      Vehicle registration number
                    </p>

                    <p className="mt-2 text-sm font-semibold tracking-wide text-[#454d49]">
                      {driver.vehicleNumber}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-5">
                {/* PROFILE PHOTO */}

                <div>
                  <label className="mb-3 block text-sm font-semibold text-[#454d49]">
                    Profile photo
                  </label>

                  <div className="flex flex-wrap items-center gap-4 rounded-xl border border-dashed border-[#dce4de] bg-[#fafbfa] p-4">
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#e8ece9] bg-[#f0f8f3]">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="New profile photo preview"
                          className="h-full w-full object-cover"
                        />
                      ) : driver.profilePhotoUrl ? (
                        <img
                          src={driver.profilePhotoUrl}
                          alt={`${driver.fullName} profile`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserRound
                          size={36}
                          className="text-[#087f5b]"
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <input
                        id="driver-edit-profile-photo"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleProfilePhotoChange}
                        className="hidden"
                      />

                      <label
                        htmlFor="driver-edit-profile-photo"
                        className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-[#e8ece9] bg-white px-4 text-xs font-semibold text-[#454d49] transition-colors hover:bg-[#f5f8f6]"
                      >
                        <ImagePlus size={16} />
                        {selectedPhoto
                          ? 'Choose another photo'
                          : 'Upload photo'}
                      </label>

                      <p className="mt-2 text-xs leading-5 text-[#818a85]">
                        JPG, PNG or WebP. Maximum 5 MB.
                      </p>

                      {selectedPhoto && (
                        <p className="mt-2 break-all text-xs font-medium text-[#087f5b]">
                          {selectedPhoto.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* FULL NAME */}

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

                {/* VEHICLE CATEGORY */}

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

                {/* VEHICLE MODEL */}

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

                {/* VEHICLE REGISTRATION */}

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

                {/* REGISTERED PHONE */}

                <div className="rounded-xl border border-[#e8ece9] bg-[#fafbfa] p-4">
                  <p className="text-xs font-semibold text-[#454d49]">
                    Registered mobile number
                  </p>

                  <p className="mt-2 text-sm font-medium text-[#454d49]">
                    {driver.phone}
                  </p>

                  <p className="mt-1 text-xs text-[#818a85]">
                    Contact number cannot be changed here.
                  </p>
                </div>

                {/* SAVE AND CANCEL */}

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

        {/* FOOTER */}

        <footer className="mt-10 flex flex-col gap-3 border-t border-[#e8ece9] pt-6 sm:flex-row sm:items-center sm:justify-between">
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

export default DriverDashboard
