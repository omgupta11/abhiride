import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Bike,
  CarFront,
  Check,
  LocateFixed,
  MapPin,
} from 'lucide-react'

type VehicleType = 'auto' | 'taxi' | 'bike'

type LocationState = 'idle' | 'loading' | 'success' | 'error'

interface Coordinates {
  latitude: number
  longitude: number
}

const vehicles = [
  {
    id: 'auto' as const,
    name: 'Auto',
    icon: CarFront,
  },
  {
    id: 'taxi' as const,
    name: 'Taxi',
    icon: CarFront,
  },
  {
    id: 'bike' as const,
    name: 'Bike',
    icon: Bike,
  },
]

export default function RideHome() {
  const navigate = useNavigate()

  const [selectedVehicle, setSelectedVehicle] =
    useState<VehicleType>('auto')

  const [locationState, setLocationState] =
    useState<LocationState>('idle')

  const [coordinates, setCoordinates] =
    useState<Coordinates | null>(null)

  const [locationMessage, setLocationMessage] =
    useState('')

  /* =========================================
     NAVIGATE TO DRIVER SEARCH
  ========================================= */

  const goToSearch = (location: Coordinates) => {
    navigate('/search', {
      state: {
        vehicleType: selectedVehicle,
        coordinates: location,
      },
    })
  }

  /* =========================================
     REQUEST CUSTOMER LOCATION
  ========================================= */

  const requestLocation = (continueToSearch = false) => {
    if (!navigator.geolocation) {
      setLocationState('error')
      setLocationMessage(
        'Location services are not supported by this browser.',
      )
      return
    }

    setLocationState('loading')
    setLocationMessage('')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentLocation: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }

        setCoordinates(currentLocation)
        setLocationState('success')
        setLocationMessage('Location permission was denied. Please enable it in your browser settings.')

        if (continueToSearch) {
          goToSearch(currentLocation)
        }

      },
      (error) => {
        setLocationState('error')

        if (error.code === error.PERMISSION_DENIED) {
          setLocationMessage(
            'Location permission was denied. Enable it in your browser settings.',
          )
        } else if (error.code === error.TIMEOUT) {
          setLocationMessage(
            'Location request timed out. Please try again.',
          )
        } else {
          setLocationMessage(
            'Unable to detect your location. Please try again.',
          )
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    )
  }

  /* =========================================
     FIND RIDES
  ========================================= */

  const handleFindRides = () => {
    if (locationState === 'loading') return

    if (coordinates) {
      goToSearch(coordinates)
      return
    }

    requestLocation(true)
  }

  /* =========================================
     PAGE
  ========================================= */

  return (
    <main className="min-h-screen bg-white text-[#151a18]">

      {/* NAVIGATION */}

      <header className="sticky top-0 z-50 border-b border-[#e9eeeb] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-5 sm:px-8">

          <Link
            to="/"
            aria-label="AbhiRide home"
            className="text-[26px] font-bold tracking-[-1.6px]"
          >
            abhi<span className="text-[#087f5b]">ride</span>
          </Link>

          <Link
            to="/drivers"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#e4eae6] px-4 text-[13px] font-semibold text-[#202824] transition hover:border-[#087f5b] hover:text-[#087f5b]"
          >
            Drive with us
            <ArrowUpRight size={15} />
          </Link>

        </div>
      </header>

      {/* MAIN HERO */}

      <section className="relative overflow-hidden">

        <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 py-12 sm:px-8 sm:py-20 lg:grid-cols-[1fr_0.88fr] lg:gap-20">

          {/* HERO TEXT */}

          <div className="max-w-[590px]">

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#dcece3] bg-[#f4faf6] px-3.5 py-2">

              <span className="h-2 w-2 rounded-full bg-[#168653]" />

              <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#087f5b]">
                Local rides, made simple
              </span>

            </div>

            <h1 className="text-[46px] font-semibold leading-[1.08] tracking-[-2.5px] text-[#151a18] sm:text-[62px] lg:text-[70px]">
              Your ride.
              <br />
              Just around
              <br />
              <span className="text-[#087f5b]">
                the corner.
              </span>
            </h1>

            <p className="mt-6 max-w-[465px] text-[15px] leading-[1.8] text-[#727c76] sm:text-[17px]">
              Find nearby autos, taxis and bikes. Call drivers directly,
              agree on your fare and get moving.
              No platform commission.
            </p>

          </div>

          {/* RIDE FINDER */}

          <div className="w-full max-w-[490px] lg:ml-auto">

            <div className="rounded-[22px] border border-[#e7ece8] bg-white p-5 shadow-[0_12px_45px_rgba(20,35,27,0.06)] sm:p-7">

              <div>

                <h2 className="text-[25px] font-semibold tracking-[-0.9px]">
                  Find a ride
                </h2>

                <p className="mt-1 text-[13px] text-[#89918c]">
                  Choose your vehicle
                </p>

              </div>

              {/* VEHICLE SELECTION */}

              <div className="mt-7 grid grid-cols-3 gap-3">

                {vehicles.map((vehicle) => {
                  const Icon = vehicle.icon

                  const isSelected =
                    selectedVehicle === vehicle.id

                  return (
                    <button
                      key={vehicle.id}
                      type="button"
                      onClick={() => setSelectedVehicle(vehicle.id)}
                      aria-pressed={isSelected}
                      className={`relative flex min-h-[105px] flex-col items-center justify-center gap-3 rounded-xl border p-3 transition-all ${
                        isSelected
                          ? 'border-[#087f5b] bg-[#f0faf4] text-[#087f5b]'
                          : 'border-[#e8ece9] bg-white text-[#4c5650] hover:border-[#b8d7c5] hover:bg-[#fafcfb]'
                      }`}
                    >

                      {isSelected && (
                        <span className="absolute right-2 top-2 flex h-[17px] w-[17px] items-center justify-center rounded-full bg-[#087f5b] text-white">
                          <Check size={11} strokeWidth={3} />
                        </span>
                      )}

                      <Icon size={29} strokeWidth={1.7} />

                      <span className="text-[13px] font-semibold">
                        {vehicle.name}
                      </span>

                    </button>
                  )
                })}

              </div>

              {/* CURRENT LOCATION */}

              <div className="mt-7">

                <button
                  type="button"
                  onClick={() => requestLocation()}
                  disabled={locationState === 'loading'}
                  className="flex min-h-[62px] w-full items-center gap-3 rounded-xl border border-[#e6ebe7] bg-[#fcfdfc] px-4 text-left transition hover:border-[#b8d7c5] disabled:cursor-wait disabled:opacity-70"
                >

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f0f8f3] text-[#087f5b]">

                    {locationState === 'loading' ? (
                      <LocateFixed size={19} className="animate-pulse" />
                    ) : locationState === 'success' ? (
                      <Check size={19} />
                    ) : (
                      <MapPin size={19} />
                    )}

                  </div>

                  <div className="min-w-0 flex-1">

                    <span className="block text-[13px] font-semibold text-[#29332d]">

                      {locationState === 'loading'
                        ? 'Detecting location...'
                        : locationState === 'success'
                          ? 'Location ready'
                          : 'Use current location'}

                    </span>

                    {locationState === 'error' && (
                      <span className="mt-1 block text-[11px] leading-5 text-red-600">
                        {locationMessage}
                      </span>
                    )}

                  </div>

                  <LocateFixed
                    size={18}
                    className="shrink-0 text-[#087f5b]"
                  />

                </button>

              </div>

              {/* FIND NEARBY */}

              <button
                type="button"
                onClick={handleFindRides}
                disabled={locationState === 'loading'}
                className="mt-5 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-[#151a18] px-5 text-[14px] font-semibold text-white transition hover:bg-[#087f5b] active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
              >

                {locationState === 'loading'
                  ? 'Finding location...'
                  : `Find nearby ${selectedVehicle === 'auto' ? 'autos' : selectedVehicle === 'taxi' ? 'taxis' : 'bikes'}`}

                {locationState !== 'loading' && (
                  <ArrowRight size={17} />
                )}

              </button>

            </div>

          </div>

        </div>

      </section>

      {/* FOOTER */}

      <footer className="border-t border-[#e9eeeb] bg-white">

        <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">

          <Link
            to="/"
            className="text-[21px] font-bold tracking-[-1.3px]"
          >
            abhi<span className="text-[#087f5b]">ride</span>
          </Link>

          <div className="flex flex-wrap items-center gap-5 text-[12px] font-medium text-[#68736d]">

            <Link
              to="/drivers"
              className="transition hover:text-[#087f5b]"
            >
              Drive with us
            </Link>

            <a
              href="mailto:contactabhiride@gmail.com"
              className="transition hover:text-[#087f5b]"
            >
              Contact Us
            </a>

          </div>

          <p className="text-[11px] text-[#929a95]">
            © {new Date().getFullYear()} AbhiRide
          </p>

        </div>

      </footer>

    </main>
  )
}