'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DocumentTextIcon, EyeIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { LearningContractDetailsModal } from './learning-contract-details-modal'

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

export function LearningContractsManagement() {
  const [selectedContract, setSelectedContract] = useState<LearningContract | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data: contracts, isLoading, error } = useQuery({
    queryKey: ['learning-contracts'],
    queryFn: async () => {
      const response = await fetch('/api/admin/learning-contracts', {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch learning contracts')
      return response.json()
    },
  })

  // Client-side filtering
  const filteredContracts = contracts?.filter((contract: LearningContract) => {
    const matchesSearch = searchQuery === '' || 
      contract.agencyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.agencyEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.sentToEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.fieldInstructorName?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === '' || contract.status === statusFilter

    return matchesSearch && matchesStatus
  }) || []

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'REJECTED':
        return <XCircleIcon className="h-5 w-5 text-red-600" />
      case 'SUBMITTED':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />
      case 'SENT':
        return <ClockIcon className="h-5 w-5 text-blue-600" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />
    }
  }

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-red-600">Error loading learning contracts: {error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Learning Contracts</h1>
        <p className="text-gray-600">View and manage agency learning contracts</p>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by agency name, email, or field instructor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input w-full"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select w-full"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="SENT">Sent</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contracts List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Learning Contracts ({filteredContracts.length})
          </h2>
        </div>

        {filteredContracts.length === 0 ? (
          <div className="text-center py-8">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Learning Contracts Found</h3>
            <p className="text-gray-600">
              {searchQuery || statusFilter 
                ? 'Try adjusting your search criteria.'
                : 'No learning contracts have been created yet.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredContracts.map((contract: LearningContract) => (
              <div key={contract.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(contract.status)}
                      <h3 className="text-lg font-medium text-gray-900">{contract.agencyName}</h3>
                      <span className={getStatusBadge(contract.status)}>
                        {contract.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">
                          <strong>Sent To:</strong> {contract.sentToName || 'N/A'} ({contract.sentToEmail})
                        </p>
                        <p className="text-gray-600">
                          <strong>Field Instructor:</strong> {contract.fieldInstructorName || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">
                          <strong>Submitted:</strong> {contract.submittedAt 
                            ? new Date(contract.submittedAt).toLocaleDateString()
                            : 'Not submitted'
                          }
                        </p>
                        <p className="text-gray-600">
                          <strong>Approved:</strong> {contract.approvedAt 
                            ? new Date(contract.approvedAt).toLocaleDateString()
                            : 'Not approved'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">
                          <strong>Agency Location:</strong> {contract.agencyCity}, {contract.agencyState}
                        </p>
                        <p className="text-gray-600">
                          <strong>Created:</strong> {new Date(contract.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => setSelectedContract(contract)}
                      className="text-blue-600 hover:text-blue-900 p-2"
                      title="View details"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contract Details Modal */}
      {selectedContract && (
        <LearningContractDetailsModal
          contract={selectedContract}
          onClose={() => setSelectedContract(null)}
        />
      )}
    </div>
  )
}
