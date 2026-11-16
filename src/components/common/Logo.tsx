
import { ArrowUpRight } from 'lucide-react'

interface LogoProps {
  size?: 'small' | 'medium' | 'large'
  showTagline?: boolean
  dark?: boolean
}

const Logo = ({
  size = 'medium',
  showTagline = false,
  dark = false,
}: LogoProps) => {
  const sizes = {
    small: {
      icon: 'h-8 w-8 rounded-lg',
      text: 'text-lg',
      tagline: 'text-[9px]',
    },
    medium: {
      icon: 'h-10 w-10 rounded-xl',
      text: 'text-xl',
      tagline: 'text-[10px]',
    },
    large: {
      icon: 'h-12 w-12 rounded-2xl',
      text: 'text-2xl',
      tagline: 'text-xs',
    },
  }

  const currentSize = sizes[size]

  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={`${currentSize.icon} relative flex shrink-0 items-center justify-center bg-[#087f5b] text-white`}
        aria-hidden="true"
      >
        <span className="text-[17px] font-bold tracking-tighter">A</span>
        <ArrowUpRight
          size={12}
          strokeWidth={2.8}
          className="absolute bottom-1 right-1"
        />
      </span>

      <span className="flex flex-col">
        <span
          className={`${currentSize.text} font-bold leading-none tracking-[-0.06em] ${
            dark ? 'text-white' : 'text-[#151a18]'
          }`}
        >
          Abhi<span className="text-[#087f5b]">Ride</span>
        </span>

        {showTagline && (
          <span
            className={`${currentSize.tagline} mt-1 font-medium tracking-wide ${
              dark ? 'text-white/65' : 'text-[#818a85]'
            }`}
          >
            YOUR RIDE. YOUR CHOICE.
          </span>
        )}
      </span>
    </span>
  )
}

export default Logo
