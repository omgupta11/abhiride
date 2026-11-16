
import {
  Activity,
  CheckCircle2,
  Clock3,
  Power,
  Radio,
  Wifi,
} from 'lucide-react'

/* =========================================
   TYPES
========================================= */

interface AvailabilityToggleProps {
  isLive: boolean
  onToggle: (isLive: boolean) => void
  disabled?: boolean
  lastLocationUpdate?: string | null
  locationPermissionGranted?: boolean
  isUpdating?: boolean
}

/* =========================================
   HELPER FUNCTIONS
========================================= */

const formatLastUpdate = (
  timestamp: string | null | undefined,
): string => {
  if (!timestamp) {
    return 'Location has not been updated yet'
  }

  const updateTime = new Date(timestamp).getTime()

  if (Number.isNaN(updateTime)) {
    return 'Location update time unavailable'
  }

  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - updateTime) / 1000),
  )

  if (elapsedSeconds < 60) {
    return 'Updated just now'
  }

  const minutes = Math.floor(elapsedSeconds / 60)

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

/* =========================================
   AVAILABILITY COMPONENT
========================================= */

const AvailabilityToggle = ({
  isLive,
  onToggle,
  disabled = false,
  lastLocationUpdate = null,
  locationPermissionGranted = false,
  isUpdating = false,
}: AvailabilityToggleProps) => {
  const handleToggle = () => {
    if (disabled || isUpdating) {
      return
    }

    // Availability changes only through the driver's manual action.
    // No automatic OFFLINE action is performed.
    onToggle(!isLive)
  }

  const hasLocationUpdate = Boolean(lastLocationUpdate)

  return (
    <section
      className="w-full overflow-hidden rounded-2xl border border-[#e8ece9] bg-white shadow-[0_2px_12px_rgba(20,35,27,0.035)]"
      aria-label="Driver availability settings"
    >
      {/* HEADER */}

      <div className="flex items-center justify-between border-b border-[#edf0ed] px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-[#151a18]">
            Availability
          </h2>

          <p className="mt-1 text-xs text-[#818a85]">
            Manage your visibility to nearby customers
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
            isLive
              ? 'bg-[#e8f5ef] text-[#087f5b]'
              : 'bg-[#f1f3f1] text-[#68736d]'
          }`}
          aria-live="polite"
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isLive ? 'bg-[#16a36a]' : 'bg-[#9aa39d]'
            }`}
          />

          {isLive ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>

      {/* MAIN STATUS AREA */}

      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          {/* STATUS INFORMATION */}

          <div className="flex items-start gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                isLive
                  ? 'bg-[#e8f5ef] text-[#087f5b]'
                  : 'bg-[#f2f4f2] text-[#818a85]'
              }`}
            >
              {isLive ? (
                <Radio size={26} strokeWidth={1.8} />
              ) : (
                <Power size={26} strokeWidth={1.8} />
              )}
            </div>

            <div className="min-w-0">
              <h3 className="text-lg font-semibold tracking-tight text-[#151a18]">
                {isLive
                  ? 'You are visible to customers'
                  : 'You are currently offline'}
              </h3>

              <p className="mt-1 max-w-md text-sm leading-6 text-[#68736d]">
                {isLive
                  ? 'Customers can discover your driver profile and contact you directly.'
                  : 'Your profile is hidden from customer search results. Switch LIVE when you are ready to receive enquiries.'}
              </p>
            </div>
          </div>

          {/* MANUAL AVAILABILITY CONTROL */}

          <button
            type="button"
            onClick={handleToggle}
            disabled={disabled || isUpdating}
            aria-pressed={isLive}
            aria-label={
              isLive
                ? 'Switch availability offline'
                : 'Switch availability live'
            }
            className={`inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
              isLive
                ? 'bg-[#d94848] hover:bg-[#bd3838]'
                : 'bg-[#087f5b] hover:bg-[#066b4d]'
            }`}
          >
            {isUpdating ? (
              <Activity size={17} className="animate-pulse" />
            ) : (
              <Power size={17} />
            )}

            {isUpdating
              ? 'Updating...'
              : isLive
                ? 'Go Offline'
                : 'Go Live'}
          </button>

        </div>

        {/* LOCATION INFORMATION */}

        <div className="mt-6 rounded-xl border border-[#edf0ed] bg-[#fafbfa] p-4">
          <div className="flex items-start gap-3">

            <div className="mt-0.5 text-[#818a85]">
              <Wifi size={18} />
            </div>

            <div className="min-w-0 flex-1">

              <h4 className="text-sm font-semibold text-[#151a18]">
                Location information
              </h4>

              <p className="mt-1 text-xs leading-5 text-[#818a85]">
                {locationPermissionGranted
                  ? 'Location permission has been granted on this device.'
                  : 'Location permission has not been granted yet.'}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">

                <div className="flex items-center gap-1.5">

                  {hasLocationUpdate ? (
                    <CheckCircle2
                      size={14}
                      className="text-[#168653]"
                    />
                  ) : (
                    <Clock3
                      size={14}
                      className="text-[#b7791f]"
                    />
                  )}

                  <span className="text-xs text-[#454d49]">
                    {formatLastUpdate(lastLocationUpdate)}
                  </span>

                </div>

              </div>

            </div>
          </div>
        </div>

        {/* AVAILABILITY RULE */}

        <div className="mt-4 flex items-start gap-2.5">

          <CheckCircle2
            size={16}
            className="mt-0.5 shrink-0 text-[#168653]"
          />

          <p className="text-xs leading-5 text-[#68736d]">
            Your availability stays as you set it. Closing the website,
            being inactive or temporarily losing internet will not
            automatically switch you OFFLINE. Only you can change
            your availability manually.
          </p>

        </div>

      </div>
    </section>
  )
}

export default AvailabilityToggle
