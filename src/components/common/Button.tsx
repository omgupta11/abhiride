
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'

import { LoaderCircle } from 'lucide-react'

/* =========================================
   BUTTON TYPES
========================================= */

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'

export type ButtonSize =
  | 'small'
  | 'medium'
  | 'large'

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  children: ReactNode
}

/* =========================================
   BUTTON STYLE CONFIGURATION
========================================= */

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'border border-[#087f5b]',
    'bg-[#087f5b]',
    'text-white',
    'hover:border-[#066b4d]',
    'hover:bg-[#066b4d]',
    'active:bg-[#055b42]',
  ].join(' '),

  secondary: [
    'border border-[#e8ece9]',
    'bg-[#f5f8f6]',
    'text-[#151a18]',
    'hover:border-[#d5dfd8]',
    'hover:bg-[#edf3ef]',
    'active:bg-[#e7eee9]',
  ].join(' '),

  outline: [
    'border border-[#087f5b]',
    'bg-transparent',
    'text-[#087f5b]',
    'hover:bg-[#f0f8f3]',
    'active:bg-[#e6f4eb]',
  ].join(' '),

  ghost: [
    'border border-transparent',
    'bg-transparent',
    'text-[#454d49]',
    'hover:bg-[#f3f7f4]',
    'hover:text-[#087f5b]',
    'active:bg-[#eaf2ec]',
  ].join(' '),

  danger: [
    'border border-[#d94848]',
    'bg-[#d94848]',
    'text-white',
    'hover:border-[#bd3838]',
    'hover:bg-[#bd3838]',
    'active:bg-[#a82f2f]',
  ].join(' '),
}

/* =========================================
   BUTTON SIZE CONFIGURATION
========================================= */

const sizeStyles: Record<ButtonSize, string> = {
  small: 'min-h-9 px-3.5 text-xs rounded-lg gap-1.5',

  medium: 'min-h-11 px-5 text-sm rounded-xl gap-2',

  large: 'min-h-13 px-6 text-sm rounded-xl gap-2.5',
}

/* =========================================
   BASE BUTTON COMPONENT
========================================= */

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'medium',
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      children,
      disabled = false,
      type = 'button',
      className = '',
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading

    const baseStyles = [
      'inline-flex',
      'items-center',
      'justify-center',
      'font-semibold',
      'whitespace-nowrap',
      'select-none',
      'transition-all',
      'duration-200',
      'ease-in-out',
      'focus-visible:outline-2',
      'focus-visible:outline-offset-2',
      'focus-visible:outline-[#087f5b]',
      'active:scale-[0.985]',
      'disabled:cursor-not-allowed',
      'disabled:opacity-55',
    ].join(' ')

    const buttonClasses = [
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      fullWidth ? 'w-full' : 'w-fit',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading}
        className={buttonClasses}
        {...props}
      >
        {/* Loading indicator */}
        {loading && (
          <LoaderCircle
            size={size === 'small' ? 14 : size === 'large' ? 19 : 17}
            strokeWidth={2.2}
            className="shrink-0 animate-spin"
            aria-hidden="true"
          />
        )}

        {/* Left icon */}
        {!loading && leftIcon && (
          <span
            className="inline-flex shrink-0 items-center justify-center"
            aria-hidden="true"
          >
            {leftIcon}
          </span>
        )}

        {/* Button label */}
        <span>{children}</span>

        {/* Right icon */}
        {!loading && rightIcon && (
          <span
            className="inline-flex shrink-0 items-center justify-center"
            aria-hidden="true"
          >
            {rightIcon}
          </span>
        )}
      </button>
    )
  },
)

Button.displayName = 'Button'

export default Button
