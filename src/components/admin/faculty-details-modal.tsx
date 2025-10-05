'use client'

import { XMarkIcon, UserIcon, AcademicCapIcon, PhoneIcon, EnvelopeIcon, CalendarIcon } from '@heroicons/react/24/outline'

interface Faculty {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  createdAt: string
  lastLogin?: string | null
  facultyProfile?: {
    title: string | null
    officePhone: string | null
  }
  facultyStudentAssignments?: Array<{
    id: string
    student: {
      id: string
      firstName: string
      lastName: string
      email: string
      studentProfile?: {
        aNumber: string
        program: string
        cohort: string
      }
    }
  }>
  facultyPlacements?: Array<{
    id: string
    status: string
    startDate: string
    endDate: string
    student: {
      firstName: string
      lastName: string
    }
    site: {
      name: string
    }
  }>
}

interface FacultyDetailsModalProps {
  faculty: Faculty
  onClose: () => void
}

export function FacultyDetailsModal({ faculty, onClose }: FacultyDetailsModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Faculty Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="card">
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                <AcademicCapIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {faculty.firstName} {faculty.lastName}
                </h3>
                {faculty.facultyProfile?.title && (
                  <p className="text-gray-600">{faculty.facultyProfile.title}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <p className="text-gray-900">{faculty.email}</p>
                </div>
              </div>

              {faculty.phone && (
                <div className="flex items-center space-x-3">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Phone</p>
                    <p className="text-gray-900">{faculty.phone}</p>
                  </div>
                </div>
              )}

              {faculty.facultyProfile?.officePhone && (
                <div className="flex items-center space-x-3">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Office Phone</p>
                    <p className="text-gray-900">{faculty.facultyProfile.officePhone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Member Since</p>
                  <p className="text-gray-900">{formatDate(faculty.createdAt)}</p>
                </div>
              </div>

              {faculty.lastLogin && (
                <div className="flex items-center space-x-3">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Last Login</p>
                    <p className="text-gray-900">{formatDateTime(faculty.lastLogin)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Students */}
          {faculty.facultyStudentAssignments && faculty.facultyStudentAssignments.length > 0 && (
            <div className="card">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Assigned Students ({faculty.facultyStudentAssignments.length})
              </h4>
              <div className="space-y-3">
                {faculty.facultyStudentAssignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {assignment.student.firstName} {assignment.student.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{assignment.student.email}</p>
                        {assignment.student.studentProfile && (
                          <p className="text-xs text-gray-500">
                            ID Number: {assignment.student.studentProfile.aNumber} | 
                            {assignment.student.studentProfile.program} - {assignment.student.studentProfile.cohort}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Faculty Placements */}
          {faculty.facultyPlacements && faculty.facultyPlacements.length > 0 && (
            <div className="card">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Faculty Placements ({faculty.facultyPlacements.length})
              </h4>
              <div className="space-y-3">
                {faculty.facultyPlacements.map((placement) => (
                  <div key={placement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                        <AcademicCapIcon className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {placement.student.firstName} {placement.student.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{placement.site.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(placement.startDate)} - {formatDate(placement.endDate)}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      placement.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800'
                        : placement.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {placement.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card text-center">
              <div className="text-2xl font-bold text-blue-600">
                {faculty.facultyStudentAssignments?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Assigned Students</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-green-600">
                {faculty.facultyPlacements?.filter(p => p.status === 'ACTIVE').length || 0}
              </div>
              <div className="text-sm text-gray-600">Active Placements</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-purple-600">
                {faculty.facultyPlacements?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Total Placements</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
