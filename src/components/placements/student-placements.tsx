'use client'

import { useQuery } from '@tanstack/react-query'
import { MapPinIcon, CalendarIcon, UserIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface Placement {
  id: string
  startDate: string
  endDate: string
  status: string
  requiredHoursOverride?: number
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
    supervisorProfile?: {
      organizationName: string
    }
  }
  faculty: {
    id: string
    firstName: string
    lastName: string
    facultyProfile?: {
      title?: string
      honorific?: string
    }
  }
}

export function StudentPlacements() {
  console.log('StudentPlacements: Component is rendering')
  
  const { data: placements, isLoading, error } = useQuery({
    queryKey: ['placements'],
    queryFn: async () => {
      const response = await fetch('/api/placements')
      if (!response.ok) throw new Error('Failed to fetch placements')
      return response.json()
    },
  })

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      APPROVED_PENDING_CHECKLIST: 'bg-blue-100 text-blue-800',
      ACTIVE: 'bg-green-100 text-green-800',
      COMPLETE: 'bg-purple-100 text-purple-800',
      ARCHIVED: 'bg-gray-100 text-gray-800 border border-gray-200',
    }
    
    const statusLabels = {
      DRAFT: 'Draft',
      PENDING: 'Pending',
      APPROVED: 'Approved',
      APPROVED_PENDING_CHECKLIST: 'Approved',
      ACTIVE: 'Active',
      COMPLETE: 'Complete',
      DECLINED: 'Declined',
      ARCHIVED: 'Archived'
    }
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status as keyof typeof statusLabels] || status}
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
        <h1 className="text-2xl font-bold text-gray-900">My Placements</h1>
        <p className="text-gray-600">View your practicum placement history and current assignments</p>
      </div>

      {/* Placements */}
      {placements?.length > 0 ? (
        <div className="space-y-6">
          {placements.map((placement: Placement) => (
            <div key={placement.id} className="card">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {placement.site.name}
                    </h3>
                    {getStatusBadge(placement.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Location</p>
                          <p className="text-sm text-gray-600">
                            {placement.site.address ? (
                              <a 
                                href={`https://maps.google.com/?q=${encodeURIComponent(`${placement.site.address}, ${placement.site.city}, ${placement.site.state} ${placement.site.zip}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {placement.site.address}<br />
                                {placement.site.city}, {placement.site.state} {placement.site.zip}
                              </a>
                            ) : (
                              <>
                                {placement.site.address}<br />
                                {placement.site.city}, {placement.site.state} {placement.site.zip}
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <CalendarIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Duration</p>
                          <p className="text-sm text-gray-600">
                            {new Date(placement.startDate).toLocaleDateString()} - {new Date(placement.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start">
                        <UserIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Supervisor</p>
                          <p className="text-sm text-gray-600">
                            {placement.supervisor ? 
                              `${placement.supervisor.firstName} ${placement.supervisor.lastName}` : 
                              'Not Assigned'
                            }
                          </p>
                          {placement.supervisor?.supervisorProfile && (
                            <p className="text-xs text-gray-500">
                              {placement.supervisor.supervisorProfile.organizationName}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start">
                        <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Faculty Liaison</p>
                          <p className="text-sm text-gray-600">
                            {placement.faculty.facultyProfile?.honorific && `${placement.faculty.facultyProfile.honorific} `}
                            {placement.faculty.firstName} {placement.faculty.lastName}
                          </p>
                          {placement.faculty.facultyProfile?.title && (
                            <p className="text-xs text-gray-500">
                              {placement.faculty.facultyProfile.title}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-900 mb-1">Practice Areas</p>
                    <p className="text-sm text-gray-600">{placement.site.practiceAreas}</p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-900 mb-1">Agency Contact</p>
                    <p className="text-sm text-gray-600">
                      {placement.site.contactName}<br />
                      {placement.site.contactEmail}<br />
                      {placement.site.contactPhone}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="text-center py-8">
            <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Placements Yet</h3>
            <p className="text-gray-600 mb-4">You haven&apos;t requested any practicum placements yet.</p>
            <a href="/placements/browse" className="btn-primary">
              Browse Available Sites
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
