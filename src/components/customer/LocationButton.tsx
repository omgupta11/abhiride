
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  LocateFixed,
  MapPin,
  RefreshCw,
} from 'lucide-react'

import type { CustomerLocation } from '../../types/driver'

export type LocationStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'error'

interface LocationButtonProps {
  status: LocationStatus
  location: CustomerLocation | null
  errorMessage?: string
  onLocationSuccess: (location: CustomerLocation) => void
  onLocationError: (message: string) => void
  onStatusChange?: (status: LocationStatus) => void
  disabled?: boolean
}

const LocationButton = ({
  status,
  location,
  errorMessage,
  onLocationSuccess,
  onLocationError,
  onStatusChange,
  disabled = false,
}: LocationButtonProps) => {
  const requestLocation = () => {
    if (!navigator.geolocation) {
      onLocationError(
        'Your browser does not support location services.',
      )
      onStatusChange?.('error')
      return
    }

    onStatusChange?.('loading')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const customerLocation: CustomerLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }

        onLocationSuccess(customerLocation)
        onStatusChange?.('success')
      },
      (error) => {
        let message = 'Unable to access your location. Please try again.'

        switch (error.code) {
          case error.PERMISSION_DENIED:
            message =
              'Location permission was denied. Allow location access in your browser settings.'
            break

          case error.POSITION_UNAVAILABLE:
            message =
              'Your current location is unavailable. Please try again.'
            break

          case error.TIMEOUT:
            message =
              'Location request timed out. Please try again.'
            break
        }

        onLocationError(message)
        onStatusChange?.('error')
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    )
  }

  const isLoading = status === 'loading'
  const isSuccess = status === 'success'
  const isError = status === 'error'

  return (
    <div className="w-full">
      <div
        className={`flex min-h-[76px] items-center gap-3 rounded-2xl border p-4 transition-colors ${
          isSuccess
            ? 'border-[#cce8d7] bg-[#f3faf6]'
            : isError
              ? 'border-[#f0d5d5] bg-[#fff8f8]'
              : 'border-[#e8ece9] bg-white'
        }`}
      >
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            isSuccess
              ? 'bg-[#e2f3e9] text-[#168653]'
              : isError
                ? 'bg-[#fdeaea] text-[#d94848]'
                : 'bg-[#f3faf6] text-[#087f5b]'
          }`}
        >
          {isLoading ? (
            <LoaderCircle size={21} className="animate-spin" />
          ) : isSuccess ? (
            <CheckCircle2 size={21} />
          ) : isError ? (
            <AlertCircle size={21} />
          ) : (
            <MapPin size={21} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#151a18]">
            {isLoading
              ? 'Finding your location'
              : isSuccess
                ? 'Your location is ready'
                : isError
                  ? 'Location unavailable'
                  : 'Your current location'}
          </p>

          <p className="mt-0.5 text-xs leading-5 text-[#818a85]">
            {isLoading
              ? 'Please allow your browser to access your location.'
              : isSuccess && location
                ? 'We can now find nearby available drivers.'
                : isError
                  ? errorMessage
                  : 'Allow location access to discover nearby drivers.'}
          </p>
        </div>

        <button
          type="button"
          onClick={requestLocation}
          disabled={disabled || isLoading}
          aria-label={
            isSuccess ? 'Refresh your location' : 'Find my location'
          }
          className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#e8ece9] bg-white px-3 text-xs font-semibold text-[#087f5b] transition-colors hover:border-[#b8d4c3] hover:bg-[#f8fbf9] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <LoaderCircle size={15} className="animate-spin" />
          ) : isSuccess ? (
            <RefreshCw size={15} />
          ) : (
            <LocateFixed size={15} />
          )}

          <span className="hidden sm:inline">
            {isLoading ? 'Locating' : isSuccess ? 'Refresh' : 'Locate me'}
          </span>
        </button>
      </div>

      {isError && (
        <p className="mt-2 px-1 text-xs leading-5 text-[#c24141]">
          Check your browser's location permission and try again.
        </p>
      )}
    </div>
  )
}

export default LocationButton
