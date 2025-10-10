'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  UserGroupIcon, 
  UserIcon,
  BuildingOfficeIcon,
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  DocumentCheckIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EditSupervisorForm } from './edit-supervisor-form'
import { DeleteSupervisorModal } from './delete-supervisor-modal'
import { ConfirmationModal } from './confirmation-modal'
import { SupervisorEvaluationsSection } from './supervisor-evaluations-section'

interface Supervisor {
  id: string
  firstName: string
  lastName: string
  email: string
  supervisorProfile?: {
    id: string
    title?: string
    licensedSW?: string
    licenseNumber?: string
    highestDegree?: string
    otherDegree?: string
    site: {
      id: string
      name: string
      active: boolean
    }
  }
  supervisorPlacements?: Array<{
    id: string
    status: string
    student: {
      id: string
      firstName: string
      lastName: string
    }
    site: {
      name: string
    }
  }>
}

interface PendingSupervisor {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  title?: string
  licensedSW?: string
  licenseNumber?: string
  highestDegree?: string
  otherDegree?: string
  status: string
  createdAt: string
  site: {
    id: string
    name: string
    active: boolean
  }
  placement: {
    id: string
    student: {
      firstName: string
      lastName: string
      email: string
    }
  }
}

export function AdminSupervisorsManagement() {
  const [searchQuery, setSearchQuery] = useState('')
  const [editingSupervisor, setEditingSupervisor] = useState<Supervisor | null>(null)
  const [deletingSupervisor, setDeletingSupervisor] = useState<Supervisor | null>(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [selectedSupervisorForEmail, setSelectedSupervisorForEmail] = useState<Supervisor | null>(null)
  const queryClient = useQueryClient()

  const { data: data, isLoading, error } = useQuery({
    queryKey: ['admin-supervisors'],
    queryFn: async () => {
      const response = await fetch('/api/admin/supervisors')
      if (!response.ok) throw new Error('Failed to fetch supervisors')
      return response.json()
    },
  })

  const supervisors = data?.supervisors || []
  const pendingSupervisors = data?.pendingSupervisors || []

  const deleteMutation = useMutation({
    mutationFn: async (supervisorId: string) => {
      const response = await fetch(`/api/admin/supervisors/${supervisorId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete supervisor')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-supervisors'] })
      setDeletingSupervisor(null)
    },
    onError: (error) => {
      alert(error.message)
    },
  })

  const approvePendingSupervisorMutation = useMutation({
    mutationFn: async (pendingSupervisorId: string) => {
      const response = await fetch(`/api/pending-supervisors/${pendingSupervisorId}/approve`, {
        method: 'POST',
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to approve supervisor')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-supervisors'] })
      queryClient.invalidateQueries({ queryKey: ['faculty-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['placements'] })
    },
    onError: (error) => {
      alert(error.message)
    },
  })

  const rejectPendingSupervisorMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await fetch(`/api/pending-supervisors/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reject supervisor')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-supervisors'] })
      queryClient.invalidateQueries({ queryKey: ['faculty-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['placements'] })
    },
    onError: (error) => {
      alert(error.message)
    },
  })

  const handleDelete = (supervisor: Supervisor) => {
    setDeletingSupervisor(supervisor)
  }

  const handleEmailClick = (supervisor: Supervisor) => {
    const subject = encodeURIComponent('Field Placement Communication')
    const body = encodeURIComponent(`Dear ${supervisor.firstName},

I hope this message finds you well. I wanted to reach out regarding our field placement program and the students under your supervision.

Thank you for your continued dedication to mentoring our social work students. Your guidance and expertise are invaluable to their professional development.

Please let me know if you have any questions or need any assistance.

Best regards,
[Your Name]`)
    
    const mailtoLink = `mailto:${supervisor.email}?subject=${subject}&body=${body}`
    window.open(mailtoLink, '_blank')
  }

  const cancelEmailModal = () => {
    setShowEmailModal(false)
    setSelectedSupervisorForEmail(null)
  }

  const handleApprovePendingSupervisor = (pendingSupervisor: PendingSupervisor) => {
    approvePendingSupervisorMutation.mutate(pendingSupervisor.id)
  }

  const handleRejectPendingSupervisor = (pendingSupervisor: PendingSupervisor) => {
    const reason = prompt('Please provide a reason for rejection:')
    if (reason && reason.trim()) {
      rejectPendingSupervisorMutation.mutate({
        id: pendingSupervisor.id,
        reason: reason.trim()
      })
    }
  }

  const filteredSupervisors = supervisors?.filter((supervisor: Supervisor) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      supervisor.firstName.toLowerCase().includes(searchLower) ||
      supervisor.lastName.toLowerCase().includes(searchLower) ||
      supervisor.email.toLowerCase().includes(searchLower) ||
      supervisor.supervisorProfile?.site?.name?.toLowerCase().includes(searchLower) ||
      supervisor.supervisorProfile?.title?.toLowerCase().includes(searchLower)
    )
  }) || []

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
          <p className="text-red-600">Error loading supervisors: {error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Field Supervisor Management</h1>
        <p className="text-gray-600">View and manage field supervisors</p>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <input
            type="text"
            placeholder="Search field supervisors by name, email, or organization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Field Supervisors</p>
              <p className="text-2xl font-bold text-gray-900">{supervisors?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-gray-900">{pendingSupervisors?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <UserIcon className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">With Placements</p>
              <p className="text-2xl font-bold text-gray-900">
                {supervisors?.filter((s: Supervisor) => s.supervisorPlacements && s.supervisorPlacements.length > 0).length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <BuildingOfficeIcon className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Active Placements</p>
              <p className="text-2xl font-bold text-gray-900">
                {supervisors?.reduce((total: number, s: Supervisor) => 
                  total + (s.supervisorPlacements?.filter(p => p.status === 'ACTIVE').length || 0), 0) || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Supervisors Section */}
      {pendingSupervisors.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Pending Supervisor Approvals</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              {pendingSupervisors.length} waiting
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingSupervisors.map((pendingSupervisor: PendingSupervisor) => (
              <div key={pendingSupervisor.id} className="card border-orange-200 bg-orange-50">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <ClockIcon className="h-10 w-10 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {pendingSupervisor.firstName} {pendingSupervisor.lastName}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">{pendingSupervisor.email}</p>
                    
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Site:</span> {pendingSupervisor.site.name}
                      </p>
                      {pendingSupervisor.title && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Title:</span> {pendingSupervisor.title}
                        </p>
                      )}
                      {pendingSupervisor.licensedSW && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Licensed SW:</span> {pendingSupervisor.licensedSW}
                          {pendingSupervisor.licensedSW === 'YES' && pendingSupervisor.licenseNumber && (
                            <span className="ml-1">({pendingSupervisor.licenseNumber})</span>
                          )}
                        </p>
                      )}
                      {pendingSupervisor.highestDegree && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Degree:</span> {pendingSupervisor.highestDegree}
                          {pendingSupervisor.highestDegree === 'OTHER' && pendingSupervisor.otherDegree && (
                            <span className="ml-1">({pendingSupervisor.otherDegree})</span>
                          )}
                        </p>
                      )}
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Requested by:</span> {pendingSupervisor.placement.student.firstName} {pendingSupervisor.placement.student.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        Requested: {new Date(pendingSupervisor.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-orange-200">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApprovePendingSupervisor(pendingSupervisor)}
                      disabled={approvePendingSupervisorMutation.isPending}
                      className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {approvePendingSupervisorMutation.isPending ? (
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
                    <button
                      onClick={() => handleRejectPendingSupervisor(pendingSupervisor)}
                      disabled={rejectPendingSupervisorMutation.isPending}
                      className="flex-1 btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {rejectPendingSupervisorMutation.isPending ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Rejecting...
                        </>
                      ) : (
                        <>
                          <XMarkIcon className="h-4 w-4 mr-2" />
                          Reject
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Approved Supervisors Section */}
      {supervisors.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Approved Supervisors</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSupervisors.map((supervisor: Supervisor) => (
          <div key={supervisor.id} className="card">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-10 w-10 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {supervisor.firstName} {supervisor.lastName}
                </h3>
                <p className="text-sm text-gray-600 truncate">{supervisor.email}</p>
                
                {supervisor.supervisorProfile && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Site:</span> {supervisor.supervisorProfile.site.name}
                    </p>
                    {supervisor.supervisorProfile.title && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Title:</span> {supervisor.supervisorProfile.title}
                      </p>
                    )}
                    {supervisor.supervisorProfile.licensedSW && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Licensed SW:</span> {supervisor.supervisorProfile.licensedSW}
                        {supervisor.supervisorProfile.licensedSW === 'YES' && supervisor.supervisorProfile.licenseNumber && (
                          <span className="ml-1">({supervisor.supervisorProfile.licenseNumber})</span>
                        )}
                      </p>
                    )}
                    {supervisor.supervisorProfile.highestDegree && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Degree:</span> {supervisor.supervisorProfile.highestDegree}
                        {supervisor.supervisorProfile.highestDegree === 'OTHER' && supervisor.supervisorProfile.otherDegree && (
                          <span className="ml-1">({supervisor.supervisorProfile.otherDegree})</span>
                        )}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {supervisor.supervisorPlacements?.length || 0}
                      </p>
                      <p className="text-gray-600">Total Placements</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {supervisor.supervisorPlacements?.filter(p => p.status === 'ACTIVE').length || 0}
                      </p>
                      <p className="text-gray-600">Active</p>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEmailClick(supervisor)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                    title="Send email to supervisor"
                  >
                    <EnvelopeIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditingSupervisor(supervisor)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Edit Supervisor"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(supervisor)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Delete Supervisor"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Current Students */}
            {supervisor.supervisorPlacements && supervisor.supervisorPlacements.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Current Students</h4>
                <div className="space-y-1">
                  {supervisor.supervisorPlacements.slice(0, 3).map((placement) => (
                    <div key={placement.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">
                        {placement.student.firstName} {placement.student.lastName}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        placement.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800'
                          : placement.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : placement.status === 'APPROVED_PENDING_CHECKLIST'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {placement.status === 'APPROVED_PENDING_CHECKLIST' ? 'Approved' : placement.status}
                      </span>
                    </div>
                  ))}
                  {supervisor.supervisorPlacements.length > 3 && (
                    <p className="text-xs text-gray-500">
                      +{supervisor.supervisorPlacements.length - 3} more
                    </p>
                  )}
                </div>
                
                {/* Evaluations Section */}
                <SupervisorEvaluationsSection supervisorId={supervisor.id} />
              </div>
            )}
          </div>
        ))}
          </div>
        </>
      )}

      {supervisors.length === 0 && pendingSupervisors.length === 0 && (
        <div className="card text-center py-8">
          <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Field Supervisors Found</h3>
          <p className="text-gray-600">
            {searchQuery 
              ? 'Try adjusting your search criteria.'
              : 'No supervisors have been added to the system yet.'
            }
          </p>
        </div>
      )}

      {/* Edit Supervisor Form Modal */}
      {editingSupervisor && (
        <EditSupervisorForm 
          supervisor={editingSupervisor} 
          onClose={() => setEditingSupervisor(null)} 
        />
      )}

      {/* Delete Supervisor Confirmation Modal */}
      {deletingSupervisor && (
        <DeleteSupervisorModal 
          supervisor={deletingSupervisor} 
          onClose={() => setDeletingSupervisor(null)}
          onConfirm={() => deleteMutation.mutate(deletingSupervisor.id)}
          isDeleting={deleteMutation.isPending}
        />
      )}

    </div>
  )
}
