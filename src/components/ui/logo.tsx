import React from 'react'
import Image from 'next/image'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  showText?: boolean
}

export function Logo({ className = '', size = 'md', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: { container: 'h-20', width: 80, height: 80 },
    md: { container: 'h-28', width: 112, height: 112 },
    lg: { container: 'h-32', width: 128, height: 128 },
    xl: { container: 'h-36', width: 144, height: 144 },
    '2xl': { container: 'h-40', width: 160, height: 160 },
    '3xl': { container: 'h-48', width: 200, height: 200 }
  }

  const currentSize = sizeClasses[size]

  return (
    <div className={`flex items-center justify-center w-full ${className}`}>
      <div className={`${currentSize.container} w-full flex items-center justify-center`}>
        <Image
          src="/logo.svg"
          alt="PRAC-TRACK Logo"
          width={currentSize.width}
          height={currentSize.height}
          priority
          className="object-contain"
        />
      </div>
    </div>
  )
}

// Alternative compact version for smaller spaces
export function LogoCompact({ className = '', size = 'md' }: Omit<LogoProps, 'showText'>) {
  const sizeClasses = {
    sm: { container: 'h-12', width: 48, height: 48 },
    md: { container: 'h-16', width: 64, height: 64 },
    lg: { container: 'h-20', width: 80, height: 80 },
    xl: { container: 'h-24', width: 96, height: 96 },
    '2xl': { container: 'h-28', width: 112, height: 112 },
    '3xl': { container: 'h-32', width: 128, height: 128 }
  }

  const currentSize = sizeClasses[size]

  return (
    <div className={`${currentSize.container} w-full flex items-center justify-center ${className}`}>
      <Image
        src="/logo.svg"
        alt="PRAC-TRACK Logo"
        width={currentSize.width}
        height={currentSize.height}
        priority
        className="object-contain"
      />
    </div>
  )
}
