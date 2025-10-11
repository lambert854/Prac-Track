import React from 'react'
import Image from 'next/image'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  showText?: boolean
}

export function Logo({ className = '', size = 'md', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: 'h-20',
    md: 'h-28', 
    lg: 'h-32',
    xl: 'h-36',
    '2xl': 'h-40'
  }

  return (
    <div className={`flex items-center justify-center w-full ${className}`}>
      <div className={`${sizeClasses[size]} w-full relative flex items-center justify-center`}>
        <Image
          src="/logo.svg"
          alt="PRAC-TRACK Logo"
          fill
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
    sm: 'h-12',
    md: 'h-16',
    lg: 'h-20', 
    xl: 'h-24',
    '2xl': 'h-28'
  }

  return (
    <div className={`${sizeClasses[size]} relative w-full ${className}`}>
      <Image
        src="/logo.svg"
        alt="PRAC-TRACK Logo"
        fill
        priority
        className="object-contain"
      />
    </div>
  )
}
