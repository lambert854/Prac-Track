'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  XMarkIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  UserIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { PlacementRejectionModal } from './placement-rejection-modal'

interface Placement {
  id: string
  startDate: string
  endDate: string
  status: string
  requiredHoursOverride?: number
  student: {
    id: string
    firstName: string
    lastName: string
    email: string
    studentProfile?: {
      aNumber: string
      program: string
      cohort: string
      requiredHours: number
    }
  }
  site: {
    id: string
    name: string
    address: string
    city: string
    state: string
    zip: string
    contactName: string
    contactEmail: string
    contactPhone: string
    practiceAreas: string
  }
}

interface PlacementRequestDetailsModalProps {
  placement: Placement
  onClose: () => void
}

export function PlacementRequestDetailsModal({ placement, onClose }: PlacementRequestDetailsModalProps) {
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const queryClient = useQueryClient()

  const approveMutation = useMutation({
    mutationFn: async (data: { notes: string }) => {
      const response = await fetch(`/api/placements/${placement.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to approve placement')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['placements'] })
      onClose()
    },
  })


  const handleApprove = async () => {
    setIsSubmitting(true)
    try {
      await approveMutation.mutateAsync({ notes })
    } catch (error) {
      console.error('Approve error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Placement Request Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Student Information */}
          <div className="card bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
              <UserIcon className="h-6 w-6 mr-2 text-blue-600" />
              Student Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-700 font-medium">Name:</p>
                <p className="text-gray-900">{placement.student.firstName} {placement.student.lastName}</p>
              </div>
              <div>
                <p className="text-gray-700 font-medium">Email:</p>
                <p className="text-gray-900">{placement.student.email}</p>
              </div>
              {placement.student.studentProfile?.aNumber && (
                <div>
                  <p className="text-gray-700 font-medium">ID Number:</p>
                  <p className="text-gray-900">{placement.student.studentProfile.aNumber}</p>
                </div>
              )}
              {placement.student.studentProfile && (
                <>
                  <div>
                    <p className="text-gray-700 font-medium">Program:</p>
                    <p className="text-gray-900">{placement.student.studentProfile.program}</p>
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium">Cohort:</p>
                    <p className="text-gray-900">{placement.student.studentProfile.cohort}</p>
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium">Required Hours:</p>
                    <p className="text-gray-900">{placement.student.studentProfile.requiredHours} hours</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Site Information */}
          <div className="card bg-green-50 border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
              <BuildingOfficeIcon className="h-6 w-6 mr-2 text-green-600" />
              Site Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-700 font-medium">Site Name:</p>
                <p className="text-gray-900">{placement.site.name}</p>
              </div>
              <div>
                <p className="text-gray-700 font-medium">Address:</p>
                <p className="text-gray-900">{placement.site.address}, {placement.site.city}, {placement.site.state} {placement.site.zip}</p>
              </div>
              <div>
                <p className="text-gray-700 font-medium">Contact Person:</p>
                <p className="text-gray-900">{placement.site.contactName}</p>
              </div>
              <div>
                <p className="text-gray-700 font-medium">Contact Email:</p>
                <p className="text-gray-900">{placement.site.contactEmail}</p>
              </div>
              <div>
                <p className="text-gray-700 font-medium">Contact Phone:</p>
                <p className="text-gray-900">{placement.site.contactPhone}</p>
              </div>
              <div>
                <p className="text-gray-700 font-medium">Practice Areas:</p>
                <p className="text-gray-900">{placement.site.practiceAreas}</p>
              </div>
            </div>
          </div>

          {/* Placement Details */}
          <div className="card bg-yellow-50 border-yellow-200">
            <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
              <CalendarDaysIcon className="h-6 w-6 mr-2 text-yellow-600" />
              Placement Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-700 font-medium">Start Date:</p>
                <p className="text-gray-900">{new Date(placement.startDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-700 font-medium">End Date:</p>
                <p className="text-gray-900">{new Date(placement.endDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-700 font-medium">Required Hours:</p>
                <p className="text-gray-900">{placement.requiredHoursOverride || placement.student.studentProfile?.requiredHours || 'N/A'} hours</p>
              </div>
            </div>
          </div>

          {/* Faculty Notes */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Faculty Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about your decision (optional)..."
              className="form-textarea w-full h-24"
            />
            <p className="text-sm text-gray-500 mt-2">
              These notes will be visible to the student and will be included in the placement record.
            </p>
          </div>

          {/* Error Messages */}
          {approveMutation.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">
                {approveMutation.error?.message}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
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
              onClick={() => setShowRejectionModal(true)}
              className="btn-outline text-red-600 border-red-300 hover:bg-red-50"
              disabled={isSubmitting}
            >
              <XCircleIcon className="h-4 w-4 mr-2" />
              Reject
            </button>
            <button
              type="button"
              onClick={handleApprove}
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting && approveMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Approve
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectionModal && (
        <PlacementRejectionModal
          placement={placement}
          onClose={() => setShowRejectionModal(false)}
        />
      )}
    </div>
  )
}
