'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  UserGroupIcon, 
  PlusIcon, 
  TrashIcon,
  AcademicCapIcon,
  UserIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EditAssignmentModal } from './edit-assignment-modal'
import { ConfirmationModal } from './confirmation-modal'

interface FacultyAssignment {
  id: string
  student: {
    id: string
    firstName: string
    lastName: string
    email: string
    studentProfile?: {
      program: string
      cohort: string
    }
    studentPlacements: Array<{
      id: string
      status: string
      site: {
        name: string
      }
    }>
  }
  faculty: {
    id: string
    firstName: string
    lastName: string
    email: string
    facultyProfile?: {
      honorific?: string
      title: string
      department: string
    }
  }
  createdAt: string
}

interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
  studentProfile?: {
    program: string
    cohort: string
  }
}

interface Faculty {
  id: string
  firstName: string
  lastName: string
  email: string
  facultyProfile?: {
    title: string
    department: string
  }
}

export function FacultyAssignmentsManagement() {
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<FacultyAssignment | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [selectedFaculty, setSelectedFaculty] = useState<string>('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [assignmentToDelete, setAssignmentToDelete] = useState<FacultyAssignment | null>(null)
  const queryClient = useQueryClient()

  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['faculty-assignments'],
    queryFn: async () => {
      const response = await fetch('/api/admin/faculty-assignments', {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch faculty assignments')
      return response.json()
    },
  })

  const { data: students } = useQuery({
    queryKey: ['students-for-assignment'],
    queryFn: async () => {
      const response = await fetch('/api/admin/students', {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch students')
      return response.json()
    },
  })

  const { data: faculty } = useQuery({
    queryKey: ['faculty-for-assignment'],
    queryFn: async () => {
      const response = await fetch('/api/admin/faculty', {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch faculty')
      return response.json()
    },
  })

  const assignMutation = useMutation({
    mutationFn: async ({ studentId, facultyId }: { studentId: string; facultyId: string }) => {
      const response = await fetch('/api/admin/faculty-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, facultyId }),
      })
      if (!response.ok) throw new Error('Failed to create assignment')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-assignments'] })
      setShowAssignForm(false)
      setSelectedStudent('')
      setSelectedFaculty('')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ assignmentId, facultyId }: { assignmentId: string; facultyId: string }) => {
      const response = await fetch(`/api/admin/faculty-assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facultyId }),
      })
      if (!response.ok) throw new Error('Failed to update assignment')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-assignments'] })
      setEditingAssignment(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const response = await fetch(`/api/admin/faculty-assignments/${assignmentId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete assignment')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-assignments'] })
    },
  })

  const filteredAssignments = assignments?.filter((assignment: FacultyAssignment) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      assignment.student.firstName.toLowerCase().includes(searchLower) ||
      assignment.student.lastName.toLowerCase().includes(searchLower) ||
      assignment.student.email.toLowerCase().includes(searchLower) ||
      assignment.faculty.firstName.toLowerCase().includes(searchLower) ||
      assignment.faculty.lastName.toLowerCase().includes(searchLower) ||
      assignment.faculty.email.toLowerCase().includes(searchLower)
    )
  }) || []

  // Helper function to check if a student is already assigned
  const isStudentAssigned = (studentId: string) => {
    return assignments?.some((assignment: FacultyAssignment) => assignment.student.id === studentId) || false
  }

  // Pagination logic
  const itemsPerPage = 25
  const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedAssignments = filteredAssignments.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handleAssign = () => {
    if (selectedStudent && selectedFaculty) {
      assignMutation.mutate({
        studentId: selectedStudent,
        facultyId: selectedFaculty,
      })
    }
  }

  const handleDelete = (assignment: FacultyAssignment) => {
    setAssignmentToDelete(assignment)
    setShowConfirmModal(true)
  }

  const confirmDelete = () => {
    if (assignmentToDelete) {
      deleteMutation.mutate(assignmentToDelete.id)
      setShowConfirmModal(false)
      setAssignmentToDelete(null)
    }
  }

  const cancelDelete = () => {
    setShowConfirmModal(false)
    setAssignmentToDelete(null)
  }

  if (assignmentsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faculty Assignments</h1>
          <p className="text-gray-600">Manage student-faculty assignments</p>
        </div>
        <button
          onClick={() => setShowAssignForm(true)}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Assign Student to Faculty
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <input
            type="text"
            placeholder="Search assignments by student or faculty name/email..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      {/* Assignments List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Current Assignments ({filteredAssignments.length})
          </h2>
          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
            </div>
          )}
        </div>

        {/* Top Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(endIndex, filteredAssignments.length)}</span> of{' '}
                  <span className="font-medium">{filteredAssignments.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current page
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          ...
                        </span>
                      )
                    }
                    return null
                  })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {paginatedAssignments.map((assignment: FacultyAssignment) => (
            <div key={assignment.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start space-x-6 flex-1">
                {/* Student Section */}
                <div className="flex items-start space-x-3 flex-1">
                  <UserIcon className="h-8 w-8 text-blue-600 mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">
                      {assignment.student.firstName} {assignment.student.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{assignment.student.email}</p>
                    {assignment.student.studentProfile && (
                      <p className="text-xs text-gray-500">
                        {assignment.student.studentProfile.program} - {assignment.student.studentProfile.cohort}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Arrow */}
                <div className="text-gray-400 mt-1 flex-shrink-0">→</div>
                
                {/* Faculty Section */}
                <div className="flex items-start space-x-3 flex-1">
                  <AcademicCapIcon className="h-8 w-8 text-green-600 mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">
                      {assignment.faculty.facultyProfile?.honorific && `${assignment.faculty.facultyProfile.honorific} `}
                      {assignment.faculty.firstName} {assignment.faculty.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{assignment.faculty.email}</p>
                    {assignment.faculty.facultyProfile && (
                      <p className="text-xs text-gray-500">
                        {assignment.faculty.facultyProfile.title} - {assignment.faculty.facultyProfile.department}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Actions Section */}
              <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                <span className="text-xs text-gray-500">
                  Assigned {new Date(assignment.createdAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => setEditingAssignment(assignment)}
                  className="text-blue-600 hover:text-blue-900 p-1"
                  title="Edit assignment"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(assignment)}
                  className="text-red-600 hover:text-red-900 p-1"
                  disabled={deleteMutation.isPending}
                  title="Remove assignment"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredAssignments.length === 0 && (
          <div className="text-center py-8">
            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Assignments Found</h3>
            <p className="text-gray-600">
              {searchQuery 
                ? 'Try adjusting your search criteria.'
                : 'No faculty assignments have been created yet.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Bottom Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">{Math.min(endIndex, filteredAssignments.length)}</span> of{' '}
                <span className="font-medium">{filteredAssignments.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current page
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return (
                      <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        ...
                      </span>
                    )
                  }
                  return null
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Form Modal */}
      {showAssignForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Assign Student to Faculty
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student
                </label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="form-select w-full"
                >
                  <option value="">Select a student...</option>
                  {students?.map((student: Student) => {
                    const assigned = isStudentAssigned(student.id)
                    return (
                      <option 
                        key={student.id} 
                        value={student.id}
                        style={{ color: assigned ? '#dc2626' : '#000000' }}
                      >
                        {assigned ? '🔴 ' : ''}{student.firstName} {student.lastName} ({student.email}){assigned ? ' - Already Assigned' : ''}
                      </option>
                    )
                  })}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Faculty Member
                </label>
                <select
                  value={selectedFaculty}
                  onChange={(e) => setSelectedFaculty(e.target.value)}
                  className="form-select w-full"
                >
                  <option value="">Select a faculty member...</option>
                  {faculty?.map((facultyMember: Faculty) => (
                    <option key={facultyMember.id} value={facultyMember.id}>
                      {facultyMember.firstName} {facultyMember.lastName} ({facultyMember.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAssignForm(false)}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedStudent || !selectedFaculty || assignMutation.isPending}
                className="btn-primary"
              >
                {assignMutation.isPending ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Assignment Modal */}
      {editingAssignment && (
        <EditAssignmentModal 
          assignment={editingAssignment}
          faculty={faculty || []}
          onClose={() => setEditingAssignment(null)}
          onUpdate={(facultyId) => {
            updateMutation.mutate({
              assignmentId: editingAssignment.id,
              facultyId
            })
          }}
          isUpdating={updateMutation.isPending}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        title="Delete Assignment"
        message={`Are you sure you want to remove the assignment between ${assignmentToDelete?.student.firstName} ${assignmentToDelete?.student.lastName} and ${assignmentToDelete?.faculty.firstName} ${assignmentToDelete?.faculty.lastName}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  )
}
