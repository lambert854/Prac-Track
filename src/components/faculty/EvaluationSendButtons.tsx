'use client'

import { useState } from 'react'
import { EvaluationSendModal } from './EvaluationSendModal'
import { DocumentCheckIcon } from '@heroicons/react/24/outline'

export function EvaluationSendButtons() {
  const [modalType, setModalType] = useState<'MIDTERM' | 'FINAL' | null>(null)

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <DocumentCheckIcon className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-bold text-gray-900">Send Evaluations</h2>
        </div>
        
        <p className="text-gray-600 mb-4">
          Send evaluation forms to students and supervisors for all your active placements.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setModalType('MIDTERM')}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Send Mid-Term Evaluations
          </button>
          
          <button
            onClick={() => setModalType('FINAL')}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Send Final Evaluations
          </button>
        </div>

        <p className="text-sm text-gray-500 mt-3">
          Recipients will receive notifications with links to complete their evaluations.
        </p>
      </div>

      {modalType && (
        <EvaluationSendModal
          type={modalType}
          isOpen={true}
          onClose={() => setModalType(null)}
        />
      )}
    </>
  )
}
