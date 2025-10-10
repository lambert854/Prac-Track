'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { XMarkIcon, UserIcon, AcademicCapIcon, BuildingOfficeIcon, ClockIcon, DocumentTextIcon, TrashIcon } from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ConfirmationModal } from './confirmation-modal'

interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
  studentProfile?: {
    aNumber: string
    program: string
    cohort: string
  }
  studentPlacements?: {
    id: string
    status: string
    requiredHours: number
    term: string
    startDate: string
    endDate: string
    site: {
      id: string
      name: string
      address: string
      city: string
      state: string
      zip: string
    }
    supervisor?: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
    faculty: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
    timesheetEntries?: {
      id: string
      date: string
      hours: number
      category: string
      status: string
    }[]
  }[]
  studentFacultyAssignments?: {
    id: string
    faculty: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
  }[]
}

interface StudentDetailsModalProps {
  student: Student
  onClose: () => void
  userRole?: 'ADMIN' | 'FACULTY' | 'SUPERVISOR' | 'STUDENT'
}

export function StudentDetailsModal({ student, onClose, userRole }: StudentDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'placements' | 'timesheets'>('overview')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const queryClient = useQueryClient()
  const router = useRouter()

  // Fetch detailed student data including timesheets
  const { data: studentDetails, isLoading } = useQuery({
    queryKey: ['student-details', student.id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/students/${student.id}`)
      if (!response.ok) throw new Error('Failed to fetch student details')
      return response.json()
    },
    enabled: !!student.id
  })

  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const response = await fetch(`/api/admin/students/${studentId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete student')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] })
      onClose() // Close the modal
      router.push('/admin/students') // Navigate back to students list
    },
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-blue-100 text-blue-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'complete':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleDelete = () => {
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    deleteStudentMutation.mutate(student.id)
    setShowDeleteModal(false)
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
  }

  const getTotalHours = (placement: any) => {
    if (!placement.timesheetEntries) return 0
    return placement.timesheetEntries
      .filter((entry: any) => entry.status === 'APPROVED')
      .reduce((total: number, entry: any) => total + Number(entry.hours), 0)
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    )
  }

  const studentData = studentDetails || student

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <UserIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {studentData.firstName} {studentData.lastName}
              </h2>
              <p className="text-gray-600">{studentData.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {userRole === 'ADMIN' && (
              <button
                onClick={handleDelete}
                className="text-red-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
                title="Delete student (admin only)"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview', icon: UserIcon },
              { id: 'placements', name: 'Placements', icon: BuildingOfficeIcon },
              { id: 'timesheets', name: 'Timesheets', icon: ClockIcon }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-yellow-500 text-yellow-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">A-Number:</span>
                      <p className="text-gray-900">{studentData.studentProfile?.aNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Program:</span>
                      <p className="text-gray-900">{studentData.studentProfile?.program || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Cohort:</span>
                      <p className="text-gray-900">{studentData.studentProfile?.cohort || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Faculty Assignment</h3>
                  {studentData.studentFacultyAssignments && studentData.studentFacultyAssignments.length > 0 ? (
                    <div className="space-y-3">
                      {studentData.studentFacultyAssignments.map((assignment: any) => (
                        <div key={assignment.id} className="flex items-center space-x-3">
                          <AcademicCapIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {assignment.faculty.firstName} {assignment.faculty.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{assignment.faculty.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No faculty assigned</p>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card text-center">
                  <BuildingOfficeIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">
                    {studentData.studentPlacements?.length || 0}
                  </p>
                  <p className="text-sm text-gray-500">Placements</p>
                </div>
                
                <div className="card text-center">
                  <ClockIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">
                    {studentData.studentPlacements?.reduce((total, placement) => 
                      total + getTotalHours(placement), 0) || 0}
                  </p>
                  <p className="text-sm text-gray-500">Hours Completed</p>
                </div>
                
                <div className="card text-center">
                  <DocumentTextIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">
                    {studentData.studentPlacements?.reduce((total, placement) => 
                      total + (placement.timesheetEntries?.length || 0), 0) || 0}
                  </p>
                  <p className="text-sm text-gray-500">Timesheet Entries</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'placements' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Placement History</h3>
              {studentData.studentPlacements && studentData.studentPlacements.length > 0 ? (
                <div className="space-y-4">
                  {studentData.studentPlacements.map((placement: any) => (
                    <div key={placement.id} className="card">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-medium text-gray-900">{placement.site.name}</h4>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(placement.status)}`}>
                              {placement.status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Site Address:</span>
                              <p className="text-gray-900">{placement.site.address}, {placement.site.city}, {placement.site.state} {placement.site.zip}</p>
                            </div>
                            
                            <div>
                              <span className="text-gray-500">Faculty Advisor:</span>
                              <p className="text-gray-900">{placement.faculty.firstName} {placement.faculty.lastName}</p>
                            </div>
                            
                            {placement.supervisor && (
                              <div>
                                <span className="text-gray-500">Site Supervisor:</span>
                                <p className="text-gray-900">{placement.supervisor.firstName} {placement.supervisor.lastName}</p>
                              </div>
                            )}
                            
                            <div>
                              <span className="text-gray-500">Class:</span>
                              <p className="text-gray-900">{placement.class?.name || 'Unknown Class'}</p>
                            </div>
                            
                            <div>
                              <span className="text-gray-500">Required Hours:</span>
                              <p className="text-gray-900">{placement.requiredHours} hours</p>
                            </div>
                            
                            <div>
                              <span className="text-gray-500">Completed Hours:</span>
                              <p className="text-gray-900">{getTotalHours(placement)} hours</p>
                            </div>
                            
                            <div>
                              <span className="text-gray-500">Duration:</span>
                              <p className="text-gray-900">{formatDate(placement.startDate)} - {formatDate(placement.endDate)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card text-center py-8">
                  <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No placements found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'timesheets' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Timesheet Entries</h3>
              {studentData.studentPlacements && studentData.studentPlacements.length > 0 ? (
                <div className="space-y-4">
                  {studentData.studentPlacements.map((placement: any) => (
                    placement.timesheetEntries && placement.timesheetEntries.length > 0 && (
                      <div key={placement.id} className="card">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">{placement.site.name}</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {placement.timesheetEntries.map((entry: any) => (
                                <tr key={entry.id}>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatDate(entry.date)}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {entry.hours}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {entry.category}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(entry.status)}`}>
                                      {entry.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              ) : (
                <div className="card text-center py-8">
                  <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No timesheet entries found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Student"
        message={`Are you sure you want to permanently delete ${studentData?.firstName} ${studentData?.lastName}? This action cannot be undone and will remove all associated data including placements, timesheets, and forms.`}
        confirmText="Delete Student"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isLoading={deleteStudentMutation.isPending}
        variant="danger"
      />
    </div>
  )
}
