'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { XMarkIcon, UserIcon, BuildingOfficeIcon, CalendarIcon, ClockIcon, AcademicCapIcon, DocumentTextIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

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
  supervisor: {
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
      honorific?: string
    }
  }
}

interface PlacementDetailsModalProps {
  placement: Placement
  onClose: () => void
}

export function PlacementDetailsModal({ placement, onClose }: PlacementDetailsModalProps) {
  // Fetch fresh placement data
  const { data: freshPlacement, isLoading: placementLoading } = useQuery({
    queryKey: ['placement', placement.id],
    queryFn: async () => {
      const response = await fetch(`/api/placements/${placement.id}`)
      if (!response.ok) throw new Error('Failed to fetch placement')
      return response.json()
    },
    initialData: placement,
    staleTime: 0, // Always consider data stale
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gains focus
  })

  // Fetch student forms for this placement
  const { data: studentForms, isLoading: formsLoading } = useQuery({
    queryKey: ['placement-forms', placement.id],
    queryFn: async () => {
      const response = await fetch(`/api/placements/${placement.id}/forms`)
      if (!response.ok) throw new Error('Failed to fetch student forms')
      return response.json()
    },
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      APPROVED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active Placement' },
      APPROVED_PENDING_CHECKLIST: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active Placement' },
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active Placement' },
      COMPLETE: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Complete' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const getFormStatusIcon = (form: any) => {
    // Handle uploaded documents
    if (form.type === 'UPLOADED_DOCUMENT') {
      return <CheckCircleIcon className="h-5 w-5 text-green-600" />
    }
    
    // Handle form submissions
    switch (form.status) {
      case 'APPROVED':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'SUBMITTED':
        return <ClockIcon className="h-5 w-5 text-blue-600" />
      case 'DRAFT':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />
      case 'REJECTED':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600" />
    }
  }

  const getFormStatusBadge = (form: any) => {
    // Handle uploaded documents
    if (form.type === 'UPLOADED_DOCUMENT') {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          Uploaded
        </span>
      )
    }
    
    // Handle form submissions
    const statusClasses = {
      APPROVED: 'bg-green-100 text-green-800',
      SUBMITTED: 'bg-blue-100 text-blue-800',
      DRAFT: 'bg-yellow-100 text-yellow-800',
      REJECTED: 'bg-red-100 text-red-800',
    }
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[form.status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
        {form.status}
      </span>
    )
  }

  if (placementLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl">
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
            <span className="ml-2 text-gray-600">Loading placement details...</span>
          </div>
        </div>
      </div>
    )
  }

  const currentPlacement = freshPlacement || placement


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Placement Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status and Overview */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Placement Overview</h3>
              {getStatusBadge(currentPlacement.status)}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Start Date</p>
                  <p className="text-gray-900">{formatDate(currentPlacement.startDate)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600">End Date</p>
                  <p className="text-gray-900">{formatDate(currentPlacement.endDate)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <ClockIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Required Hours</p>
                  <p className="text-gray-900">
                    {currentPlacement.requiredHoursOverride || currentPlacement.student.studentProfile?.requiredHours || 'Not specified'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Student Information */}
          <div className="card">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h4>
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h5 className="text-lg font-medium text-gray-900">
                  {currentPlacement.student.firstName} {currentPlacement.student.lastName}
                </h5>
                <p className="text-gray-600">{currentPlacement.student.email}</p>
              </div>
            </div>
            
            {currentPlacement.student.studentProfile && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">ID Number</p>
                  <p className="text-gray-900">{currentPlacement.student.studentProfile.aNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Program</p>
                  <p className="text-gray-900">{currentPlacement.student.studentProfile.program}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Cohort</p>
                  <p className="text-gray-900">{currentPlacement.student.studentProfile.cohort}</p>
                </div>
              </div>
            )}
          </div>

          {/* Site Information */}
          <div className="card">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Site Information</h4>
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h5 className="text-lg font-medium text-gray-900">{currentPlacement.site.name}</h5>
                <p className="text-gray-600">
                  {currentPlacement.site.city}, {currentPlacement.site.state} {currentPlacement.site.zip}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Address</p>
                <p className="text-gray-900">{currentPlacement.site.address}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Practice Areas</p>
                <p className="text-gray-900">{currentPlacement.site.practiceAreas}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Contact Name</p>
                <p className="text-gray-900">{currentPlacement.site.contactName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Contact Email</p>
                <p className="text-gray-900">{currentPlacement.site.contactEmail}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Contact Phone</p>
                <p className="text-gray-900">{currentPlacement.site.contactPhone}</p>
              </div>
            </div>
          </div>

          {/* Supervisor Information */}
          <div className="card">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Supervisor Information</h4>
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h5 className="text-lg font-medium text-gray-900">
                  {currentPlacement.supervisor.firstName} {currentPlacement.supervisor.lastName}
                </h5>
                <p className="text-gray-600">{currentPlacement.supervisor.email}</p>
                {currentPlacement.supervisor.supervisorProfile?.title && (
                  <p className="text-sm text-gray-500">{currentPlacement.supervisor.supervisorProfile.title}</p>
                )}
              </div>
            </div>
            
            {currentPlacement.supervisor.supervisorProfile?.site?.name && (
              <div>
                <p className="text-sm font-medium text-gray-600">Organization</p>
                <p className="text-gray-900">{currentPlacement.supervisor.supervisorProfile.site.name}</p>
              </div>
            )}
          </div>

          {/* Faculty Information */}
          {currentPlacement.faculty && (
            <div className="card">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Faculty Information</h4>
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <AcademicCapIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h5 className="text-lg font-medium text-gray-900">
                    {currentPlacement.faculty.facultyProfile?.honorific && `${currentPlacement.faculty.facultyProfile.honorific} `}{currentPlacement.faculty.firstName} {currentPlacement.faculty.lastName}
                  </h5>
                  <p className="text-gray-600">{currentPlacement.faculty.email}</p>
                  {currentPlacement.faculty.facultyProfile?.title && (
                    <p className="text-sm text-gray-500">{currentPlacement.faculty.facultyProfile.title}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Student Forms */}
          <div className="card">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Student Forms & Documents</h4>
            {formsLoading ? (
              <div className="flex items-center justify-center py-4">
                <LoadingSpinner size="sm" />
                <span className="ml-2 text-gray-600">Loading forms...</span>
              </div>
            ) : studentForms && studentForms.length > 0 ? (
              <div className="space-y-3">
                {studentForms.map((form: any) => (
                  <div key={form.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getFormStatusIcon(form)}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{form.template?.title || form.title}</p>
                        <p className="text-xs text-gray-500">
                          {form.placement?.site?.name || 'Unknown Site'} • 
                          {form.createdAt ? new Date(form.createdAt).toLocaleDateString() : form.uploadedAt ? new Date(form.uploadedAt).toLocaleDateString() : 'Unknown Date'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getFormStatusBadge(form)}
                      {form.documentPath && (
                        <a
                          href={`/api/uploads/${form.documentPath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <DocumentTextIcon className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No forms submitted yet</p>
                <p className="text-sm text-gray-400">Student forms will appear here once submitted</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
