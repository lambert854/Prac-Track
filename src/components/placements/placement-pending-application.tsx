'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DocumentArrowDownIcon, DocumentArrowUpIcon, EyeIcon, TrashIcon } from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface PlacementPendingApplicationProps {
  placementId: string
  userRole: 'ADMIN' | 'FACULTY' | 'SUPERVISOR' | 'STUDENT'
}

interface Placement {
  id: string
  startDate: string
  endDate: string
  requiredHours: number
  term: string
  status: string
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
  student: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  supervisor?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  pendingSupervisor?: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
    title?: string
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
  }
  cellPolicy?: string
  learningContract?: string
  checklist?: string
}

export function PlacementPendingApplication({ placementId, userRole }: PlacementPendingApplicationProps) {
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: placement, isLoading, error } = useQuery<Placement>({
    queryKey: ['placement', placementId],
    queryFn: async () => {
      const response = await fetch(`/api/placements/${placementId}`, {
        credentials: 'include'
      })
      if (!response.ok) {
        throw new Error('Failed to fetch placement')
      }
      return response.json()
    },
  })

  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ docType, file }: { docType: string; file: File }) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('docType', docType)

      const response = await fetch(`/api/placements/${placementId}/documents`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload document')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['placement', placementId] })
      // TODO: Send notification to faculty when documents are uploaded
      setUploadingDoc(null)
    },
    onError: () => {
      setUploadingDoc(null)
    },
  })

  const deleteDocumentMutation = useMutation({
    mutationFn: async (docType: string) => {
      const response = await fetch(`/api/placements/${placementId}/documents?docType=${docType}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete document')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['placement', placementId] })
    },
  })

  const approvePlacementMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/placements/${placementId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to approve placement')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['placement', placementId] })
      // TODO: Send notification to student when application is approved
      window.location.reload() // Refresh to show new status
    },
  })

  const rejectPlacementMutation = useMutation({
    mutationFn: async ({ reason }: { reason: string }) => {
      const response = await fetch(`/api/placements/${placementId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reject placement')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['placement', placementId] })
      // TODO: Send notification to student when application is rejected
      window.location.reload() // Refresh to show new status
    },
  })

  const activatePlacementMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/placements/${placementId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to complete approval')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['placement', placementId] })
      // TODO: Send notification to student when placement is activated
      window.location.reload() // Refresh to show new status
    },
  })

  const handleFileUpload = (docType: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadingDoc(docType)
      uploadDocumentMutation.mutate({ docType, file })
    }
  }

  const handleDeleteDocument = (docType: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      deleteDocumentMutation.mutate(docType)
    }
  }

  const downloadTemplate = (filename: string) => {
    window.open(`/api/documents/template/${filename}`, '_blank')
  }

  const viewDocument = (docPath: string) => {
    window.open(`/api/documents/${docPath}`, '_blank')
  }

  const approvePendingSupervisorMutation = useMutation({
    mutationFn: async (pendingSupervisorId: string) => {
      const response = await fetch(`/api/pending-supervisors/${pendingSupervisorId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to approve supervisor')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['placement', placementId] })
      // TODO: Send notification to supervisor when approved
    },
  })

  const rejectPendingSupervisorMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string, reason: string }) => {
      const response = await fetch(`/api/pending-supervisors/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reject supervisor')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['placement', placementId] })
      // TODO: Send notification to student when supervisor is rejected
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !placement) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-600">Error loading placement: {error?.message}</p>
      </div>
    )
  }

  const isStudent = userRole === 'STUDENT'
  const isFaculty = userRole === 'FACULTY' || userRole === 'ADMIN'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Placement Application - {placement.site.name}
        </h1>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            placement.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
            placement.status === 'APPROVED_PENDING_CHECKLIST' ? 'bg-green-100 text-green-800' :
            placement.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {placement.status === 'PENDING' ? 'Pending Review' : 'Approved'}
          </span>
          <span>Student: {placement.student.firstName} {placement.student.lastName}</span>
          <span>Term: {placement.term.replace('_', ' ')}</span>
          <span>Hours: {placement.requiredHours}</span>
        </div>
      </div>

      {/* Site Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Site Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>Name:</strong> {placement.site.name}</p>
            <p><strong>Address:</strong> {placement.site.address}</p>
            <p><strong>City:</strong> {placement.site.city}, {placement.site.state} {placement.site.zip}</p>
          </div>
          <div>
            <p><strong>Contact:</strong> {placement.site.contactName}</p>
            <p><strong>Email:</strong> {placement.site.contactEmail}</p>
            <p><strong>Phone:</strong> {placement.site.contactPhone}</p>
            <p><strong>Practice Areas:</strong> {placement.site.practiceAreas}</p>
          </div>
        </div>
      </div>

      {/* Supervisor Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Supervisor Information</h2>
        {placement.supervisor ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Name:</strong> {placement.supervisor.firstName} {placement.supervisor.lastName}</p>
              <p><strong>Email:</strong> {placement.supervisor.email}</p>
            </div>
            <div>
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                Assigned Supervisor
              </span>
            </div>
          </div>
        ) : placement.pendingSupervisor ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Name:</strong> {placement.pendingSupervisor.firstName} {placement.pendingSupervisor.lastName}</p>
                <p><strong>Email:</strong> {placement.pendingSupervisor.email}</p>
                {placement.pendingSupervisor.phone && (
                  <p><strong>Phone:</strong> {placement.pendingSupervisor.phone}</p>
                )}
                {placement.pendingSupervisor.title && (
                  <p><strong>Title:</strong> {placement.pendingSupervisor.title}</p>
                )}
              </div>
              <div className="flex items-start">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  placement.pendingSupervisor.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  placement.pendingSupervisor.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {placement.pendingSupervisor.status === 'PENDING' ? 'Pending Approval' :
                   placement.pendingSupervisor.status === 'APPROVED' ? 'Approved' : 'Rejected'}
                </span>
              </div>
            </div>
            
            {placement.pendingSupervisor.status === 'PENDING' && isFaculty && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-3">
                  This supervisor was requested by the student and requires your approval before they can access the system.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => approvePendingSupervisorMutation.mutate(placement.pendingSupervisor!.id)}
                    disabled={approvePendingSupervisorMutation.isPending}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {approvePendingSupervisorMutation.isPending ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Approving...
                      </>
                    ) : (
                      'Approve Supervisor'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Please provide a reason for rejection:')
                      if (reason && reason.trim()) {
                        rejectPendingSupervisorMutation.mutate({
                          id: placement.pendingSupervisor!.id,
                          reason: reason.trim()
                        })
                      }
                    }}
                    disabled={rejectPendingSupervisorMutation.isPending}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {rejectPendingSupervisorMutation.isPending ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Rejecting...
                      </>
                    ) : (
                      'Reject Supervisor'
                    )}
                  </button>
                </div>
                {(approvePendingSupervisorMutation.error || rejectPendingSupervisorMutation.error) && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                    <p className="text-red-600 text-sm">
                      {approvePendingSupervisorMutation.error?.message || rejectPendingSupervisorMutation.error?.message}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-600">
            <p>No supervisor assigned to this placement.</p>
          </div>
        )}
      </div>

      {/* Document Requirements */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Required Documents</h2>
        
        {/* Cell Phone Policy */}
        <div className="border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">Cell Phone Usage, Confidentiality, Alcohol/Drug Use, and Safety Policy</h3>
            <div className="flex items-center space-x-2">
              {placement.cellPolicy ? (
                <>
                  <button
                    onClick={() => viewDocument(placement.cellPolicy!)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="View uploaded document"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                  {isStudent && (
                    <button
                      onClick={() => handleDeleteDocument('cellPolicy')}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete document"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                  <span className="text-green-600 text-sm font-medium">✓ Uploaded</span>
                </>
              ) : (
                <span className="text-red-600 text-sm font-medium">✗ Required</span>
              )}
            </div>
          </div>
          
          {isStudent && (
            <div className="flex items-center space-x-4">
              <button
                onClick={() => downloadTemplate('CELL.pdf')}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
              >
                <DocumentArrowDownIcon className="h-5 w-5" />
                <span>Download Template</span>
              </button>
              
              <label className="flex items-center space-x-2 text-green-600 hover:text-green-800 cursor-pointer">
                <DocumentArrowUpIcon className="h-5 w-5" />
                <span>Upload Signed Document</span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileUpload('cellPolicy', e)}
                  className="hidden"
                  disabled={uploadingDoc === 'cellPolicy'}
                />
              </label>
              
              {uploadingDoc === 'cellPolicy' && (
                <LoadingSpinner size="sm" />
              )}
            </div>
          )}
        </div>

        {/* Learning Contract */}
        <div className="border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-gray-900">Student Learning Contract</h3>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Due according to your syllabus
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {placement.learningContract ? (
                <>
                  <button
                    onClick={() => viewDocument(placement.learningContract!)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="View uploaded document"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                  {isStudent && (
                    <button
                      onClick={() => handleDeleteDocument('learningContract')}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete document"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                  <span className="text-green-600 text-sm font-medium">✓ Uploaded</span>
                </>
              ) : (
                <span className="text-red-600 text-sm font-medium">✗ Required</span>
              )}
            </div>
          </div>
          
          {isStudent && (
            <div className="flex items-center space-x-4">
              <button
                onClick={() => downloadTemplate('LC.pdf')}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
              >
                <DocumentArrowDownIcon className="h-5 w-5" />
                <span>Download Template</span>
              </button>
              
              <label className="flex items-center space-x-2 text-green-600 hover:text-green-800 cursor-pointer">
                <DocumentArrowUpIcon className="h-5 w-5" />
                <span>Upload Signed Document</span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileUpload('learningContract', e)}
                  className="hidden"
                  disabled={uploadingDoc === 'learningContract'}
                />
              </label>
              
              {uploadingDoc === 'learningContract' && (
                <LoadingSpinner size="sm" />
              )}
            </div>
          )}
        </div>

        {/* Checklist (show if approved or active) */}
        {(placement.status === 'APPROVED_PENDING_CHECKLIST' || placement.status === 'ACTIVE') && (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-gray-900">Placement Checklist</h3>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Due Week 2
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {placement.checklist ? (
                  <>
                    <button
                      onClick={() => viewDocument(placement.checklist!)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="View uploaded document"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    {isStudent && (
                      <button
                        onClick={() => handleDeleteDocument('checklist')}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete document"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                    <span className="text-green-600 text-sm font-medium">✓ Uploaded</span>
                  </>
                ) : (
                  <span className="text-red-600 text-sm font-medium">✗ Required</span>
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">
              This checklist must be completed and signed by both the student and supervisor within the first 2 weeks of placement.
            </p>
            
            {isStudent && (
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => downloadTemplate('CHECKLIST.pdf')}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                >
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  <span>Download Checklist</span>
                </button>
                
                <label className="flex items-center space-x-2 text-green-600 hover:text-green-800 cursor-pointer">
                  <DocumentArrowUpIcon className="h-5 w-5" />
                  <span>Upload Completed Checklist</span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileUpload('checklist', e)}
                    className="hidden"
                    disabled={uploadingDoc === 'checklist'}
                  />
                </label>
                
                {uploadingDoc === 'checklist' && (
                  <LoadingSpinner size="sm" />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Faculty Actions */}
      {isFaculty && placement.status === 'PENDING' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Faculty Actions</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => approvePlacementMutation.mutate()}
              disabled={!placement.cellPolicy || approvePlacementMutation.isPending}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {approvePlacementMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Approving...
                </>
              ) : (
                'Approve Application'
              )}
            </button>
            <button
              onClick={() => {
                const reason = prompt('Please provide a reason for rejection:')
                if (reason && reason.trim()) {
                  rejectPlacementMutation.mutate({ reason: reason.trim() })
                }
              }}
              disabled={rejectPlacementMutation.isPending}
              className="btn-outline text-red-600 border-red-600 hover:bg-red-50 flex items-center"
            >
              {rejectPlacementMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Rejecting...
                </>
              ) : (
                'Reject Application'
              )}
            </button>
          </div>
          {!placement.cellPolicy && (
            <p className="text-sm text-gray-600 mt-2">
              Cannot approve until the cell phone usage policy is uploaded.
            </p>
          )}
          {(approvePlacementMutation.error || rejectPlacementMutation.error) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
              <p className="text-red-600 text-sm">
                {approvePlacementMutation.error?.message || rejectPlacementMutation.error?.message}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Faculty Actions for Checklist Phase */}
      {isFaculty && placement.status === 'APPROVED_PENDING_CHECKLIST' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Checklist Phase - Faculty Actions</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => activatePlacementMutation.mutate()}
              disabled={activatePlacementMutation.isPending}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {activatePlacementMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Completing...
                </>
              ) : (
                'Complete Approval'
              )}
            </button>
            <button
              onClick={() => {
                const reason = prompt('Please provide a reason for rejection:')
                if (reason && reason.trim()) {
                  rejectPlacementMutation.mutate({ reason: reason.trim() })
                }
              }}
              disabled={rejectPlacementMutation.isPending}
              className="btn-outline text-red-600 border-red-600 hover:bg-red-50 flex items-center"
            >
              {rejectPlacementMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Rejecting...
                </>
              ) : (
                'Reject Placement'
              )}
            </button>
          </div>
            {(activatePlacementMutation.error || rejectPlacementMutation.error || approvePendingSupervisorMutation.error || rejectPendingSupervisorMutation.error) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                <p className="text-red-600 text-sm">
                  {activatePlacementMutation.error?.message || rejectPlacementMutation.error?.message || approvePendingSupervisorMutation.error?.message || rejectPendingSupervisorMutation.error?.message}
                </p>
              </div>
            )}
        </div>
      )}

      {/* Placement Activated Success Message */}
      {placement.status === 'ACTIVE' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-green-800">
                Approval Successful!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  The placement at {placement.site.name} has been approved. 
                  The student can now begin their practicum and start logging hours.
                </p>
                <p className="mt-2">
                  <strong>Next Steps:</strong>
                </p>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li>Student should begin logging timesheets</li>
                  <li>Supervisor will review and approve timesheets</li>
                  <li>Faculty will send out periodic evaluations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
