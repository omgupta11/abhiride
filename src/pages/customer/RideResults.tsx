
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  Bike,
  CarFront,
  CheckCircle2,
  Clock3,
  LocateFixed,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  AlertCircle,
} from 'lucide-react'

import Logo from '../../components/common/Logo'
import VehicleSelector from '../../components/customer/VehicleSelector'
import { supabase } from '../../lib/supabase'

import type {
  CustomerLocation,
  VehicleType,
} from '../../types/driver'

/* =========================================
   ROUTE STATE
========================================= */

interface RideResultsLocationState {
  vehicleType?: VehicleType
  customerLocation?: CustomerLocation
  coordinates?: CustomerLocation
}

/* =========================================
   SUPABASE SEARCH RESULT
========================================= */

interface NearbyDriverRow {
  driver_id: string
  full_name: string
  phone: string
  vehicle_type: VehicleType
  vehicle_model: string
  vehicle_number: string
  profile_photo_url: string | null
  distance_meters: number
  last_location_update: string | null
}

interface NearbyDriver {
  id: string
  fullName: string
  phone: string
  vehicleType: VehicleType
  vehicleModel: string
  vehicleNumber: string
  profilePhotoUrl: string | null
  distanceMeters: number
  lastLocationUpdate: string | null
}

/* =========================================
   CONSTANTS
========================================= */

const SEARCH_RADIUS_METERS = 5000
const LOCATION_STALE_AFTER_MS = 2 * 60 * 1000
const CUSTOMER_LOCATION_REFRESH_MS = 15000
const DRIVER_SEARCH_REFRESH_MS = 15000

const vehicleLabels: Record<VehicleType, string> = {
  auto: 'Autos',
  taxi: 'Taxis',
  bike: 'Bikes',
}

/* =========================================
   HELPERS
========================================= */

const formatDistance = (meters: number): string => {
  if (!Number.isFinite(meters) || meters < 0) {
    return 'Distance unavailable'
  }

  if (meters < 1000) {
    return `${Math.round(meters)} m away`
  }

  return `${(meters / 1000).toFixed(1)} km away`
}

const formatLastUpdate = (value: string | null): string => {
  if (!value) return 'Location update time unavailable'

  const timestamp = new Date(value).getTime()

  if (!Number.isFinite(timestamp)) {
    return 'Location update time unavailable'
  }

  const elapsed = Date.now() - timestamp

  if (elapsed < 0) return 'Recently updated'

  if (elapsed < 60_000) return 'Updated just now'

  const minutes = Math.floor(elapsed / 60_000)

  if (minutes < 60) {
    return `Updated ${minutes} minute${minutes === 1 ? '' : 's'} ago`
  }

  const hours = Math.floor(minutes / 60)

  if (hours < 24) {
    return `Updated ${hours} hour${hours === 1 ? '' : 's'} ago`
  }

  const days = Math.floor(hours / 24)

  return `Updated ${days} day${days === 1 ? '' : 's'} ago`
}

const isLocationStale = (value: string | null): boolean => {
  if (!value) return true

  const timestamp = new Date(value).getTime()

  if (!Number.isFinite(timestamp)) return true

  return Date.now() - timestamp > LOCATION_STALE_AFTER_MS
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message

  return 'Something went wrong while searching for nearby drivers.'
}

/* =========================================
   EMPTY RESULTS
========================================= */

interface EmptyResultsProps {
  vehicleType: VehicleType
  searching: boolean
  hasLocation: boolean
  onRetry: () => void
}

const EmptyResults = ({
  vehicleType,
  searching,
  hasLocation,
  onRetry,
}: EmptyResultsProps) => {
  const Icon = vehicleType === 'bike' ? Bike : CarFront

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#dce4de] bg-white px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f0f8f3] text-[#087f5b]">
        <Icon size={29} strokeWidth={1.7} />
      </div>

      <h3 className="mt-5 text-lg font-semibold text-[#151a18]">
        {!hasLocation
          ? 'Your location is needed'
          : searching
            ? 'Finding nearby drivers'
            : 'No nearby drivers found'}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-[#818a85]">
        {!hasLocation
          ? 'Allow location access to search for genuine nearby drivers.'
          : searching
            ? 'Checking the live driver database for available vehicles.'
            : `No LIVE ${vehicleLabels[vehicleType].toLowerCase()} were found within the search radius. Try refreshing your location or searching again later.`}
      </p>

      {hasLocation && !searching && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#087f5b] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#066b4d]"
        >
          <RefreshCw size={15} />
          Search again
        </button>
      )}
    </div>
  )
}

/* =========================================
   DRIVER CARD
========================================= */

const DriverCard = ({ driver }: { driver: NearbyDriver }) => {
  const stale = isLocationStale(driver.lastLocationUpdate)

  return (
    <article className="rounded-2xl border border-[#e8ece9] bg-white p-5 shadow-[0_2px_12px_rgba(20,35,27,0.025)] sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#f0f8f3] text-[#087f5b]">
            {driver.profilePhotoUrl ? (
              <img
                src={driver.profilePhotoUrl}
                alt={`${driver.fullName}'s profile`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <UserRound size={25} />
            )}
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-[#151a18]">
              {driver.fullName}
            </h3>

            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#087f5b]">
                <ShieldCheck size={13} />
                Registered driver
              </span>

              <span className="h-1 w-1 rounded-full bg-[#b7c0ba]" />

              <span className="text-xs text-[#68736d]">
                LIVE
              </span>
            </div>

            <p className="mt-3 text-sm font-medium text-[#454d49]">
              {driver.vehicleModel}
            </p>

            <p className="mt-1 text-xs tracking-wide text-[#818a85]">
              {driver.vehicleNumber}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0f8f3] px-3 py-1.5 text-xs font-semibold text-[#087f5b]">
            <MapPin size={13} />
            {formatDistance(driver.distanceMeters)}
          </span>

          <span
            className={`inline-flex items-center gap-1 text-xs ${
              stale ? 'text-[#b7791f]' : 'text-[#68736d]'
            }`}
          >
            <Clock3 size={12} />
            {formatLastUpdate(driver.lastLocationUpdate)}
          </span>
        </div>
      </div>

      {stale && (
        <div className="mt-4 rounded-xl border border-[#eee5d3] bg-[#fffcf5] px-3 py-2.5">
          <p className="text-xs leading-5 text-[#806b43]">
            This driver's last GPS update is older than two minutes.
            Their LIVE status is manually controlled, so their current
            position may have changed.
          </p>
        </div>
      )}

      <div className="mt-5 border-t border-[#edf0ed] pt-4">
        <a
          href={`tel:${driver.phone}`}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#087f5b] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#066b4d]"
        >
          <Phone size={16} />
          Call driver
        </a>
      </div>
    </article>
  )
}

/* =========================================
   RESULTS PAGE
========================================= */

const RideResults = () => {
  const location = useLocation()

  const routeState =
    location.state as RideResultsLocationState | null

  const initialLocation =
    routeState?.customerLocation ??
    routeState?.coordinates ??
    null

  /* =====================================
     PAGE STATE
  ====================================== */

  const [selectedVehicle, setSelectedVehicle] =
    useState<VehicleType>(routeState?.vehicleType ?? 'auto')

  const [customerLocation, setCustomerLocation] =
    useState<CustomerLocation | null>(initialLocation)

  const [drivers, setDrivers] = useState<NearbyDriver[]>([])

  const [searching, setSearching] = useState(false)

  const [locationRefreshing, setLocationRefreshing] =
    useState(false)

  const [locationError, setLocationError] = useState('')

  const [searchError, setSearchError] = useState('')

  const [locationPermissionDenied, setLocationPermissionDenied] =
    useState(false)

  const [searchVersion, setSearchVersion] = useState(0)

  const searchInProgress = useRef(false)

  /* =====================================
     REAL DRIVER SEARCH
  ====================================== */

  const searchDrivers = useCallback(async () => {
    if (!customerLocation) {
      setDrivers([])
      return
    }

    if (searchInProgress.current) return

    searchInProgress.current = true
    setSearching(true)
    setSearchError('')

    try {
      const { data, error } = await supabase.rpc(
        'search_nearby_drivers',
        {
          p_latitude: customerLocation.latitude,
          p_longitude: customerLocation.longitude,
          p_vehicle_type: selectedVehicle,
          p_radius_meters: SEARCH_RADIUS_METERS,
        },
      )

      if (error) throw error

      const rows = (data ?? []) as NearbyDriverRow[]

      const validDrivers = rows
        .filter(
          (row) =>
            typeof row.driver_id === 'string' &&
            typeof row.full_name === 'string' &&
            typeof row.phone === 'string' &&
            typeof row.vehicle_model === 'string' &&
            typeof row.vehicle_number === 'string' &&
            Number.isFinite(Number(row.distance_meters)),
        )
        .map((row) => ({
          id: row.driver_id,
          fullName: row.full_name,
          phone: row.phone,
          vehicleType: row.vehicle_type,
          vehicleModel: row.vehicle_model,
          vehicleNumber: row.vehicle_number,
          profilePhotoUrl: row.profile_photo_url,
          distanceMeters: Number(row.distance_meters),
          lastLocationUpdate: row.last_location_update,
        }))

      setDrivers(validDrivers)
    } catch (error) {
      setSearchError(getErrorMessage(error))
    } finally {
      searchInProgress.current = false
      setSearching(false)
    }
  }, [customerLocation, selectedVehicle])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void searchDrivers()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [searchDrivers, searchVersion])

  /* =====================================
     AUTOMATIC DRIVER SEARCH REFRESH
  ====================================== */

  useEffect(() => {
    if (!customerLocation) return

    const timer = window.setInterval(() => {
      void searchDrivers()
    }, DRIVER_SEARCH_REFRESH_MS)

    return () => window.clearInterval(timer)
  }, [customerLocation, searchDrivers])

  /* =====================================
     CUSTOMER LOCATION
  ====================================== */

  const refreshLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError(
        'Your browser does not support location services.',
      )
      return
    }

    setLocationRefreshing(true)
    setLocationError('')
    setSearchError('')
    setLocationPermissionDenied(false)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCustomerLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        })

        setLocationRefreshing(false)
      },
      (error) => {
        let message =
          'Unable to retrieve your location. Please try again.'

        if (error.code === error.PERMISSION_DENIED) {
          message =
            'Location permission was denied. Enable it in your browser settings.'

          setLocationPermissionDenied(true)
        }

        if (error.code === error.POSITION_UNAVAILABLE) {
          message =
            'Your current location is unavailable. Please try again.'
        }

        if (error.code === error.TIMEOUT) {
          message =
            'Location request timed out. Please try again.'
        }

        setLocationError(message)
        setLocationRefreshing(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    )
  }, [])

  /* =====================================
     AUTOMATIC CUSTOMER LOCATION REFRESH
  ====================================== */

  useEffect(() => {
    if (!customerLocation) return

    if (!navigator.geolocation) return

    const timer = window.setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCustomerLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          })

          setLocationError('')
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setLocationPermissionDenied(true)
            setLocationError(
              'Location permission was denied. Enable it in your browser settings.',
            )
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000,
        },
      )
    }, CUSTOMER_LOCATION_REFRESH_MS)

    return () => window.clearInterval(timer)
  }, [Boolean(customerLocation)])

  /* =====================================
     PAGE ACTIONS
  ====================================== */

  const handleVehicleChange = (vehicle: VehicleType) => {
    setSelectedVehicle(vehicle)
  }

  const handleRetry = () => {
    setSearchVersion((previous) => previous + 1)
  }

  /* =====================================
     PAGE CONTENT
  ====================================== */

  return (
    <div className="min-h-screen bg-[#fafbfa]">
      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-[#e8ece9] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="AbhiRide homepage">
            <Logo />
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#68736d] transition-colors hover:text-[#087f5b]"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to search</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>
      </header>

      {/* MAIN CONTENT */}

      <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* PAGE HEADING */}

        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#087f5b]">
              NEARBY RIDES
            </p>

            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#151a18] sm:text-3xl">
              Find your ride
            </h1>

            <p className="mt-2 text-sm leading-6 text-[#818a85]">
              Discover nearby drivers and contact them directly.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 self-start rounded-full border border-[#e8ece9] bg-white px-3 py-2 sm:self-auto">
            <span
              className={`h-2 w-2 rounded-full ${
                searching ? 'animate-pulse bg-[#b7791f]' : 'bg-[#087f5b]'
              }`}
            />

            <span className="text-xs font-medium text-[#454d49]">
              {searching ? 'Searching live drivers' : 'Live search connected'}
            </span>
          </div>
        </section>

        {/* CUSTOMER LOCATION */}

        <section className="mt-7 rounded-2xl border border-[#e8ece9] bg-white p-4 shadow-[0_2px_12px_rgba(20,35,27,0.025)] sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0f8f3] text-[#087f5b]">
                <MapPin size={20} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-[#151a18]">
                  Your current location
                </h2>

                <p className="mt-1 text-xs leading-5 text-[#818a85]">
                  {customerLocation
                    ? 'Your device location is being refreshed automatically.'
                    : 'Allow location access to find nearby drivers.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={refreshLocation}
              disabled={locationRefreshing}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#e8ece9] bg-white px-4 text-xs font-semibold text-[#087f5b] transition-colors hover:bg-[#f3faf6] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LocateFixed
                size={15}
                className={locationRefreshing ? 'animate-pulse' : ''}
              />

              {locationRefreshing
                ? 'Locating...'
                : customerLocation
                  ? 'Refresh location'
                  : 'Use my location'}
            </button>
          </div>

          {locationError && (
            <div
              role="alert"
              className="mt-3 rounded-xl border border-[#f2dddd] bg-[#fff8f8] p-3"
            >
              <p className="text-xs leading-5 text-[#c24141]">
                {locationError}
              </p>

              {locationPermissionDenied && (
                <p className="mt-1 text-xs leading-5 text-[#818a85]">
                  You can change location permissions through your browser's site settings.
                </p>
              )}
            </div>
          )}

          {customerLocation && (
            <div className="mt-3 flex items-center gap-2 border-t border-[#e8ece9] pt-3">
              <CheckCircle2
                size={14}
                className="shrink-0 text-[#087f5b]"
              />

              <p className="text-xs text-[#68736d]">
                Location available. Your precise coordinates are not displayed publicly.
              </p>
            </div>
          )}
        </section>

        {/* VEHICLE SELECTION */}

        <section className="mt-8">
          <VehicleSelector
            selectedVehicle={selectedVehicle}
            onChange={handleVehicleChange}
          />
        </section>

        {/* RESULTS HEADING */}

        <section className="mt-9">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#151a18]">
                Nearby {vehicleLabels[selectedVehicle].toLowerCase()}
              </h2>

              <p className="mt-1 text-xs leading-5 text-[#818a85]">
                LIVE drivers within {SEARCH_RADIUS_METERS / 1000} km, sorted by distance.
              </p>
            </div>

            <div className="inline-flex min-h-9 items-center gap-2 self-start rounded-xl border border-[#e8ece9] bg-white px-3">
              <Clock3 size={14} className="text-[#818a85]" />

              <span className="text-xs font-medium text-[#68736d]">
                {searching
                  ? 'Updating results'
                  : `${drivers.length} driver${drivers.length === 1 ? '' : 's'} found`}
              </span>
            </div>
          </div>
        </section>

        {/* SEARCH ERROR */}

        {searchError && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-3 rounded-xl border border-[#f2dddd] bg-[#fff8f8] p-4"
          >
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0 text-[#c24141]"
            />

            <div>
              <h3 className="text-sm font-semibold text-[#a83232]">
                Driver search failed
              </h3>

              <p className="mt-1 text-xs leading-5 text-[#c24141]">
                {searchError}
              </p>

              <button
                type="button"
                onClick={handleRetry}
                className="mt-3 text-xs font-semibold text-[#087f5b]"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* LIVE DRIVER LIST */}

        <section className="mt-5">
          {drivers.length > 0 ? (
            <div className="grid gap-4">
              {drivers.map((driver) => (
                <DriverCard key={driver.id} driver={driver} />
              ))}
            </div>
          ) : (
            <EmptyResults
              vehicleType={selectedVehicle}
              searching={searching}
              hasLocation={Boolean(customerLocation)}
              onRetry={handleRetry}
            />
          )}
        </section>

        {/* PRIVACY INFORMATION */}

        <section className="mt-12 rounded-2xl border border-[#e8ece9] bg-white p-6 sm:p-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0f8f3] text-[#087f5b]">
              <ShieldCheck size={21} />
            </div>

            <h2 className="mt-4 text-lg font-semibold tracking-tight text-[#151a18]">
              Your location. Your privacy.
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#68736d]">
              Your precise customer location is used to find nearby drivers.
              It is not displayed publicly or permanently stored just because
              you search for a ride.
            </p>
          </div>
        </section>

        {/* HOW ABHIRIDE WORKS */}

        <section className="mt-8 rounded-2xl bg-[#f0f8f3] p-6 sm:p-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#087f5b]">
              <Search size={21} />
            </div>

            <h2 className="mt-4 text-lg font-semibold tracking-tight text-[#151a18]">
              Simple local ride discovery
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#68736d]">
              Choose your vehicle category, discover nearby available drivers,
              contact them directly and agree on your fare together.
              No in-app booking and no platform commission.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <div className="rounded-xl border border-[#dce9df] bg-white px-4 py-2.5 text-xs font-medium text-[#454d49]">
                No customer account
              </div>

              <div className="rounded-xl border border-[#dce9df] bg-white px-4 py-2.5 text-xs font-medium text-[#454d49]">
                Direct driver contact
              </div>

              <div className="rounded-xl border border-[#dce9df] bg-white px-4 py-2.5 text-xs font-medium text-[#454d49]">
                Zero commission
              </div>
            </div>
          </div>
        </section>

        {/* BACK TO HOME */}

        <section className="mt-8 flex flex-col items-center justify-center gap-3 py-4 text-center">
          <p className="text-sm text-[#818a85]">
            Want to explore AbhiRide?
          </p>

          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#e8ece9] bg-white px-5 text-sm font-semibold text-[#087f5b] transition-colors hover:bg-[#f3faf6]"
          >
            <ArrowLeft size={15} />
            Return to homepage
          </Link>
        </section>
      </main>

      {/* FOOTER */}

      <footer className="border-t border-[#e8ece9] bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <Logo size="small" />

          <p className="text-xs text-[#818a85]">
            © {new Date().getFullYear()} AbhiRide. All rights reserved.
          </p>

          <Link
            to="/"
            className="text-xs font-semibold text-[#087f5b] hover:text-[#066b4d]"
          >
            Back to homepage
          </Link>
        </div>
      </footer>
    </div>
  )
}

export default RideResults
