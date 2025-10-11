'use client'

import { useQuery } from '@tanstack/react-query'
import { UserGroupIcon, ClockIcon, CheckCircleIcon, ExclamationTriangleIcon, PhoneIcon, EnvelopeIcon, MapPinIcon, AcademicCapIcon } from '@heroicons/react/24/outline'

interface SupervisorStudentsProps {
  supervisorId: string
}

interface AssignedStudent {
  placementId: string
  student: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
    active: boolean
  }
  site: {
    id: string
    name: string
    address: string | null
    city: string | null
    state: string | null
    zip: string | null
  }
  faculty: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
    facultyProfile: {
      honorific: string | null
    } | null
  } | null
  status: string
  startDate: Date | null
  endDate: Date | null
  requiredHours: number | null
  totalHours: number
  pendingTimesheets: number
  lastActivity: Date | null
  recentTimesheets: Array<{
    id: string
    date: Date
    hours: number
    status: string
  }>
}

export function SupervisorStudents({ supervisorId }: SupervisorStudentsProps) {
  // Fetch assigned students
  const { data: studentsData, isLoading, error } = useQuery({
    queryKey: ['supervisor-students', supervisorId],
    queryFn: async () => {
      const response = await fetch(`/api/supervisor/${supervisorId}/students`)
      if (!response.ok) {
        throw new Error('Failed to fetch students')
      }
      return response.json()
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Not set'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'APPROVED_PENDING_CHECKLIST':
        return 'bg-blue-100 text-blue-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'ARCHIVED':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Active'
      case 'APPROVED':
        return 'Approved'
      case 'APPROVED_PENDING_CHECKLIST':
        return 'Approved - Pending Checklist'
      case 'PENDING':
        return 'Pending'
      case 'REJECTED':
        return 'Rejected'
      case 'ARCHIVED':
        return 'Completed'
      default:
        return status
    }
  }

  const getStudentStatusColor = (active: boolean) => {
    return active 
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800'
  }

  const getStudentStatusText = (active: boolean) => {
    return active ? 'Active' : 'Inactive'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Error loading students: {error.message}</p>
      </div>
    )
  }

  const students: AssignedStudent[] = studentsData?.students || []
  const totalStudents = studentsData?.totalStudents || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">My Assigned Students</h1>
        <p className="text-gray-600 mt-2">
          Students assigned to you for supervision
        </p>
        <div className="mt-4 flex items-center space-x-4">
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {totalStudents} Student{totalStudents !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Students List */}
      {students.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="text-gray-500 text-lg mt-4">No students assigned</p>
          <p className="text-gray-400 mt-2">Students assigned to you will appear here</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {students.map((student) => (
            <div key={student.placementId} className="bg-white shadow rounded-lg">
              {/* Student Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {student.student.firstName} {student.student.lastName}
                    </h3>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStudentStatusColor(student.student.active)}`}>
                        {getStudentStatusText(student.student.active)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {student.totalHours} / {student.requiredHours || 'N/A'} hours
                    </p>
                    {student.pendingTimesheets > 0 && (
                      <p className="text-sm text-orange-600 font-medium mt-1">
                        {student.pendingTimesheets} pending timesheet{student.pendingTimesheets !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Student Details */}
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Contact Information */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <UserGroupIcon className="h-4 w-4 mr-2" />
                      Contact Information
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {student.student.email}
                      </div>
                      {student.student.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                          {student.student.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Placement Information */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      Placement Details
                    </h4>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Site:</span> {student.site.name}
                      </div>
                      {student.site.address && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Address:</span> {student.site.address}
                        </div>
                      )}
                      {(student.site.city || student.site.state || student.site.zip) && (
                        <div className="text-sm text-gray-600">
                          {[student.site.city, student.site.state, student.site.zip].filter(Boolean).join(', ')}
                        </div>
                      )}
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Duration:</span> {formatDate(student.startDate)} - {formatDate(student.endDate)}
                      </div>
                    </div>
                  </div>

                  {/* Faculty Information */}
                  {student.faculty && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                        <AcademicCapIcon className="h-4 w-4 mr-2" />
                        Assigned Faculty
                      </h4>
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Name:</span> {student.faculty.facultyProfile?.honorific && `${student.faculty.facultyProfile.honorific} `}{student.faculty.firstName} {student.faculty.lastName}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                          {student.faculty.email}
                        </div>
                        {student.faculty.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                            {student.faculty.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Progress Summary */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      Progress Summary
                    </h4>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Total Hours:</span> {student.totalHours}
                      </div>
                      {student.requiredHours && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Required Hours:</span> {student.requiredHours}
                        </div>
                      )}
                      {student.lastActivity && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Last Activity:</span> {formatDate(student.lastActivity)}
                        </div>
                      )}
                      {student.pendingTimesheets > 0 && (
                        <div className="flex items-center text-sm text-orange-600">
                          <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                          <span className="font-medium">{student.pendingTimesheets} timesheet{student.pendingTimesheets !== 1 ? 's' : ''} pending approval</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
