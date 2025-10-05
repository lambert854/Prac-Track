'use client'

import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface Supervisor {
  id: string
  firstName: string
  lastName: string
  supervisorPlacements?: Array<{
    id: string
    student: {
      id: string
      firstName: string
      lastName: string
    }
  }>
}

interface DeleteSupervisorModalProps {
  supervisor: Supervisor
  onClose: () => void
  onConfirm: () => void
  isDeleting: boolean
}

export function DeleteSupervisorModal({ 
  supervisor, 
  onClose, 
  onConfirm, 
  isDeleting 
}: DeleteSupervisorModalProps) {
  const hasPlacements = (supervisor.supervisorPlacements?.length || 0) > 0
  const canDelete = !hasPlacements

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Delete Supervisor</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex items-start space-x-4 mb-6">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-gray-700">
              Are you sure you want to delete <span className="font-semibold">{supervisor.firstName} {supervisor.lastName}</span>?
            </p>
            <p className="text-sm text-gray-500 mt-1">
              This action cannot be undone.
            </p>
          </div>
        </div>

        {!canDelete && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-red-800 mb-2">Cannot Delete Supervisor</h4>
            <div className="text-sm text-red-700 space-y-1">
              {hasPlacements && (
                <p>• This supervisor has {supervisor.supervisorPlacements?.length} active placements</p>
              )}
              <p className="mt-2">Please reassign students before deleting this supervisor.</p>
            </div>
          </div>
        )}

        {canDelete && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">Warning</h4>
            <p className="text-sm text-yellow-700">
              Deleting this supervisor will permanently remove their account and all associated data.
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="btn-outline"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn-danger"
            disabled={isDeleting || !canDelete}
          >
            {isDeleting ? 'Deleting...' : 'Delete Supervisor'}
          </button>
        </div>
      </div>
    </div>
  )
}
