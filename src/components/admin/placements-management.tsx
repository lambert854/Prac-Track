'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckIcon, XMarkIcon, EyeIcon, TrashIcon } from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { PlacementDetailsModal } from './placement-details-modal'

interface Placement {
  id: string
  startDate: string
  endDate: string
  status: string
  requiredHoursOverride?: number
  complianceChecklist?: string
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
  supervisor?: {
    id: string
    firstName: string
    lastName: string
    email: string
    supervisorProfile?: {
      site: {
        name: string
      }
      title: string
    }
  }
  faculty?: {
    id: string
    firstName: string
    lastName: string
    email: string
    facultyProfile?: {
      title: string
    }
  }
}

export function PlacementsManagement() {
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedPlacement, setSelectedPlacement] = useState<Placement | null>(null)
  const [viewingPlacement, setViewingPlacement] = useState<Placement | null>(null)
  const [deletingPlacement, setDeletingPlacement] = useState<Placement | null>(null)
  const queryClient = useQueryClient()

  const { data: placements, isLoading, error } = useQuery({
    queryKey: ['placements', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      
      const response = await fetch(`/api/placements?${params}`)
      if (!response.ok) throw new Error('Failed to fetch placements')
      return response.json()
    },
  })


  const approvePlacementMutation = useMutation({
    mutationFn: async (placementId: string) => {
      const response = await fetch(`/api/placements/${placementId}/approve`, {
        method: 'PATCH',
      })
      if (!response.ok) throw new Error('Failed to approve placement')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['placements'] })
    },
  })


  const deletePlacementMutation = useMutation({
    mutationFn: async (placementId: string) => {
      const response = await fetch(`/api/placements/${placementId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete placement')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['placements'] })
      setDeletingPlacement(null)
    },
  })

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      APPROVED_PENDING_CHECKLIST: 'bg-green-100 text-green-800',
      ACTIVE: 'bg-green-100 text-green-800',
      COMPLETE: 'bg-purple-100 text-purple-800',
    }
    
    // Display text mapping
    const statusText = {
      DRAFT: 'Draft',
      PENDING: 'Pending Review',
      APPROVED: 'Approved',
      APPROVED_PENDING_CHECKLIST: 'Approved',
      ACTIVE: 'Approved',
      COMPLETE: 'Complete',
    }
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
        {statusText[status as keyof typeof statusText] || status}
      </span>
    )
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
          <p className="text-red-600">Error loading placements: {error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Placement Management</h1>
        <p className="text-gray-600">Manage practicum placement requests and assignments</p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <label htmlFor="status" className="form-label">
              Filter by Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Placements Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Site
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supervisor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {placements?.map((placement: Placement) => (
                <tr key={placement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {placement.student.firstName} {placement.student.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{placement.student.email}</div>
                    {placement.student.studentProfile && (
                      <div className="text-xs text-gray-400">
                        {placement.student.studentProfile.program} - {placement.student.studentProfile.cohort}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{placement.site.name}</div>
                    <div className="text-sm text-gray-500">
                      {placement.site.city}, {placement.site.state}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {placement.supervisor ? (
                      <>
                        <div className="text-sm text-gray-900">
                          {placement.supervisor.firstName} {placement.supervisor.lastName}
                        </div>
                        {placement.supervisor.supervisorProfile?.site && (
                          <div className="text-sm text-gray-500">
                            {placement.supervisor.supervisorProfile.site.name}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-gray-500 italic">No supervisor assigned</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(placement.startDate).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      to {new Date(placement.endDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(placement.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setViewingPlacement(placement)}
                        className="text-gray-600 hover:text-gray-900"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {placement.status === 'PENDING' && (
                        <button
                          onClick={() => approvePlacementMutation.mutate(placement.id)}
                          className="text-green-600 hover:text-green-900"
                          disabled={approvePlacementMutation.isPending}
                          title="Approve Placement"
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setDeletingPlacement(placement)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Placement"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {placements?.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No placements found</p>
          </div>
        )}
      </div>


      {/* Placement Details Modal */}
      {viewingPlacement && (
        <PlacementDetailsModal 
          placement={viewingPlacement} 
          onClose={() => setViewingPlacement(null)} 
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingPlacement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Delete Placement</h3>
              <button
                onClick={() => setDeletingPlacement(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete this placement? This action cannot be undone.
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900">
                  {deletingPlacement.student.firstName} {deletingPlacement.student.lastName}
                </p>
                <p className="text-sm text-gray-600">
                  {deletingPlacement.site.name}
                </p>
                <p className="text-sm text-gray-600">
                  {new Date(deletingPlacement.startDate).toLocaleDateString()} - {new Date(deletingPlacement.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            {deletePlacementMutation.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-600 text-sm">
                  {deletePlacementMutation.error.message}
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeletingPlacement(null)}
                className="btn-outline"
                disabled={deletePlacementMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={() => deletePlacementMutation.mutate(deletingPlacement.id)}
                className="btn-danger flex items-center"
                disabled={deletePlacementMutation.isPending}
              >
                {deletePlacementMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete Placement
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
