'use client'

import { XMarkIcon, UserIcon, BuildingOfficeIcon, CalendarIcon, ClockIcon, AcademicCapIcon } from '@heroicons/react/24/outline'

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
      organizationName: string
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
      APPROVED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Approved' },
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      COMPLETE: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Complete' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const getComplianceChecklist = () => {
    if (!placement.complianceChecklist) return null
    
    try {
      const checklist = JSON.parse(placement.complianceChecklist)
      return checklist
    } catch {
      return null
    }
  }

  const complianceChecklist = getComplianceChecklist()

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
              {getStatusBadge(placement.status)}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Start Date</p>
                  <p className="text-gray-900">{formatDate(placement.startDate)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600">End Date</p>
                  <p className="text-gray-900">{formatDate(placement.endDate)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <ClockIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Required Hours</p>
                  <p className="text-gray-900">
                    {placement.requiredHoursOverride || placement.student.studentProfile?.requiredHours || 'Not specified'}
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
                  {placement.student.firstName} {placement.student.lastName}
                </h5>
                <p className="text-gray-600">{placement.student.email}</p>
              </div>
            </div>
            
            {placement.student.studentProfile && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">ID Number</p>
                  <p className="text-gray-900">{placement.student.studentProfile.aNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Program</p>
                  <p className="text-gray-900">{placement.student.studentProfile.program}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Cohort</p>
                  <p className="text-gray-900">{placement.student.studentProfile.cohort}</p>
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
                <h5 className="text-lg font-medium text-gray-900">{placement.site.name}</h5>
                <p className="text-gray-600">
                  {placement.site.city}, {placement.site.state} {placement.site.zip}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Address</p>
                <p className="text-gray-900">{placement.site.address}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Practice Areas</p>
                <p className="text-gray-900">{placement.site.practiceAreas}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Contact Name</p>
                <p className="text-gray-900">{placement.site.contactName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Contact Email</p>
                <p className="text-gray-900">{placement.site.contactEmail}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Contact Phone</p>
                <p className="text-gray-900">{placement.site.contactPhone}</p>
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
                  {placement.supervisor.firstName} {placement.supervisor.lastName}
                </h5>
                <p className="text-gray-600">{placement.supervisor.email}</p>
                {placement.supervisor.supervisorProfile?.title && (
                  <p className="text-sm text-gray-500">{placement.supervisor.supervisorProfile.title}</p>
                )}
              </div>
            </div>
            
            {placement.supervisor.supervisorProfile?.organizationName && (
              <div>
                <p className="text-sm font-medium text-gray-600">Organization</p>
                <p className="text-gray-900">{placement.supervisor.supervisorProfile.organizationName}</p>
              </div>
            )}
          </div>

          {/* Faculty Information */}
          {placement.faculty && (
            <div className="card">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Faculty Information</h4>
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <AcademicCapIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h5 className="text-lg font-medium text-gray-900">
                    {placement.faculty.facultyProfile?.honorific && `${placement.faculty.facultyProfile.honorific} `}{placement.faculty.firstName} {placement.faculty.lastName}
                  </h5>
                  <p className="text-gray-600">{placement.faculty.email}</p>
                  {placement.faculty.facultyProfile?.title && (
                    <p className="text-sm text-gray-500">{placement.faculty.facultyProfile.title}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Compliance Checklist */}
          {complianceChecklist && (
            <div className="card">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Compliance Checklist</h4>
              <div className="space-y-2">
                {Object.entries(complianceChecklist).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {value ? 'Complete' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
