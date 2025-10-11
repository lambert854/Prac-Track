'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  XMarkIcon, 
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface PlacementRejectionModalProps {
  placement: {
    id: string
    student: {
      firstName: string
      lastName: string
    }
    site: {
      name: string
    }
  }
  onClose: () => void
}

export function PlacementRejectionModal({ placement, onClose }: PlacementRejectionModalProps) {
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  const rejectMutation = useMutation({
    mutationFn: async (data: { reason: string }) => {
      const response = await fetch(`/api/placements/${placement.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reject placement')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['placements'] })
      queryClient.invalidateQueries({ queryKey: ['student-dashboard'] })
      onClose()
    },
  })

  const handleReject = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    setIsSubmitting(true)
    try {
      await rejectMutation.mutateAsync({ reason: reason.trim() })
    } catch (error) {
      console.error('Reject error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Reject Placement Application</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Rejecting Placement Application
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    You are about to reject <strong>{placement.student.firstName} {placement.student.lastName}'s</strong> application for <strong>{placement.site.name}</strong>.
                  </p>
                  <p className="mt-2">
                    The student will be notified of this rejection and will need to apply for a new placement.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label htmlFor="reason" className="form-label">
              Reason for Rejection *
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a clear reason for rejecting this placement application..."
              className="form-textarea w-full h-32"
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              This reason will be shared with the student to help them understand the decision.
            </p>
          </div>

          {/* Error Messages */}
          {rejectMutation.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">
                {rejectMutation.error.message}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReject}
              className="btn-danger flex items-center"
              disabled={isSubmitting || !reason.trim()}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircleIcon className="h-4 w-4 mr-2" />
                  Reject Application
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
