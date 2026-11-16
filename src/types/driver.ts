
/**
 * AbhiRide
 * Shared Driver Types
 *
 * Central source of truth for driver-related data.
 * Used by customer pages, driver pages, components and services.
 */

/* =========================================
   VEHICLE TYPES
========================================= */

export type VehicleType = 'auto' | 'taxi' | 'bike'

export type DriverAvailability = 'live' | 'offline'

export type DriverVerificationStatus =
  | 'unverified'
  | 'phone_verified'
  | 'verified'

export type LocationFreshness =
  | 'fresh'
  | 'stale'
  | 'unavailable'

/* =========================================
   DRIVER LOCATION
========================================= */

export interface DriverLocation {
  latitude: number
  longitude: number
  accuracy?: number
  updatedAt: string
}

export interface CustomerLocation {
  latitude: number
  longitude: number
  accuracy?: number
}

/* =========================================
   DRIVER PROFILE
========================================= */

export interface DriverProfile {
  id: string
  fullName: string
  phone: string
  phoneVerified: boolean
  vehicleType: VehicleType
  vehicleModel: string
  vehicleNumber: string
  profilePhotoUrl: string | null
  verificationStatus: DriverVerificationStatus
  createdAt: string
  updatedAt: string
}

/* =========================================
   DRIVER LIVE STATUS
========================================= */

export interface DriverLiveStatus {
  /**
   * Availability is controlled manually by the driver.
   * It must not be changed automatically because of
   * inactivity, page closure or temporary network loss.
   */
  isAvailable: boolean

  location: DriverLocation | null

  lastLocationUpdate: string | null

  locationFreshness: LocationFreshness
}

/* =========================================
   CUSTOMER SEARCH RESULT
========================================= */

export interface DriverSearchResult {
  id: string
  fullName: string
  vehicleType: VehicleType
  vehicleModel: string
  vehicleNumber: string
  profilePhotoUrl: string | null

  /**
   * Distance between the customer's location and
   * the driver's last recorded location, in kilometres.
   */
  distanceKm: number

  lastLocationUpdate: string | null

  locationFreshness: LocationFreshness

  phoneVerified: boolean

  /**
   * Driver must have manually selected LIVE.
   */
  isAvailable: boolean
}

/* =========================================
   DRIVER REGISTRATION INPUT
========================================= */

export interface DriverRegistrationInput {
  fullName: string
  phone: string
  email: string
  password: string
  vehicleType: VehicleType
  vehicleModel: string
  vehicleNumber: string
  profilePhoto?: File | null
}

/* =========================================
   DRIVER AVAILABILITY UPDATE
========================================= */

export interface DriverAvailabilityUpdate {
  isAvailable: boolean

  /**
   * Coordinates are optional when switching OFFLINE.
   * When switching LIVE, a valid location is required
   * before the driver can be listed to customers.
   */
  latitude?: number
  longitude?: number
  accuracy?: number
}

/* =========================================
   CUSTOMER SEARCH FILTERS
========================================= */

export interface DriverSearchFilters {
  vehicleType: VehicleType
  customerLocation: CustomerLocation
  maxDistanceKm?: number
  destination?: string
}

/* =========================================
   LOCATION UPDATE RESPONSE
========================================= */

export interface LocationUpdateResponse {
  success: boolean
  updatedAt: string | null
  message?: string
}

/* =========================================
   GENERIC API RESPONSE
========================================= */

export interface ApiResponse<T> {
  success: boolean
  data: T | null
  error: string | null
}
