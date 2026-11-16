
import { Bike, CarFront, Check } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { VehicleType } from '../../types/driver'

interface VehicleSelectorProps {
  selectedVehicle: VehicleType
  onChange: (vehicle: VehicleType) => void
  disabled?: boolean
}

interface VehicleOption {
  id: VehicleType
  name: string
  description: string
  icon: LucideIcon
}

const vehicleOptions: VehicleOption[] = [
  {
    id: 'auto',
    name: 'Auto',
    description: 'Everyday travel',
    icon: CarFront,
  },
  {
    id: 'taxi',
    name: 'Taxi',
    description: 'Comfortable rides',
    icon: CarFront,
  },
  {
    id: 'bike',
    name: 'Bike',
    description: 'Quick journeys',
    icon: Bike,
  },
]

const VehicleSelector = ({
  selectedVehicle,
  onChange,
  disabled = false,
}: VehicleSelectorProps) => {
  return (
    <fieldset className="w-full" disabled={disabled}>
      <legend className="mb-3 text-sm font-semibold text-[#151a18]">
        Choose your ride
      </legend>

      <div className="grid grid-cols-3 gap-3">
        {vehicleOptions.map((vehicle) => {
          const isSelected = selectedVehicle === vehicle.id
          const Icon = vehicle.icon

          return (
            <button
              key={vehicle.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(vehicle.id)}
              disabled={disabled}
              className={`relative flex min-w-0 flex-col items-center justify-center rounded-2xl border px-2 py-4 text-center transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087f5b] disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 ${
                isSelected
                  ? 'border-[#087f5b] bg-[#f0f8f3] shadow-[0_0_0_1px_#087f5b]'
                  : 'border-[#e8ece9] bg-white hover:border-[#b8d4c3] hover:bg-[#fafcfb]'
              }`}
            >
              {isSelected && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#087f5b] text-white">
                  <Check size={12} strokeWidth={2.8} />
                </span>
              )}

              <span
                className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                  isSelected
                    ? 'bg-white text-[#087f5b]'
                    : 'bg-[#f5f7f5] text-[#68736d]'
                }`}
              >
                <Icon size={25} strokeWidth={1.8} />
              </span>

              <span className="text-sm font-semibold text-[#151a18]">
                {vehicle.name}
              </span>

              <span className="mt-1 text-[10px] leading-4 text-[#818a85] sm:text-xs">
                {vehicle.description}
              </span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export default VehicleSelector
