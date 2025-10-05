'use client'

import { useState } from 'react'
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import { HelpFAQ } from './help-faq'

export function SupportButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Floating Support Button */}
      <div className="fixed bottom-6 left-6 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-primary hover:bg-primary-dark text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
          title="Get Help"
        >
          <QuestionMarkCircleIcon className="h-6 w-6" />
          <span className="ml-2 text-sm font-medium hidden group-hover:block transition-all duration-200">
            Help & FAQ
          </span>
        </button>
      </div>

      {/* Help FAQ Modal */}
      <HelpFAQ isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
