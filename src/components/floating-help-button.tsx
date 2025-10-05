'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { QuestionMarkCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'

export function FloatingHelpButton() {
  const [isExpanded, setIsExpanded] = useState(false)
  const router = useRouter()

  const handleHelpClick = () => {
    router.push('/help')
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {/* Help Options Panel */}
      {isExpanded && (
        <div className="mb-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[200px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Help & Support</h3>
            <button
              onClick={toggleExpanded}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2">
            <button
              onClick={handleHelpClick}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              📖 Online Help Guide
            </button>
            <button
              onClick={toggleExpanded}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              💬 Contact Support
            </button>
            <button
              onClick={toggleExpanded}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              ❓ Quick Tips
            </button>
          </div>
        </div>
      )}

      {/* Floating Help Button */}
      <button
        onClick={toggleExpanded}
        className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        title="Get Help"
      >
        <QuestionMarkCircleIcon className="h-6 w-6" />
      </button>
    </div>
  )
}
