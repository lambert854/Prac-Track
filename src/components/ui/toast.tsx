'use client'

import { useEffect } from 'react'
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

interface ToastProps {
  id: string
  title: string
  description: string
  type: 'success' | 'error' | 'info' | 'warning'
  onRemove: (id: string) => void
}

export function Toast({ id, title, description, type, onRemove }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id)
    }, 5000)

    return () => clearTimeout(timer)
  }, [id, onRemove])

  const icons = {
    success: CheckCircleIcon,
    error: ExclamationTriangleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon,
  }

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }

  const iconColors = {
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400',
  }

  const Icon = icons[type]

  return (
    <div className={`max-w-sm w-full border rounded-lg shadow-lg p-4 ${colors[type]}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${iconColors[type]}`} />
        </div>
        <div className="ml-3 w-0 flex-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-1 text-sm opacity-90">{description}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition ease-in-out duration-150"
            onClick={() => onRemove(id)}
            aria-label="Close notification"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

interface ToastContainerProps {
  toasts: Array<{
    id: string
    title: string
    description: string
    type: 'success' | 'error' | 'info' | 'warning'
  }>
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <>
      {/* Screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {toasts.map(toast => (
          <div key={toast.id}>
            {toast.type === 'success' ? 'Success: ' : 
             toast.type === 'error' ? 'Error: ' : 
             toast.type === 'warning' ? 'Warning: ' : 'Info: '}
            {toast.title}. {toast.description}
          </div>
        ))}
      </div>

      {/* Visual toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            {...toast}
            onRemove={onRemove}
          />
        ))}
      </div>
    </>
  )
}
