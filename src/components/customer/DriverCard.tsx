
import {
  ArrowUpRight,
  CarFront,
  CheckCircle2,
  MapPin,
  Phone,
  ShieldCheck,
} from 'lucide-react'

import type { DriverSearchResult } from '../../types/driver'

/* =========================================
   COMPONENT PROPS
========================================= */

interface DriverCardProps {
  driver: DriverSearchResult
  onCall?: (driver: DriverSearchResult) => void
}

/* =========================================
   DISTANCE FORMATTER
========================================= */

const formatDistance = (distanceKm: number): string => {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) {
    return 'Distance unavailable'
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`
  }

  return `${distanceKm.toFixed(1)} km`
}

/* =========================================
   LOCATION TIMESTAMP FORMATTER
========================================= */

const formatLocationUpdate = (
  updatedAt: string | null,
): string => {
  if (!updatedAt) {
    return 'Location update unavailable'
  }

  const timestamp = new Date(updatedAt).getTime()

  if (!Number.isFinite(timestamp)) {
    return 'Update time unavailable'
  }

  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - timestamp) / 1000),
  )

  if (elapsedSeconds < 60) {
    return 'Updated just now'
  }

  const minutes = Math.floor(elapsedSeconds / 60)

  if (minutes < 60) {
    return `Updated ${minutes} min ago`
  }

  const hours = Math.floor(minutes / 60)

  if (hours < 24) {
    return `Updated ${hours} hr ago`
  }

  const days = Math.floor(hours / 24)

  return `Updated ${days} day${days === 1 ? '' : 's'} ago`
}

/* =========================================
   DRIVER CARD
========================================= */

const DriverCard = ({
  driver,
  onCall,
}: DriverCardProps) => {
  /* =====================================
     LOCATION STATUS
  ====================================== */

  const isFresh = driver.locationFreshness === 'fresh'

  const isStale = driver.locationFreshness === 'stale'

  const isLocationUnavailable =
    driver.locationFreshness === 'unavailable'

  /* =====================================
     AVAILABILITY STATUS
  ====================================== */

  const isAvailable = driver.isAvailable

  /* =====================================
     CONTACT STATUS
  ====================================== */

  const canContact =
    Boolean(onCall) &&
    isAvailable &&
    !isLocationUnavailable

  const handleCall = () => {
    if (!canContact || !onCall) return

    onCall(driver)
  }

  /* =====================================
     FORMATTED INFORMATION
  ====================================== */

  const distanceLabel = formatDistance(driver.distanceKm)

  const locationUpdateLabel = formatLocationUpdate(
    driver.lastLocationUpdate,
  )

  /* =====================================
     COMPONENT CONTENT
  ====================================== */

  return (
    <article className="group rounded-2xl border border-[#e8ece9] bg-white p-5 shadow-[0_2px_12px_rgba(20,35,27,0.035)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#c9ded2] hover:shadow-[0_10px_30px_rgba(20,35,27,0.07)] sm:p-6">

      {/* =====================================
          DRIVER INFORMATION
      ====================================== */}

      <div className="flex items-start gap-4">

        {/* Profile photo */}

        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#e8ece9] bg-[#f3faf6]">

          {driver.profilePhotoUrl ? (
            <img
              src={driver.profilePhotoUrl}
              alt={`${driver.fullName}'s profile`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="text-xl font-semibold text-[#087f5b]">
              {driver.fullName.charAt(0).toUpperCase()}
            </span>
          )}

        </div>

        {/* Driver details */}

        <div className="min-w-0 flex-1">

          <div className="flex flex-wrap items-center gap-2">

            <h3 className="truncate text-base font-semibold tracking-tight text-[#151a18]">
              {driver.fullName}
            </h3>

            {driver.phoneVerified && (
              <span
                title="Mobile number verified"
                className="inline-flex items-center gap-1 rounded-full bg-[#edf8f1] px-2 py-0.5 text-[10px] font-semibold text-[#168653]"
              >
                <CheckCircle2 size={12} />
                Phone verified
              </span>
            )}

          </div>

          <p className="mt-1 text-sm text-[#818a85]">
            {driver.vehicleModel}
          </p>

          <p className="mt-1 text-xs font-medium tracking-wide text-[#454d49]">
            {driver.vehicleNumber}
          </p>

          <span
            className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold ${
              isAvailable
                ? 'bg-[#edf8f1] text-[#168653]'
                : 'bg-[#f1f3f1] text-[#737d77]'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isAvailable ? 'bg-[#16a36a]' : 'bg-[#909a93]'
              }`}
            />
            {isAvailable ? 'LIVE' : 'OFFLINE'}
          </span>

        </div>

        {/* Vehicle icon */}

        <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f3faf6] text-[#087f5b] sm:flex">
          <CarFront size={21} strokeWidth={1.8} />
        </div>

      </div>

      {/* =====================================
          DISTANCE AND LOCATION INFORMATION
      ====================================== */}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#edf0ed] pt-4">

        {/* Distance */}

        <div className="flex items-center gap-2">

          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f3faf6] text-[#087f5b]">
            <MapPin size={16} />
          </div>

          <div>

            <p className="text-sm font-semibold text-[#151a18]">
              {distanceLabel === 'Distance unavailable'
                ? distanceLabel
                : `${distanceLabel} away`}
            </p>

            <p className="text-[11px] text-[#818a85]">
              Approximate distance
            </p>

          </div>

        </div>

        {/* Location freshness */}

        <div className="flex items-center gap-2">

          <span
            className={`h-2 w-2 shrink-0 rounded-full ${
              isFresh
                ? 'bg-[#16a36a]'
                : isStale
                  ? 'bg-[#d69a35]'
                  : 'bg-[#a0a8a3]'
            }`}
          />

          <div>

            <p className="text-xs font-medium text-[#454d49]">
              {isFresh
                ? 'Location updated'
                : isStale
                  ? 'Location may be outdated'
                  : 'Location unavailable'}
            </p>

            <p className="text-[11px] text-[#818a85]">
              {locationUpdateLabel}
            </p>

          </div>

        </div>

      </div>

      {/* =====================================
          LOCATION WARNING
      ====================================== */}

      {isStale && (
        <div className="mt-4 rounded-xl border border-[#f0e5cf] bg-[#fffcf5] px-3 py-2.5">
          <p className="text-xs leading-5 text-[#806b43]">
            This driver's last recorded location may not represent
            their current position. Confirm their location directly
            before travelling.
          </p>
        </div>
      )}

      {isLocationUnavailable && (
        <div className="mt-4 rounded-xl border border-[#e8ece9] bg-[#f7f9f7] px-3 py-2.5">
          <p className="text-xs leading-5 text-[#68736d]">
            Current location information is unavailable.
            Contact is disabled until reliable location information
            becomes available.
          </p>
        </div>
      )}

      {/* =====================================
          CONTACT AREA
      ====================================== */}

      <div className="mt-5 flex items-center justify-between gap-3">

        <div className="flex items-center gap-1.5 text-xs text-[#818a85]">
          <ShieldCheck
            size={15}
            className="text-[#168653]"
          />
          Direct contact
        </div>

        <button
          type="button"
          onClick={handleCall}
          disabled={!canContact}
          aria-label={`Contact ${driver.fullName}`}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#087f5b] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#066b4d] disabled:cursor-not-allowed disabled:bg-[#aab8b0]"
        >
          <Phone size={15} />

          {canContact ? 'Contact driver' : 'Contact unavailable'}

          {canContact && (
            <ArrowUpRight size={15} />
          )}
        </button>

      </div>

    </article>
  )
}

export default DriverCard
