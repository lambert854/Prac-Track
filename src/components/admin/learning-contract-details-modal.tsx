'use client'

import { BuildingOfficeIcon, DocumentTextIcon, UserIcon, XMarkIcon } from '@heroicons/react/24/outline'

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

interface LearningContractDetailsModalProps {
  contract: LearningContract
  onClose: () => void
}

export function LearningContractDetailsModal({ contract, onClose }: LearningContractDetailsModalProps) {
  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex px-2 py-1 text-xs font-semibold rounded-full"
    switch (status) {
      case 'APPROVED':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'REJECTED':
        return `${baseClasses} bg-red-100 text-red-800`
      case 'SUBMITTED':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case 'SENT':
        return `${baseClasses} bg-blue-100 text-blue-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[95vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Agency Application Details
                </h3>
                <p className="text-sm text-gray-600">
                  {contract.agencyName}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={getStatusBadge(contract.status)}>
                {contract.status}
              </span>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          {/* Application URL */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Application URL:
                </p>
                <p className="text-sm font-mono text-blue-800 break-all">
                  {typeof window !== 'undefined' 
                    ? `${window.location.protocol}//prac-track.com/agency-learning-contract/${contract.token}`
                    : `https://prac-track.com/agency-learning-contract/${contract.token}`
                  }
                </p>
              </div>
              <button
                onClick={() => {
                  const url = typeof window !== 'undefined' 
                    ? `${window.location.protocol}//prac-track.com/agency-learning-contract/${contract.token}`
                    : `https://prac-track.com/agency-learning-contract/${contract.token}`
                  if (url) {
                    navigator.clipboard.writeText(url)
                  }
                }}
                className="ml-3 text-sm text-blue-600 hover:text-blue-700 underline"
                title="Copy URL"
              >
                Copy
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

            {/* Field Instructor Information */}
            {contract.fieldInstructorName && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <UserIcon className="h-5 w-5 text-gray-600" />
                  <h4 className="text-lg font-semibold text-gray-900">Field Instructor Information</h4>
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
                  <p><strong>Approved At:</strong> {contract.approvedAt 
                    ? new Date(contract.approvedAt).toLocaleString()
                    : 'Not approved'
                  }</p>
                </div>
              </div>
            </div>

            {/* Contract Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Contract Status</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Sent To:</strong> {contract.sentToName || 'N/A'} ({contract.sentToEmail})</p>
                  <p><strong>Created:</strong> {new Date(contract.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p><strong>Last Updated:</strong> {new Date(contract.updatedAt).toLocaleString()}</p>
                  {contract.approver && (
                    <p><strong>Approved By:</strong> {contract.approver.firstName} {contract.approver.lastName}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Promotional Materials */}
            {contract.promotionalMaterials && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Promotional Materials</h4>
                <p className="text-sm">
                  <a href={contract.promotionalMaterials} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                    View Promotional Materials
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
