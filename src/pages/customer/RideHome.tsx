
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Bike,
  CarFront,
  Check,
  ChevronRight,
  Clock3,
  LocateFixed,
  MapPin,
  Phone,
  ShieldCheck,
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
    detail: 'For everyday travel',
    icon: CarFront,
  },
  {
    id: 'taxi' as const,
    name: 'Taxi',
    detail: 'For comfortable rides',
    icon: CarFront,
  },
  {
    id: 'bike' as const,
    name: 'Bike',
    detail: 'For quicker journeys',
    icon: Bike,
  },
]

const benefits = [
  {
    icon: Phone,
    title: 'Talk directly',
    description: 'Connect with drivers yourself. No middleman.',
  },
  {
    icon: MapPin,
    title: 'Find what is nearby',
    description: 'Discover local drivers around you.',
  },
  {
    icon: ShieldCheck,
    title: 'No commission',
    description: 'No platform commission taken from your ride.',
  },
]

const howItWorksSteps = [
  {
    number: '01',
    icon: LocateFixed,
    title: 'Choose your ride',
    description:
      'Select an auto, taxi or bike based on what you need.',
  },
  {
    number: '02',
    icon: MapPin,
    title: 'Find nearby drivers',
    description:
      'See available drivers around you, arranged by distance.',
  },
  {
    number: '03',
    icon: Phone,
    title: 'Call and confirm',
    description:
      'Contact your chosen driver directly and agree on the ride.',
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

  const [locationMessage, setLocationMessage] = useState(
    'Use your current location to discover nearby drivers.',
  )

  const [searchAfterLocation, setSearchAfterLocation] =
    useState(false)

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

    setSearchAfterLocation(continueToSearch)
    setLocationState('loading')
    setLocationMessage('Finding your current location...')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentLocation: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }

        setCoordinates(currentLocation)
        setLocationState('success')
        setLocationMessage('Your location is ready.')

        if (continueToSearch) {
          goToSearch(currentLocation)
        }

        setSearchAfterLocation(false)
      },

      (error) => {
        setLocationState('error')
        setSearchAfterLocation(false)

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
            'We could not detect your location. Please try again.',
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
     FIND RIDES ACTION
  ========================================= */

  const handleFindRides = () => {
    if (locationState === 'loading' || searchAfterLocation) {
      return
    }

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

      {/* =====================================
          NAVIGATION
      ====================================== */}

      <header className="sticky top-0 z-50 border-b border-[#e9eeeb] bg-white/95 backdrop-blur-xl">

        <div className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between px-5 sm:px-8">

          <Link
            to="/"
            aria-label="AbhiRide home"
            className="text-[26px] font-bold tracking-[-1.6px]"
          >
            abhi<span className="text-[#087f5b]">ride</span>
          </Link>

          <nav className="hidden items-center gap-9 md:flex">

            <a
              href="#how-it-works"
              className="text-[13px] font-medium text-[#626c66] transition-colors hover:text-[#087f5b]"
            >
              How it works
            </a>

            <a
              href="#why-abhiride"
              className="text-[13px] font-medium text-[#626c66] transition-colors hover:text-[#087f5b]"
            >
              Why AbhiRide
            </a>

          </nav>

          <Link
            to="/drivers"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#e4eae6] px-4 text-[13px] font-semibold text-[#202824] transition hover:border-[#087f5b] hover:text-[#087f5b]"
          >
            Drive with us
            <ArrowUpRight size={15} />
          </Link>

        </div>

      </header>

      {/* =====================================
          HERO
      ====================================== */}

      <section className="relative overflow-hidden">

        <div className="mx-auto grid max-w-[1240px] items-center gap-14 px-5 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-24 lg:grid-cols-[1fr_0.88fr] lg:gap-20">

          {/* Hero copy */}

          <div className="max-w-[590px]">

            <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-[#dcece3] bg-[#f4faf6] px-3.5 py-2">

              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#168653]" />
              </span>

              <span className="text-[10px] font-bold uppercase tracking-[1.7px] text-[#087f5b]">
                Local rides, made simple
              </span>

            </div>

            <h1 className="text-[49px] font-semibold leading-[1.07] tracking-[-2.8px] text-[#151a18] sm:text-[64px] lg:text-[72px]">
              Your ride.
              <br />
              Just around
              <br />
              <span className="text-[#087f5b]">
                the corner.
              </span>
            </h1>

            <p className="mt-7 max-w-[470px] text-[15px] leading-[1.9] text-[#727c76] sm:text-[17px]">
              Find nearby auto, taxi and bike drivers.
              Call directly, agree on your fare and get
              moving. No commission. No unnecessary steps.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">

              <div className="flex items-center gap-2 text-[12px] font-medium text-[#59645d]">
                <Check size={16} className="text-[#087f5b]" />
                Direct driver contact
              </div>

              <div className="flex items-center gap-2 text-[12px] font-medium text-[#59645d]">
                <Check size={16} className="text-[#087f5b]" />
                Zero commission
              </div>

            </div>

            <div className="mt-12 hidden items-center gap-4 border-t border-[#edf0ed] pt-7 sm:flex">

              <div className="flex -space-x-2">

                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#e8f5ef] text-[#087f5b]">
                  <CarFront size={16} />
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#f1f2ee] text-[#505a53]">
                  <Bike size={16} />
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#e9edf3] text-[#465c78]">
                  <Phone size={15} />
                </div>

              </div>

              <div>

                <p className="text-[12px] font-semibold text-[#303a34]">
                  Simple local connections
                </p>

                <p className="mt-0.5 text-[11px] text-[#89918c]">
                  Discover. Connect. Travel.
                </p>

              </div>

            </div>

          </div>

          {/* =====================================
              RIDE FINDER PANEL
          ====================================== */}

          <div className="w-full max-w-[490px] lg:ml-auto">

            <div className="rounded-[22px] border border-[#e7ece8] bg-white p-5 shadow-[0_18px_65px_rgba(20,35,27,0.065)] sm:p-7">

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-[10px] font-bold uppercase tracking-[1.6px] text-[#087f5b]">
                    Get started
                  </p>

                  <h2 className="mt-2 text-[23px] font-semibold tracking-[-0.9px]">
                    Find your ride
                  </h2>

                  <p className="mt-1 text-[13px] text-[#89918c]">
                    What are you travelling by?
                  </p>

                </div>

                <div className="rounded-xl bg-[#f0f8f3] p-3.5 text-[#087f5b]">
                  <LocateFixed size={21} strokeWidth={1.8} />
                </div>

              </div>

              {/* Vehicle selector */}

              <div className="mt-8">

                <div className="mb-3 flex items-center justify-between">

                  <label className="text-[12px] font-semibold text-[#414a45]">
                    Select vehicle
                  </label>

                  <span className="text-[11px] text-[#929a95]">
                    Choose one
                  </span>

                </div>

                <div className="grid grid-cols-3 gap-2.5">

                  {vehicles.map((vehicle) => {
                    const Icon = vehicle.icon

                    const isSelected =
                      selectedVehicle === vehicle.id

                    return (
                      <button
                        key={vehicle.id}
                        type="button"
                        onClick={() =>
                          setSelectedVehicle(vehicle.id)
                        }
                        aria-pressed={isSelected}
                        className={`group relative flex min-h-[116px] flex-col items-center justify-center gap-3 rounded-xl border p-3 transition-all duration-200 ${
                          isSelected
                            ? 'border-[#087f5b] bg-[#f0faf4] text-[#087f5b] shadow-[0_0_0_1px_rgba(8,127,91,0.08)]'
                            : 'border-[#e8ece9] bg-white text-[#4c5650] hover:border-[#b8d7c5] hover:bg-[#fafcfb]'
                        }`}
                      >

                        {isSelected && (
                          <span className="absolute right-2.5 top-2.5 flex h-[17px] w-[17px] items-center justify-center rounded-full bg-[#087f5b] text-white">
                            <Check size={11} strokeWidth={3} />
                          </span>
                        )}

                        <Icon
                          size={27}
                          strokeWidth={1.65}
                          className="transition-transform duration-200 group-hover:-translate-y-0.5"
                        />

                        <div className="text-center">

                          <span className="block text-[13px] font-semibold">
                            {vehicle.name}
                          </span>

                          <span className="mt-1 hidden text-[9px] text-[#8b958e] sm:block">
                            {vehicle.detail}
                          </span>

                        </div>

                      </button>
                    )
                  })}

                </div>

              </div>

              {/* Location selector */}

              <div className="mt-7">

                <label className="mb-3 block text-[12px] font-semibold text-[#414a45]">
                  Your location
                </label>

                <button
                  type="button"
                  onClick={() => requestLocation()}
                  disabled={locationState === 'loading'}
                  className="flex min-h-[64px] w-full items-center gap-3 rounded-xl border border-[#e6ebe7] bg-[#fcfdfc] px-4 text-left transition hover:border-[#b8d7c5] disabled:cursor-wait disabled:opacity-70"
                >

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f0f8f3] text-[#087f5b]">

                    {locationState === 'loading' ? (
                      <Clock3 size={19} className="animate-pulse" />
                    ) : locationState === 'success' ? (
                      <Check size={19} />
                    ) : (
                      <MapPin size={19} />
                    )}

                  </div>

                  <div className="min-w-0 flex-1">

                    <span className="block text-[13px] font-semibold text-[#29332d]">

                      {locationState === 'loading'
                        ? 'Detecting location'
                        : locationState === 'success'
                          ? 'Location detected'
                          : 'Use current location'}

                    </span>

                    <span className="mt-0.5 block truncate text-[11px] text-[#89918c]">
                      {locationMessage}
                    </span>

                  </div>

                  <LocateFixed
                    size={18}
                    className="shrink-0 text-[#087f5b]"
                  />

                </button>

                {locationState === 'error' && (
                  <button
                    type="button"
                    onClick={() => requestLocation()}
                    className="mt-2 text-[11px] font-semibold text-[#087f5b] hover:underline"
                  >
                    Try again
                  </button>
                )}

              </div>

              {/* Main action */}

              <button
                type="button"
                onClick={handleFindRides}
                disabled={locationState === 'loading'}
                className="mt-6 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-[#151a18] px-5 text-[14px] font-semibold text-white transition-all duration-200 hover:bg-[#087f5b] active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
              >

                {locationState === 'loading'
                  ? 'Finding your location...'
                  : `Find nearby ${selectedVehicle === 'auto' ? 'autos' : selectedVehicle === 'taxi' ? 'taxis' : 'bikes'}`}

                {locationState !== 'loading' && (
                  <ArrowRight size={17} />
                )}

              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-center text-[10px] text-[#8b948e]">
                <ShieldCheck size={13} className="text-[#087f5b]" />
                No booking fees. No platform commission.
              </div>

            </div>

            <p className="mt-4 text-center text-[11px] text-[#929a95]">
              Select your vehicle and discover local transport.
            </p>

          </div>

        </div>

      </section>

      {/* =====================================
          HOW IT WORKS
      ====================================== */}

      <section
        id="how-it-works"
        className="border-y border-[#edf0ed] bg-[#fafcfb] py-20"
      >

        <div className="mx-auto max-w-[1100px] px-5 sm:px-8">

          <div className="mx-auto max-w-[550px] text-center">

            <p className="text-[10px] font-bold uppercase tracking-[1.8px] text-[#087f5b]">
              Straightforward by design
            </p>

            <h2 className="mt-4 text-[32px] font-semibold tracking-[-1.4px] sm:text-[40px]">
              Three steps. That's it.
            </h2>

            <p className="mt-4 text-[14px] leading-7 text-[#7b857e]">
              Getting a local ride shouldn't be complicated.
              We keep the process simple.
            </p>

          </div>

          <div className="mt-14 grid gap-10 md:grid-cols-3">

            {howItWorksSteps.map((step) => {
              const Icon = step.icon

              return (
                <article
                  key={step.number}
                  className="relative"
                >

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#dcece3] bg-white text-[#087f5b]">
                    <Icon size={21} strokeWidth={1.7} />
                  </div>

                  <p className="mt-7 text-[10px] font-bold tracking-[1.5px] text-[#a0aaa3]">
                    STEP {step.number}
                  </p>

                  <h3 className="mt-2 text-[19px] font-semibold tracking-[-0.5px]">
                    {step.title}
                  </h3>

                  <p className="mt-3 max-w-[300px] text-[13px] leading-7 text-[#7b857e]">
                    {step.description}
                  </p>

                </article>
              )
            })}

          </div>

        </div>

      </section>

      {/* =====================================
          WHY ABHIRIDE
      ====================================== */}

      <section
        id="why-abhiride"
        className="mx-auto max-w-[1100px] px-5 py-20 sm:px-8 sm:py-24"
      >

        <div className="grid gap-12 md:grid-cols-[0.85fr_1.15fr] md:items-center">

          <div>

            <p className="text-[10px] font-bold uppercase tracking-[1.8px] text-[#087f5b]">
              A simpler way to connect
            </p>

            <h2 className="mt-4 text-[35px] font-semibold leading-tight tracking-[-1.7px] sm:text-[43px]">
              Less hassle.
              <br />
              More freedom.
            </h2>

            <p className="mt-5 max-w-[390px] text-[14px] leading-8 text-[#7b857e]">
              We believe finding local transport should be
              quick and straightforward. No complicated
              booking flows or unnecessary middlemen.
            </p>

          </div>

          <div className="grid gap-3 sm:grid-cols-3">

            {benefits.map((benefit) => {
              const Icon = benefit.icon

              return (
                <article
                  key={benefit.title}
                  className="rounded-xl border border-[#e8ece9] bg-white p-5 transition duration-200 hover:border-[#c7dfd0] hover:shadow-[0_8px_28px_rgba(20,35,27,0.05)]"
                >

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0f8f3] text-[#087f5b]">
                    <Icon size={19} strokeWidth={1.7} />
                  </div>

                  <h3 className="mt-5 text-[14px] font-semibold">
                    {benefit.title}
                  </h3>

                  <p className="mt-2 text-[11px] leading-6 text-[#858f88]">
                    {benefit.description}
                  </p>

                </article>
              )
            })}

          </div>

        </div>

      </section>

      {/* =====================================
          DRIVER SECTION
      ====================================== */}

      <section
        id="for-drivers"
        className="bg-[#f4faf6] py-16"
      >

        <div className="mx-auto flex max-w-[1100px] flex-col gap-7 px-5 sm:px-8 md:flex-row md:items-center md:justify-between">

          <div>

            <p className="text-[10px] font-bold uppercase tracking-[1.7px] text-[#087f5b]">
              For local drivers
            </p>

            <h2 className="mt-3 text-[27px] font-semibold tracking-[-1px] sm:text-[34px]">
              Your rides. Your earnings.
            </h2>

            <p className="mt-3 max-w-[490px] text-[13px] leading-7 text-[#737d76]">
              Make yourself visible to nearby customers.
              Connect directly and keep what you earn.
            </p>

          </div>

          <Link
            to="/drivers"
            className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-xl bg-[#087f5b] px-6 text-[13px] font-semibold text-white transition hover:bg-[#066b4d]"
          >
            Join as a driver
            <ChevronRight size={17} />
          </Link>

        </div>

      </section>

      {/* =====================================
          FOOTER
      ====================================== */}

      <footer className="border-t border-[#e9eeeb] bg-white">

        <div className="mx-auto max-w-[1100px] px-5 py-9 sm:px-8">

          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">

            <div>

              <Link
                to="/"
                className="text-[22px] font-bold tracking-[-1.3px]"
              >
                abhi<span className="text-[#087f5b]">ride</span>
              </Link>

              <p className="mt-2 text-[11px] text-[#929a95]">
                Find nearby. Call directly. Ride freely.
              </p>

            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-3 text-[11px] font-medium text-[#7b857e]">

              <a
                href="#how-it-works"
                className="transition hover:text-[#087f5b]"
              >
                How it works
              </a>

              <Link
                to="/drivers"
                className="transition hover:text-[#087f5b]"
              >
                Drive with us
              </Link>

            </div>

          </div>

          <div className="mt-8 border-t border-[#edf0ed] pt-5 text-[10px] text-[#a0a8a3]">
            © {new Date().getFullYear()} AbhiRide. All rights reserved.
          </div>

        </div>

      </footer>

    </main>
  )
}
