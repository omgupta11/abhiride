
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'

import {
  ArrowRight,
  Bike,
  CarFront,
  CheckCircle2,
  ImagePlus,
  ShieldCheck,
  UserRound,
  X,
  LockKeyhole,
} from 'lucide-react'

import type {
  DriverRegistrationInput,
  VehicleType,
} from '../../types/driver'

import Button from '../common/Button'

type DriverRegistrationFormData = DriverRegistrationInput & {
  email: string
  password: string
}

interface DriverFormProps {
  onSubmit: (data: DriverRegistrationFormData) => void
  isSubmitting?: boolean
  registrationEnabled?: boolean
}

interface FormErrors {
  fullName?: string
  email?: string
  password?: string
  phone?: string
  vehicleType?: string
  vehicleModel?: string
  vehicleNumber?: string
  profilePhoto?: string
}

const vehicleOptions: {
  value: VehicleType
  label: string
  description: string
  icon: typeof CarFront
}[] = [
  {
    value: 'auto',
    label: 'Auto',
    description: 'Auto rickshaw',
    icon: CarFront,
  },
  {
    value: 'taxi',
    label: 'Taxi',
    description: 'Car or cab',
    icon: CarFront,
  },
  {
    value: 'bike',
    label: 'Bike',
    description: 'Two-wheeler',
    icon: Bike,
  },
]

const MAX_PHOTO_SIZE = 5 * 1024 * 1024

const ALLOWED_PHOTO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

const DriverForm = ({
  onSubmit,
  isSubmitting = false,
  registrationEnabled = false,
}: DriverFormProps) => {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [vehicleType, setVehicleType] = useState<VehicleType | ''>('')
  const [vehicleModel, setVehicleModel] = useState('')
  const [vehicleNumber, setVehicleNumber] = useState('')

  const [profilePhoto, setProfilePhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const [errors, setErrors] = useState<FormErrors>({})

  const photoInputRef = useRef<HTMLInputElement>(null)
  const photoReaderRef = useRef<FileReader | null>(null)

  useEffect(() => {
    return () => {
      photoReaderRef.current?.abort()
      photoReaderRef.current = null
    }
  }, [])

  const handlePhotoChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]

    if (!file) return

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setErrors((previous) => ({
        ...previous,
        profilePhoto: 'Please select a JPG, PNG or WebP image.',
      }))

      event.target.value = ''
      return
    }

    if (file.size > MAX_PHOTO_SIZE) {
      setErrors((previous) => ({
        ...previous,
        profilePhoto: 'Photo size must be less than 5 MB.',
      }))

      event.target.value = ''
      return
    }

    photoReaderRef.current?.abort()

    const reader = new FileReader()

    photoReaderRef.current = reader

    reader.onload = () => {
      if (photoReaderRef.current !== reader) return

      if (typeof reader.result === 'string') {
        setPhotoPreview(reader.result)
      }
    }

    reader.onerror = () => {
      if (photoReaderRef.current !== reader) return

      setErrors((previous) => ({
        ...previous,
        profilePhoto: 'Unable to read this image. Please try another photo.',
      }))

      setPhotoPreview(null)
      setProfilePhoto(null)
      photoReaderRef.current = null
    }

    reader.onabort = () => {
      if (photoReaderRef.current === reader) {
        photoReaderRef.current = null
      }
    }

    setProfilePhoto(file)

    setErrors((previous) => ({
      ...previous,
      profilePhoto: undefined,
    }))

    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const removePhoto = () => {
    photoReaderRef.current?.abort()
    photoReaderRef.current = null

    setProfilePhoto(null)
    setPhotoPreview(null)

    if (photoInputRef.current) {
      photoInputRef.current.value = ''
    }

    setErrors((previous) => ({
      ...previous,
      profilePhoto: undefined,
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (fullName.trim().length < 2) {
      newErrors.fullName = 'Please enter your full name.'
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Enter a valid email address.'
    }

    if (password.length < 8) {
      newErrors.password = 'Password must contain at least 8 characters.'
    }

    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      newErrors.phone = 'Enter a valid 10-digit Indian mobile number.'
    }

    if (!vehicleType) {
      newErrors.vehicleType = 'Please select your vehicle category.'
    }

    if (vehicleModel.trim().length < 2) {
      newErrors.vehicleModel = 'Please enter your vehicle model.'
    }

    if (
      !/^[A-Z0-9 -]{6,15}$/.test(
        vehicleNumber.trim().toUpperCase(),
      )
    ) {
      newErrors.vehicleNumber =
        'Please enter a valid vehicle registration number.'
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!registrationEnabled || isSubmitting) return

    if (!validateForm() || !vehicleType) return

    const registrationData: DriverRegistrationFormData = {
      email: email.trim().toLowerCase(),
      password,
      fullName: fullName.trim(),
      phone: phone.trim(),
      vehicleType,
      vehicleModel: vehicleModel.trim(),
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      profilePhoto,
    }

    onSubmit(registrationData)
  }

  const inputClass =
    'w-full min-h-12 rounded-xl border border-[#e8ece9] bg-white px-4 text-sm text-[#151a18] outline-none transition-all placeholder:text-[#a0a8a3] focus:border-[#087f5b] focus:ring-4 focus:ring-[#087f5b]/10'

  const labelClass =
    'mb-2 block text-sm font-semibold text-[#454d49]'

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full space-y-7"
      noValidate
    >
      {/* PERSONAL INFORMATION */}

      <section>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0f8f3] text-[#087f5b]">
            <UserRound size={20} />
          </div>

          <div>
            <h3 className="text-base font-semibold text-[#151a18]">
              Personal information
            </h3>

            <p className="mt-0.5 text-xs text-[#818a85]">
              Tell us a little about yourself.
            </p>
          </div>
        </div>

        {/* Full name */}

        <div>
          <label htmlFor="driver-full-name" className={labelClass}>
            Full name <span className="text-[#d94848]">*</span>
          </label>

          <input
            id="driver-full-name"
            type="text"
            autoComplete="name"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(event) => {
              setFullName(event.target.value)
              setErrors((previous) => ({
                ...previous,
                fullName: undefined,
              }))
            }}
            maxLength={80}
            aria-invalid={Boolean(errors.fullName)}
            className={`${inputClass} ${
              errors.fullName ? 'border-[#d94848]' : ''
            }`}
          />

          {errors.fullName && (
            <p className="mt-1.5 text-xs text-[#d94848]">
              {errors.fullName}
            </p>
          )}
        </div>

        {/* Email */}

        <div className="mt-5">
          <label htmlFor="driver-email" className={labelClass}>
            Email address <span className="text-[#d94848]">*</span>
          </label>

          <input
            id="driver-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setErrors((previous) => ({
                ...previous,
                email: undefined,
              }))
            }}
            maxLength={254}
            aria-invalid={Boolean(errors.email)}
            className={`${inputClass} ${
              errors.email ? 'border-[#d94848]' : ''
            }`}
          />

          {errors.email && (
            <p className="mt-1.5 text-xs text-[#d94848]">
              {errors.email}
            </p>
          )}
        </div>

        {/* Password */}

        <div className="mt-5">
          <label htmlFor="driver-password" className={labelClass}>
            Password <span className="text-[#d94848]">*</span>
          </label>

          <input
            id="driver-password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setErrors((previous) => ({
                ...previous,
                password: undefined,
              }))
            }}
            minLength={8}
            maxLength={128}
            aria-invalid={Boolean(errors.password)}
            className={`${inputClass} ${
              errors.password ? 'border-[#d94848]' : ''
            }`}
          />

          {errors.password && (
            <p className="mt-1.5 text-xs text-[#d94848]">
              {errors.password}
            </p>
          )}
        </div>

        {/* Mobile number */}

        <div className="mt-5">
          <label htmlFor="driver-phone" className={labelClass}>
            Mobile number <span className="text-[#d94848]">*</span>
          </label>

          <div
            className={`flex overflow-hidden rounded-xl border ${
              errors.phone
                ? 'border-[#d94848]'
                : 'border-[#e8ece9] focus-within:border-[#087f5b] focus-within:ring-4 focus-within:ring-[#087f5b]/10'
            }`}
          >
            <span className="flex items-center border-r border-[#e8ece9] bg-[#f8faf8] px-4 text-sm font-semibold text-[#454d49]">
              +91
            </span>

            <input
              id="driver-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(event) => {
                setPhone(
                  event.target.value.replace(/\D/g, '').slice(0, 10),
                )

                setErrors((previous) => ({
                  ...previous,
                  phone: undefined,
                }))
              }}
              maxLength={10}
              aria-invalid={Boolean(errors.phone)}
              className="min-h-12 min-w-0 flex-1 bg-white px-4 text-sm text-[#151a18] outline-none placeholder:text-[#a0a8a3]"
            />
          </div>

          {errors.phone && (
            <p className="mt-1.5 text-xs text-[#d94848]">
              {errors.phone}
            </p>
          )}

          <div className="mt-2 flex items-start gap-2 text-xs leading-5 text-[#818a85]">
            <ShieldCheck
              size={15}
              className="mt-0.5 shrink-0 text-[#087f5b]"
            />

            <span>
              Your mobile number is saved as unverified for this
              prototype. You can use your email and password to sign in.
            </span>
          </div>
        </div>
      </section>

      {/* VEHICLE INFORMATION */}

      <section className="border-t border-[#edf0ed] pt-7">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0f8f3] text-[#087f5b]">
            <CarFront size={20} />
          </div>

          <div>
            <h3 className="text-base font-semibold text-[#151a18]">
              Vehicle information
            </h3>

            <p className="mt-0.5 text-xs text-[#818a85]">
              Select your vehicle and enter its details.
            </p>
          </div>
        </div>

        {/* Vehicle category */}

        <fieldset>
          <legend className={labelClass}>
            Vehicle category <span className="text-[#d94848]">*</span>
          </legend>

          <div className="grid grid-cols-3 gap-3">
            {vehicleOptions.map((vehicle) => {
              const Icon = vehicle.icon
              const selected = vehicleType === vehicle.value

              return (
                <button
                  key={vehicle.value}
                  type="button"
                  onClick={() => {
                    setVehicleType(vehicle.value)
                    setErrors((previous) => ({
                      ...previous,
                      vehicleType: undefined,
                    }))
                  }}
                  aria-pressed={selected}
                  className={`relative flex min-h-28 flex-col items-center justify-center rounded-xl border p-3 transition-all ${
                    selected
                      ? 'border-[#087f5b] bg-[#f0f8f3] shadow-[0_0_0_1px_#087f5b]'
                      : 'border-[#e8ece9] bg-white hover:border-[#b8d4c3]'
                  }`}
                >
                  {selected && (
                    <CheckCircle2
                      size={17}
                      className="absolute right-2 top-2 text-[#087f5b]"
                    />
                  )}

                  <Icon
                    size={25}
                    strokeWidth={1.8}
                    className={
                      selected ? 'text-[#087f5b]' : 'text-[#68736d]'
                    }
                  />

                  <span className="mt-2 text-sm font-semibold text-[#151a18]">
                    {vehicle.label}
                  </span>

                  <span className="mt-0.5 text-[10px] text-[#818a85]">
                    {vehicle.description}
                  </span>
                </button>
              )
            })}
          </div>

          {errors.vehicleType && (
            <p className="mt-1.5 text-xs text-[#d94848]">
              {errors.vehicleType}
            </p>
          )}
        </fieldset>

        {/* Vehicle model */}

        <div className="mt-5">
          <label htmlFor="vehicle-model" className={labelClass}>
            Vehicle model <span className="text-[#d94848]">*</span>
          </label>

          <input
            id="vehicle-model"
            type="text"
            placeholder="e.g. Bajaj RE, Maruti Dzire, Honda Activa"
            value={vehicleModel}
            onChange={(event) => {
              setVehicleModel(event.target.value)
              setErrors((previous) => ({
                ...previous,
                vehicleModel: undefined,
              }))
            }}
            maxLength={60}
            aria-invalid={Boolean(errors.vehicleModel)}
            className={`${inputClass} ${
              errors.vehicleModel ? 'border-[#d94848]' : ''
            }`}
          />

          {errors.vehicleModel && (
            <p className="mt-1.5 text-xs text-[#d94848]">
              {errors.vehicleModel}
            </p>
          )}
        </div>

        {/* Vehicle registration number */}

        <div className="mt-5">
          <label htmlFor="vehicle-number" className={labelClass}>
            Vehicle registration number{' '}
            <span className="text-[#d94848]">*</span>
          </label>

          <input
            id="vehicle-number"
            type="text"
            autoCapitalize="characters"
            placeholder="e.g. UP78AB1234"
            value={vehicleNumber}
            onChange={(event) => {
              setVehicleNumber(
                event.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9 -]/g, ''),
              )

              setErrors((previous) => ({
                ...previous,
                vehicleNumber: undefined,
              }))
            }}
            maxLength={15}
            aria-invalid={Boolean(errors.vehicleNumber)}
            className={`${inputClass} uppercase ${
              errors.vehicleNumber ? 'border-[#d94848]' : ''
            }`}
          />

          {errors.vehicleNumber && (
            <p className="mt-1.5 text-xs text-[#d94848]">
              {errors.vehicleNumber}
            </p>
          )}

          <p className="mt-2 text-xs text-[#818a85]">
            Enter the registration number exactly as displayed on your
            vehicle's number plate.
          </p>
        </div>
      </section>

      {/* PROFILE PHOTO */}

      <section className="border-t border-[#edf0ed] pt-7">
        <div className="mb-5">
          <h3 className="text-base font-semibold text-[#151a18]">
            Profile photo
          </h3>

          <p className="mt-1 text-xs leading-5 text-[#818a85]">
            Add a clear photo so customers can recognise you. This is
            optional.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#cbd7ce] bg-[#f3faf6]">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Driver profile preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <ImagePlus
                size={25}
                className="text-[#087f5b]"
              />
            )}

            {photoPreview && (
              <button
                type="button"
                onClick={removePhoto}
                aria-label="Remove profile photo"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#151a18]/75 text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex flex-col items-start gap-2">
            <label
              htmlFor="driver-profile-photo"
              className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-[#e8ece9] bg-white px-4 text-xs font-semibold text-[#454d49] transition-colors hover:bg-[#f8faf8]"
            >
              <ImagePlus size={15} />
              {photoPreview ? 'Change photo' : 'Upload photo'}
            </label>

            <p className="text-[11px] text-[#818a85]">
              JPG, PNG or WebP. Maximum 5 MB.
            </p>

            <input
              ref={photoInputRef}
              id="driver-profile-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              className="sr-only"
            />
          </div>
        </div>

        {errors.profilePhoto && (
          <p className="mt-2 text-xs text-[#d94848]">
            {errors.profilePhoto}
          </p>
        )}
      </section>

      {/* SUBMISSION */}

      <section className="border-t border-[#edf0ed] pt-6">
        <div className="mb-5 flex items-start gap-3 rounded-xl bg-[#f3faf6] p-4">
          <ShieldCheck
            size={19}
            className="mt-0.5 shrink-0 text-[#087f5b]"
          />

          <p className="text-xs leading-5 text-[#68736d]">
            Your email and password create your driver account. Your
            mobile number remains unverified until phone verification
            is introduced. Submitting this form does not automatically
            make your profile LIVE.
          </p>
        </div>

        {!registrationEnabled && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#eee5d3] bg-[#fffcf5] p-4">
            <LockKeyhole
              size={17}
              className="mt-0.5 shrink-0 text-[#b7791f]"
            />

            <div>
              <h4 className="text-xs font-semibold text-[#806b43]">
                Online registration is not active yet
              </h4>

              <p className="mt-1 text-xs leading-5 text-[#806b43]">
                Email/password registration is connected for prototype
                testing. Phone OTP verification is temporarily disabled.
              </p>
            </div>
          </div>
        )}

        <Button
          type="submit"
          size="large"
          fullWidth
          loading={isSubmitting}
          disabled={isSubmitting || !registrationEnabled}
          rightIcon={<ArrowRight size={17} />}
        >
          {registrationEnabled
            ? 'Create driver account'
            : 'Registration coming soon'}
        </Button>

        <p className="mt-3 text-center text-[11px] leading-5 text-[#818a85]">
          By continuing, you confirm that the information provided
          is accurate and belongs to you.
        </p>
      </section>
    </form>
  )
}

export default DriverForm
