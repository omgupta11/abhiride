import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import type {
  CustomerLocation,
  VehicleType,
} from '../../types/driver'

interface MapDriver {
  id: string
  fullName: string
  phone: string
  vehicleType: VehicleType
  vehicleModel: string
  vehicleNumber: string
  profilePhotoUrl: string | null
  distanceMeters: number
  lastLocationUpdate: string | null
  latitude: number
  longitude: number
}

interface LiveDriverMapProps {
  customerLocation: CustomerLocation | null
  drivers: MapDriver[]
}

const vehicleIcons: Record<VehicleType, string> = {
  auto: '🛺',
  taxi: '🚕',
  bike: '🏍️',
}

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
  if (!value) return 'Update time unavailable'

  const timestamp = new Date(value).getTime()

  if (!Number.isFinite(timestamp)) {
    return 'Update time unavailable'
  }

  const minutes = Math.max(
    0,
    Math.floor((Date.now() - timestamp) / 60000),
  )

  if (minutes === 0) return 'Updated just now'

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

const createDriverIcon = (vehicleType: VehicleType) => {
  const emoji = vehicleIcons[vehicleType]

  return L.divIcon({
    className: 'abhiride-driver-marker-wrapper',
    html: `
      <div style="
        width:42px;
        height:42px;
        display:flex;
        align-items:center;
        justify-content:center;
        background:white;
        border:2px solid #087f5b;
        border-radius:50%;
        font-size:23px;
        box-shadow:0 2px 8px rgba(0,0,0,0.2);
      ">
        ${emoji}
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  })
}

const createDriverPopup = (driver: MapDriver): HTMLElement => {
  const container = document.createElement('div')

  container.style.minWidth = '190px'
  container.style.padding = '3px'

  const name = document.createElement('h3')
  name.textContent = driver.fullName
  name.style.fontWeight = '700'
  name.style.fontSize = '15px'
  name.style.marginBottom = '7px'

  const vehicle = document.createElement('p')
  vehicle.textContent = driver.vehicleModel
  vehicle.style.fontSize = '13px'
  vehicle.style.marginBottom = '3px'

  const number = document.createElement('p')
  number.textContent = driver.vehicleNumber
  number.style.fontSize = '12px'
  number.style.color = '#68736d'
  number.style.marginBottom = '7px'

  const distance = document.createElement('p')
  distance.textContent = formatDistance(driver.distanceMeters)
  distance.style.fontSize = '12px'
  distance.style.marginBottom = '3px'

  const updated = document.createElement('p')
  updated.textContent = formatLastUpdate(driver.lastLocationUpdate)
  updated.style.fontSize = '11px'
  updated.style.color = '#68736d'
  updated.style.marginBottom = '10px'

  const callButton = document.createElement('a')
  callButton.href = `tel:${driver.phone.replace(/[^\d+]/g, '')}`
  callButton.textContent = 'Call driver'
  callButton.style.display = 'block'
  callButton.style.textAlign = 'center'
  callButton.style.background = '#087f5b'
  callButton.style.color = 'white'
  callButton.style.padding = '10px'
  callButton.style.borderRadius = '9px'
  callButton.style.fontSize = '13px'
  callButton.style.fontWeight = '600'
  callButton.style.textDecoration = 'none'

  container.append(
    name,
    vehicle,
    number,
    distance,
    updated,
    callButton,
  )

  return container
}

const LiveDriverMap = ({
  customerLocation,
  drivers,
}: LiveDriverMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)

  const customerMarkerRef = useRef<L.CircleMarker | null>(null)

  const driverMarkersRef = useRef(
    new Map<string, L.Marker>(),
  )

  const hasCenteredOnCustomerRef = useRef(false)

  // Initialise map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const initialCenter: L.LatLngExpression = customerLocation
      ? [customerLocation.latitude, customerLocation.longitude]
      : [20.5937, 78.9629]

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
    }).setView(initialCenter, customerLocation ? 15 : 5)

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      },
    ).addTo(map)

    L.control.zoom({
      position: 'bottomright',
    }).addTo(map)

    mapRef.current = map

    requestAnimationFrame(() => {
      map.invalidateSize()
    })

    return () => {
      map.remove()
      mapRef.current = null
      customerMarkerRef.current = null
      driverMarkersRef.current.clear()
      hasCenteredOnCustomerRef.current = false
    }
  }, [])

  // Show and update customer location
  useEffect(() => {
    const map = mapRef.current

    if (!map || !customerLocation) return

    const position: L.LatLngExpression = [
      customerLocation.latitude,
      customerLocation.longitude,
    ]

    if (!customerMarkerRef.current) {
      customerMarkerRef.current = L.circleMarker(position, {
        radius: 9,
        color: '#ffffff',
        weight: 3,
        fillColor: '#2563eb',
        fillOpacity: 1,
      }).addTo(map)

      customerMarkerRef.current.bindTooltip('Your location')
    } else {
      customerMarkerRef.current.setLatLng(position)
    }

    // Centre the map on the customer only the first time.
    // Do not disturb the map when the user is exploring it.
    if (!hasCenteredOnCustomerRef.current) {
      map.setView(position, 15, {
        animate: true,
      })

      hasCenteredOnCustomerRef.current = true
    }
  }, [customerLocation])

  // Update driver markers without recreating the map
  useEffect(() => {
    const map = mapRef.current

    if (!map) return

    const currentDriverIds = new Set<string>()

    drivers.forEach((driver) => {
      if (
        !Number.isFinite(driver.latitude) ||
        !Number.isFinite(driver.longitude) ||
        driver.latitude < -90 ||
        driver.latitude > 90 ||
        driver.longitude < -180 ||
        driver.longitude > 180
      ) {
        return
      }

      currentDriverIds.add(driver.id)

      const position: L.LatLngExpression = [
        driver.latitude,
        driver.longitude,
      ]

      let marker = driverMarkersRef.current.get(driver.id)

      if (!marker) {
        marker = L.marker(position, {
          icon: createDriverIcon(driver.vehicleType),
          title: driver.fullName,
        })

        marker.addTo(map)

        marker.bindPopup(createDriverPopup(driver), {
          maxWidth: 260,
        })

        driverMarkersRef.current.set(driver.id, marker)
      } else {
        marker.setLatLng(position)
        marker.setPopupContent(createDriverPopup(driver))
      }
    })

    // Remove markers for drivers no longer returned by Supabase
    driverMarkersRef.current.forEach((marker, driverId) => {
      if (!currentDriverIds.has(driverId)) {
        map.removeLayer(marker)
        driverMarkersRef.current.delete(driverId)
      }
    })
  }, [drivers])

  const recenterMap = () => {
    const map = mapRef.current

    if (!map || !customerLocation) return

    map.flyTo(
      [
        customerLocation.latitude,
        customerLocation.longitude,
      ],
      Math.max(map.getZoom(), 15),
      {
        animate: true,
        duration: 0.7,
      },
    )
  }

  return (
    <div className="relative z-0 overflow-hidden rounded-2xl border border-[#e8ece9] bg-white">
      <div
        ref={mapContainerRef}
        className="h-[420px] w-full"
      />

      <button
        type="button"
        onClick={recenterMap}
        disabled={!customerLocation}
        aria-label="Re-centre map on my location"
        title="Re-centre on my location"
        className="absolute right-3 top-3 z-[1000] flex h-11 w-11 items-center justify-center rounded-xl border border-[#e8ece9] bg-white text-[#2563eb] shadow-md transition-colors hover:bg-[#f3f7ff] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="text-xl">◎</span>
      </button>

      {drivers.length === 0 && (
        <div className="absolute bottom-3 left-3 z-[1000] rounded-lg border border-[#e8ece9] bg-white/95 px-3 py-2 text-xs text-[#68736d] shadow-sm">
          No nearby drivers found yet
        </div>
      )}
    </div>
  )
}

export default LiveDriverMap