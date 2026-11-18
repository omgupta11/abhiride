import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  AlertCircle,
  Clock3,
  LocateFixed,
  List,
  Map,
  MapPin,
  Phone,
  RefreshCw,
  UserRound,
} from 'lucide-react'

import Logo from '../../components/common/Logo'
import VehicleSelector from '../../components/customer/VehicleSelector'
import LiveDriverMap from '../../components/customer/LiveDriverMap'
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
   SUPABASE MAP SEARCH RESULT
========================================= */

interface NearbyDriverRow {
  driver_id: string
  full_name: string
  phone: string
  vehicle_type: VehicleType
  vehicle_model: string
  vehicle_number: string
  profile_photo_url: string | null
  latitude: number
  longitude: number
  distance_meters: number
  last_location_update: string | null
}

/* =========================================
   DRIVER DATA
========================================= */

interface NearbyDriver {
  id: string
  fullName: string
  phone: string
  vehicleType: VehicleType
  vehicleModel: string
  vehicleNumber: string
  profilePhotoUrl: string | null
  latitude: number
  longitude: number
  distanceMeters: number
  lastLocationUpdate: string | null
}

/* =========================================
   VIEW TYPE
========================================= */

type ResultsView = 'map' | 'list'

/* =========================================
   CONSTANTS
========================================= */

const SEARCH_RADIUS_METERS = 5000

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
  if (!value) return 'Location time unavailable'

  const timestamp = new Date(value).getTime()

  if (!Number.isFinite(timestamp)) {
    return 'Location time unavailable'
  }

  const elapsed = Date.now() - timestamp

  if (elapsed < 0) return 'Recently updated'

  if (elapsed < 60000) return 'Updated just now'

  const minutes = Math.floor(elapsed / 60000)

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

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message

  return 'Something went wrong. Please try again.'
}

/* =========================================
   EMPTY RESULTS
========================================= */

interface EmptyResultsProps {
  searching: boolean
  hasLocation: boolean
  onRetry: () => void
}

const EmptyResults = ({
  searching,
  hasLocation,
  onRetry,
}: EmptyResultsProps) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#dce4de] bg-white px-6 py-14 text-center">

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0f8f3] text-[#087f5b]">
        <MapPin size={25} />
      </div>

      <h3 className="mt-5 text-lg font-semibold text-[#151a18]">
        {!hasLocation
          ? 'Location required'
          : searching
            ? 'Finding nearby drivers'
            : 'No nearby drivers'}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-[#818a85]">
        {!hasLocation
          ? 'Enable location access to find nearby drivers.'
          : searching
            ? 'Searching for available vehicles.'
            : 'No available drivers found nearby. Please try again.'}
      </p>

      {hasLocation && !searching && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#087f5b] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#066b4d]"
        >
          <RefreshCw size={15} />
          Search again
        </button>
      )}

      {!hasLocation && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#087f5b] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#066b4d]"
        >
          <LocateFixed size={15} />
          Use my location
        </button>
      )}

    </div>
  )
}

/* =========================================
   DRIVER CARD
========================================= */

const DriverCard = ({ driver }: { driver: NearbyDriver }) => {
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

            <p className="mt-2 text-sm font-medium text-[#454d49]">
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

          <span className="inline-flex items-center gap-1 text-xs text-[#68736d]">
            <Clock3 size={12} />
            {formatLastUpdate(driver.lastLocationUpdate)}
          </span>

        </div>

      </div>

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
   MAP / LIST TOGGLE
========================================= */

interface ViewToggleProps {
  view: ResultsView
  onChange: (view: ResultsView) => void
}

const ViewToggle = ({ view, onChange }: ViewToggleProps) => {
  return (
    <div
      className="inline-flex items-center rounded-xl border border-[#e8ece9] bg-white p-1"
      aria-label="Choose results view"
    >

      <button
        type="button"
        onClick={() => onChange('map')}
        aria-pressed={view === 'map'}
        className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-4 text-xs font-semibold transition-colors ${
          view === 'map'
            ? 'bg-[#087f5b] text-white shadow-sm'
            : 'text-[#68736d] hover:bg-[#f3faf6]'
        }`}
      >
        <Map size={15} />
        Map
      </button>

      <button
        type="button"
        onClick={() => onChange('list')}
        aria-pressed={view === 'list'}
        className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-4 text-xs font-semibold transition-colors ${
          view === 'list'
            ? 'bg-[#087f5b] text-white shadow-sm'
            : 'text-[#68736d] hover:bg-[#f3faf6]'
        }`}
      >
        <List size={15} />
        List
      </button>

    </div>
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

  const [searchVersion, setSearchVersion] = useState(0)

  const [resultsView, setResultsView] =
    useState<ResultsView>('map')

  const searchRequestId = useRef(0)

  /* =====================================
     DRIVER SEARCH
  ====================================== */

  const searchDrivers = useCallback(async () => {
    if (!customerLocation) {
      searchRequestId.current += 1
      setDrivers([])
      setSearching(false)
      return
    }

    const requestId = ++searchRequestId.current

    setSearching(true)
    setSearchError('')

    try {
      const { data, error } = await supabase.rpc(
        'search_nearby_drivers_for_map',
        {
          p_latitude: customerLocation.latitude,
          p_longitude: customerLocation.longitude,
          p_vehicle_type: selectedVehicle,
          p_radius_meters: SEARCH_RADIUS_METERS,
        },
      )

      if (error) throw error

      if (requestId !== searchRequestId.current) return

      const rows = (data ?? []) as NearbyDriverRow[]

      const validDrivers = rows
        .filter(
          (row) =>
            typeof row.driver_id === 'string' &&
            typeof row.full_name === 'string' &&
            typeof row.phone === 'string' &&
            typeof row.vehicle_model === 'string' &&
            typeof row.vehicle_number === 'string' &&
            Number.isFinite(Number(row.latitude)) &&
            Number.isFinite(Number(row.longitude)) &&
            Number.isFinite(Number(row.distance_meters)) &&
            Number(row.latitude) >= -90 &&
            Number(row.latitude) <= 90 &&
            Number(row.longitude) >= -180 &&
            Number(row.longitude) <= 180,
        )
        .map((row) => ({
          id: row.driver_id,
          fullName: row.full_name,
          phone: row.phone,
          vehicleType: row.vehicle_type,
          vehicleModel: row.vehicle_model,
          vehicleNumber: row.vehicle_number,
          profilePhotoUrl: row.profile_photo_url,
          latitude: Number(row.latitude),
          longitude: Number(row.longitude),
          distanceMeters: Number(row.distance_meters),
          lastLocationUpdate: row.last_location_update,
        }))

      setDrivers(validDrivers)

    } catch (error) {
      if (requestId !== searchRequestId.current) return

      setDrivers([])
      setSearchError(getErrorMessage(error))

    } finally {
      if (requestId === searchRequestId.current) {
        setSearching(false)
      }
    }
  }, [customerLocation, selectedVehicle])

  /* =====================================
     INITIAL SEARCH
  ====================================== */

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void searchDrivers()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [searchDrivers, searchVersion])

  /* =====================================
     AUTOMATIC DRIVER REFRESH
  ====================================== */

  useEffect(() => {
    if (!customerLocation) return

    const timer = window.setInterval(() => {
      void searchDrivers()
    }, DRIVER_SEARCH_REFRESH_MS)

    return () => window.clearInterval(timer)
  }, [customerLocation, searchDrivers])

  /* =====================================
     MANUAL CUSTOMER LOCATION UPDATE
  ====================================== */

  const refreshLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError(
        'Location services are not supported by this browser.',
      )
      return
    }

    setLocationRefreshing(true)
    setLocationError('')
    setSearchError('')

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
     AUTOMATIC CUSTOMER LOCATION UPDATE
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

  const handleViewChange = (view: ResultsView) => {
    setResultsView(view)
  }

  /* =====================================
     PAGE
  ====================================== */

  return (
    <div className="min-h-screen bg-[#fafbfa]">

      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-[#e8ece9] bg-white/95 backdrop-blur-xl">

        <div className="mx-auto flex h-[68px] max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">

          <Link to="/" aria-label="AbhiRide homepage">
            <Logo />
          </Link>

          <Link
            to="/"
            aria-label="Back to homepage"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#68736d] transition-colors hover:text-[#087f5b]"
          >
            <ArrowLeft size={16} />
            Back
          </Link>

        </div>

      </header>

      {/* MAIN CONTENT */}

      <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* VEHICLE SELECTION */}

        <section>
          <VehicleSelector
            selectedVehicle={selectedVehicle}
            onChange={handleVehicleChange}
          />
        </section>

        {/* LOCATION / SEARCH ERROR */}

        {locationError && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-3 rounded-xl border border-[#f2dddd] bg-[#fff8f8] p-3"
          >
            <AlertCircle
              size={17}
              className="mt-0.5 shrink-0 text-[#c24141]"
            />

            <div className="flex-1">
              <p className="text-xs leading-5 text-[#c24141]">
                {locationError}
              </p>

              <button
                type="button"
                onClick={refreshLocation}
                disabled={locationRefreshing}
                className="mt-2 text-xs font-semibold text-[#087f5b]"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* RESULTS HEADING */}

        <section className="mt-7">

          <div className="flex flex-wrap items-center justify-between gap-3">

            <div>
              <h1 className="text-xl font-semibold tracking-tight text-[#151a18] sm:text-2xl">
                Nearby {vehicleLabels[selectedVehicle].toLowerCase()}
              </h1>

              <p className="mt-1 text-xs text-[#818a85]">
                {drivers.length} driver{drivers.length === 1 ? '' : 's'} found
              </p>
            </div>

            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={refreshLocation}
                disabled={locationRefreshing}
                aria-label="Update my location"
                title="Update my location"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e8ece9] bg-white text-[#087f5b] transition-colors hover:bg-[#f3faf6] disabled:opacity-50"
              >
                <LocateFixed
                  size={17}
                  className={locationRefreshing ? 'animate-pulse' : ''}
                />
              </button>

              <ViewToggle
                view={resultsView}
                onChange={handleViewChange}
              />

            </div>

          </div>

        </section>

        {/* SEARCH ERROR */}

        {searchError && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-3 rounded-xl border border-[#f2dddd] bg-[#fff8f8] p-4"
          >
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0 text-[#c24141]"
            />

            <div className="flex-1">
              <p className="text-xs leading-5 text-[#c24141]">
                {searchError}
              </p>

              <button
                type="button"
                onClick={handleRetry}
                className="mt-2 text-xs font-semibold text-[#087f5b]"
              >
                Try again
              </button>
            </div>

          </div>
        )}

        {/* MAP VIEW */}

        {resultsView === 'map' && (
          <section className="mt-4">

            {customerLocation ? (
              <LiveDriverMap
                customerLocation={customerLocation}
                drivers={drivers}
              />
            ) : (
              <EmptyResults
                searching={locationRefreshing}
                hasLocation={false}
                onRetry={refreshLocation}
              />
            )}

          </section>
        )}

        {/* LIST VIEW */}

        {resultsView === 'list' && (
          <section className="mt-4">

            {drivers.length > 0 ? (
              <div className="grid gap-3">

                {drivers.map((driver) => (
                  <DriverCard
                    key={driver.id}
                    driver={driver}
                  />
                ))}

              </div>
            ) : (
              <EmptyResults
                searching={searching}
                hasLocation={Boolean(customerLocation)}
                onRetry={handleRetry}
              />
            )}

          </section>
        )}

      </main>

      {/* MINIMAL FOOTER */}

      <footer className="border-t border-[#e8ece9] bg-white">

        <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">

          <Logo size="small" />

          <div className="flex items-center gap-5 text-xs text-[#68736d]">

            <a
              href="mailto:contactabhiride@gmail.com"
              className="font-medium transition-colors hover:text-[#087f5b]"
            >
              Contact Us
            </a>

            <span className="text-[#a0a8a3]">
              © {new Date().getFullYear()} AbhiRide
            </span>

          </div>

        </div>

      </footer>

    </div>
  )
}

export default RideResults