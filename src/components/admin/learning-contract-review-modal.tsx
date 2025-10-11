'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { XMarkIcon, DocumentTextIcon, UserIcon, BuildingOfficeIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface LearningContract {
  id: string
  token: string
  status: 'PENDING' | 'SENT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'
  sentToEmail: string
  sentToName?: string
  submittedAt?: string
  approvedAt?: string
  approvedBy?: string
  agencyEmail: string
  agencyName: string
  agencyAddress: string
  agencyCity: string
  agencyState: string
  agencyZip: string
  agencyTelephone: string
  agencyDirector: string
  fieldInstructorName?: string
  fieldInstructorFirstName?: string
  fieldInstructorLastName?: string
  fieldInstructorDegree?: string
  fieldInstructorLicense?: string
  fieldInstructorLicenseType?: string
  fieldInstructorResume?: string
  resourcesAvailable?: string
  servicesProvided?: string
  learningPlan?: string
  learningOpportunities?: string
  supervisionArrangement?: string
  instructionMethods?: string
  orientationArrangements?: string
  specialRequirements?: string
  handicapAccommodations?: string
  handicapAccommodationsDetails?: string
  promotionalMaterials?: string
  comments?: string
  completedByName?: string
  completedByTitle?: string
  createdAt: string
  updatedAt: string
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
  approver?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

interface LearningContractReviewModalProps {
  contract: LearningContract
  onClose: () => void
}

export function LearningContractReviewModal({ contract, onClose }: LearningContractReviewModalProps) {
  const [isApproving, setIsApproving] = useState(false)
  const queryClient = useQueryClient()

  console.log('LearningContractReviewModal rendered with contract:', contract)

  const approveContractMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/sites/${contract.site.id}/final-approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to approve agency application')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
      queryClient.invalidateQueries({ queryKey: ['learning-contracts'] })
      onClose()
    },
  })

  const handleApprove = () => {
    setIsApproving(true)
    approveContractMutation.mutate()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Agency Application Review
                </h3>
                <p className="text-sm text-gray-600">
                  {contract.agencyName}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                REVIEW
              </span>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            {/* Agency Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <BuildingOfficeIcon className="h-5 w-5 text-gray-600" />
                <h4 className="text-lg font-semibold text-gray-900">Agency Information</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Name:</strong> {contract.agencyName}</p>
                  <p><strong>Director:</strong> {contract.agencyDirector}</p>
                  <p><strong>Email:</strong> {contract.agencyEmail}</p>
                  <p><strong>Phone:</strong> {contract.agencyTelephone}</p>
                </div>
                <div>
                  <p><strong>Address:</strong> {contract.agencyAddress}</p>
                  <p><strong>City, State ZIP:</strong> {contract.agencyCity}, {contract.agencyState} {contract.agencyZip}</p>
                </div>
              </div>
            </div>

            {/* Practicum Instructor Information */}
            {contract.fieldInstructorName && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <UserIcon className="h-5 w-5 text-gray-600" />
                  <h4 className="text-lg font-semibold text-gray-900">Practicum Instructor Information</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Name:</strong> {contract.fieldInstructorName}</p>
                    <p><strong>First Name:</strong> {contract.fieldInstructorFirstName || 'N/A'}</p>
                    <p><strong>Last Name:</strong> {contract.fieldInstructorLastName || 'N/A'}</p>
                    <p><strong>Degree:</strong> {contract.fieldInstructorDegree || 'N/A'}</p>
                  </div>
                  <div>
                    <p><strong>License:</strong> {contract.fieldInstructorLicense || 'N/A'}</p>
                    <p><strong>License Type:</strong> {contract.fieldInstructorLicenseType || 'N/A'}</p>
                    {contract.fieldInstructorResume && (
                      <p><strong>Resume:</strong> <a href={contract.fieldInstructorResume} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">View Resume</a></p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Program Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Program Information</h4>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-medium text-gray-900">Resources Available:</p>
                  <p className="text-gray-700">{contract.resourcesAvailable || 'Not specified'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Services Provided:</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{contract.servicesProvided || 'Not specified'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Learning Plan:</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{contract.learningPlan || 'Not specified'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Learning Opportunities:</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{contract.learningOpportunities || 'Not specified'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Supervision Arrangement:</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{contract.supervisionArrangement || 'Not specified'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Instruction Methods:</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{contract.instructionMethods || 'Not specified'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Orientation Arrangements:</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{contract.orientationArrangements || 'Not specified'}</p>
                </div>
                {contract.specialRequirements && (
                  <div>
                    <p className="font-medium text-gray-900">Special Requirements:</p>
                    <p className="text-gray-700 whitespace-pre-wrap">{contract.specialRequirements}</p>
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">Handicap Accommodations:</p>
                  <p className="text-gray-700">{contract.handicapAccommodations || 'Not specified'}</p>
                  {contract.handicapAccommodationsDetails && (
                    <p className="text-gray-700 mt-1 whitespace-pre-wrap">{contract.handicapAccommodationsDetails}</p>
                  )}
                </div>
                {contract.comments && (
                  <div>
                    <p className="font-medium text-gray-900">Comments:</p>
                    <p className="text-gray-700 whitespace-pre-wrap">{contract.comments}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Application Completion */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Application Completion</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Completed By:</strong> {contract.completedByName || 'Not specified'}</p>
                  <p><strong>Title:</strong> {contract.completedByTitle || 'Not specified'}</p>
                </div>
                <div>
                  <p><strong>Submitted At:</strong> {contract.submittedAt 
                    ? new Date(contract.submittedAt).toLocaleString()
                    : 'Not submitted'
                  }</p>
                </div>
              </div>
            </div>

            {/* Promotional Materials */}
            {contract.promotionalMaterials && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Promotional Materials</h4>
                <p className="text-sm">
                  <a 
                    href={`/api/files/${encodeURIComponent(contract.promotionalMaterials)}`} 
                    className="text-blue-600 hover:underline" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    View Promotional Materials
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                console.log('Approve button clicked!')
                handleApprove()
              }}
              disabled={approveContractMutation.isPending || isApproving}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {approveContractMutation.isPending || isApproving ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Approving...</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>Approve Agency Application</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
