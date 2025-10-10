'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  UserIcon, 
  AcademicCapIcon, 
  MapPinIcon, 
  ClockIcon, 
  DocumentTextIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { StudentEvaluationsSection } from './student-evaluations-section'

interface StudentDetailViewProps {
  studentId: string
}

interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
  active: boolean
  studentProfile?: {
    aNumber: string
    program: string
    cohort: string
    requiredHours?: number
  }
  studentFacultyAssignments: Array<{
    faculty: {
      id: string
      firstName: string
      lastName: string
      email: string
      facultyProfile?: {
        honorific?: string
      }
    }
  }>
  studentPlacements: Array<{
    id: string
    status: string
    startDate: string
    endDate: string
    term: string
    requiredHours?: number
    approvedAt?: string
    cellPolicy?: string
    learningContract?: string
    checklist?: string
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
      facultyProfile?: {
        honorific?: string
      }
    }
    timesheetEntries: Array<{
      id: string
      date: string
      hours: number
      category: string
      status: string
    }>
  }>
}

export function StudentDetailView({ studentId }: StudentDetailViewProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data: student, isLoading, error } = useQuery({
    queryKey: ['student', studentId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/students/${studentId}`)
      if (!response.ok) throw new Error('Failed to fetch student')
      return await response.json() as Student
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async (active: boolean) => {
      const response = await fetch(`/api/admin/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      })
      if (!response.ok) throw new Error('Failed to update student')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', studentId] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })

  const deleteStudentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/students/${studentId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete student')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      router.push('/faculty/students')
    },
  })

  const handleToggleActive = () => {
    if (student) {
      toggleActiveMutation.mutate(!student.active)
    }
  }

  const handleDelete = () => {
    deleteStudentMutation.mutate()
  }

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED_PENDING_CHECKLIST: 'bg-blue-100 text-blue-800',
      ACTIVE: 'bg-green-100 text-green-800',
      COMPLETE: 'bg-purple-100 text-purple-800',
    }
    
    const statusText = {
      DRAFT: 'Draft',
      PENDING: 'Pending Review',
      APPROVED_PENDING_CHECKLIST: 'Approved',
      ACTIVE: 'Approved',
      COMPLETE: 'Complete',
    }
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
        statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'
      }`}>
        {statusText[status as keyof typeof statusText] || status}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Student Not Found</h3>
          <p className="text-gray-600 mb-4">The requested student could not be found.</p>
          <button
            onClick={() => router.push('/faculty/students')}
            className="btn-primary"
          >
            Back to Students
          </button>
        </div>
      </div>
    )
  }

  const totalHours = student.studentPlacements.reduce((total, placement) => {
    return total + placement.timesheetEntries.reduce((placementTotal, entry) => {
      return placementTotal + (entry.status === 'APPROVED' ? Number(entry.hours) : 0)
    }, 0)
  }, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/faculty/students')}
            className="btn-outline flex items-center"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Students
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {student.firstName} {student.lastName}
            </h1>
            <p className="text-gray-600">{student.email}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleToggleActive}
            disabled={toggleActiveMutation.isPending}
            className={`btn-outline flex items-center ${
              student.active 
                ? 'text-orange-600 border-orange-300 hover:bg-orange-50' 
                : 'text-green-600 border-green-300 hover:bg-green-50'
            }`}
          >
            {toggleActiveMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Updating...
              </>
            ) : student.active ? (
              <>
                <XCircleIcon className="h-4 w-4 mr-2" />
                Deactivate
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Activate
              </>
            )}
          </button>
          
          {session?.user?.role === 'ADMIN' && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-outline text-red-600 border-red-300 hover:bg-red-50 flex items-center"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Student Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center mb-4">
              <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">First Name</label>
                <p className="text-sm text-gray-900">{student.firstName}</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Last Name</label>
                <p className="text-sm text-gray-900">{student.lastName}</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                <p className="text-sm text-gray-900">{student.email}</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  student.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {student.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Academic Information */}
          {student.studentProfile && (
            <div className="card">
              <div className="flex items-center mb-4">
                <AcademicCapIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Academic Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">ID Number</label>
                  <p className="text-sm text-gray-900">{student.studentProfile.aNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Program</label>
                  <p className="text-sm text-gray-900">{student.studentProfile.program}</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Cohort</label>
                  <p className="text-sm text-gray-900">{student.studentProfile.cohort}</p>
                </div>
              </div>
            </div>
          )}

          {/* Faculty Assignment */}
          {student.studentFacultyAssignments.length > 0 && (
            <div className="card">
              <div className="flex items-center mb-4">
                <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Faculty Assignment</h2>
              </div>
              <div className="space-y-3">
                {student.studentFacultyAssignments.map((assignment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {assignment.faculty.facultyProfile?.honorific && `${assignment.faculty.facultyProfile.honorific} `}{assignment.faculty.firstName} {assignment.faculty.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{assignment.faculty.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Placements */}
          {student.studentPlacements.length > 0 && (
            <div className="card">
              <div className="flex items-center mb-4">
                <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Placements</h2>
              </div>
              <div className="space-y-4">
                {student.studentPlacements.map((placement) => (
                  <div key={placement.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{placement.site.name}</h3>
                        <p className="text-sm text-gray-600">
                          {placement.site.address}, {placement.site.city}, {placement.site.state} {placement.site.zip}
                        </p>
                      </div>
                      {getStatusBadge(placement.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>Class:</strong> {placement.class?.name || 'Unknown Class'}</p>
                        <p><strong>Dates:</strong> {new Date(placement.startDate).toLocaleDateString()} - {new Date(placement.endDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p><strong>Required Hours:</strong> {placement.requiredHours || 'Not specified'}</p>
                        <p><strong>Hours Completed:</strong> {placement.timesheetEntries.reduce((total, entry) => total + (entry.status === 'APPROVED' ? Number(entry.hours) : 0), 0)}</p>
                        {placement.supervisor && (
                          <p><strong>Supervisor:</strong> {placement.supervisor.firstName} {placement.supervisor.lastName}</p>
                        )}
                      </div>
                    </div>

                    {placement.timesheetEntries.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-2">Timesheet Entries</h4>
                        <div className="space-y-2">
                          {placement.timesheetEntries.slice(0, 3).map((entry) => (
                            <div key={entry.id} className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-3">
                                <ClockIcon className="h-4 w-4 text-gray-400" />
                                <span>{new Date(entry.date).toLocaleDateString()}</span>
                                <span>{entry.hours} hours</span>
                                <span className="text-gray-500">({entry.category})</span>
                              </div>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                entry.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                entry.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {entry.status}
                              </span>
                            </div>
                          ))}
                          {placement.timesheetEntries.length > 3 && (
                            <p className="text-sm text-gray-500">
                              ...and {placement.timesheetEntries.length - 3} more entries
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Evaluations</h3>
            <StudentEvaluationsSection 
              studentId={student.id} 
              placements={student.studentPlacements}
            />
          </div>
        </div>
      </div>

      {/* Student Documents */}
      <div className="card">
        <div className="flex items-center mb-4">
          <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Student Documents</h2>
        </div>
        
        <div className="space-y-4">
          {/* Get all uploaded documents from placements */}
          {student.studentPlacements.length > 0 ? (
            student.studentPlacements.map((placement) => {
              const documents = []
              
              // Add placement documents if they exist
              if (placement.cellPolicy) {
                documents.push({
                  id: `cell-policy-${placement.id}`,
                  name: 'Fair Use Policies',
                  type: 'Document Upload',
                  uploadedAt: placement.approvedAt || placement.startDate,
                  documentPath: placement.cellPolicy,
                  siteName: placement.site.name
                })
              }
              
              if (placement.learningContract) {
                documents.push({
                  id: `learning-contract-${placement.id}`,
                  name: 'Student Learning Contract',
                  type: 'Document Upload',
                  uploadedAt: placement.approvedAt || placement.startDate,
                  documentPath: placement.learningContract,
                  siteName: placement.site.name
                })
              }
              
              if (placement.checklist) {
                documents.push({
                  id: `checklist-${placement.id}`,
                  name: 'Placement Checklist',
                  type: 'Document Upload',
                  uploadedAt: placement.approvedAt || placement.startDate,
                  documentPath: placement.checklist,
                  siteName: placement.site.name
                })
              }
              
              return documents.map((doc) => (
                <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">{doc.name}</h3>
                        <p className="text-sm text-gray-600">
                          {doc.siteName} • {doc.type}
                        </p>
                        <p className="text-xs text-gray-500">
                          Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => window.open(`/api/documents/${doc.documentPath}`, '_blank')}
                        className="bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center"
                        title="View Document"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))
            }).flat()
          ) : (
            <div className="text-center py-8">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Uploaded</h3>
              <p className="text-gray-600">
                This student has not uploaded any documents yet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <TrashIcon className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Delete Student
                  </h3>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This will permanently delete "{student.firstName} {student.lastName}" and all associated data including placements and timesheets. This action cannot be undone.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-outline"
                  disabled={deleteStudentMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="btn-primary bg-red-600 hover:bg-red-700 text-white"
                  disabled={deleteStudentMutation.isPending}
                >
                  {deleteStudentMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Student'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
