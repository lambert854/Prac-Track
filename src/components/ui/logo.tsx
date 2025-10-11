import React from 'react'
import Image from 'next/image'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  showText?: boolean
}

export function Logo({ className = '', size = 'md', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-auto',
    md: 'h-12 w-auto', 
    lg: 'h-16 w-auto',
    xl: 'h-20 w-auto',
    '2xl': 'h-24 w-auto'
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
        <Image
          src="/logo.svg"
          alt="PRAC-TRACK Logo"
          width={200}
          height={120}
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
    sm: 'h-8 w-auto',
    md: 'h-10 w-auto',
    lg: 'h-12 w-auto', 
    xl: 'h-16 w-auto',
    '2xl': 'h-20 w-auto'
  }

  return (
    <div className={`${sizeClasses[size]} relative ${className}`}>
      <Image
        src="/logo.svg"
        alt="PRAC-TRACK Logo"
        width={200}
        height={120}
        priority
        className="object-contain"
      />
    </div>
  )
}
