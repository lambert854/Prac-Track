'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { 
  UserIcon, 
  AcademicCapIcon, 
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { CreateStudentForm } from './create-student-form'
import { EditStudentForm } from './edit-student-form'
import { StudentDetailsModal } from './student-details-modal'
import { ConfirmationModal } from './confirmation-modal'

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
  }
  studentPlacements?: {
    id: string
    status: string
    site: {
      name: string
    }
    startDate: string
    endDate: string
  }[]
  studentFacultyAssignments?: {
    faculty: {
      id: string
      firstName: string
      lastName: string
      facultyProfile?: {
        honorific?: string
      }
    }
  }[]
}

export function AdminStudentsManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [showInactive, setShowInactive] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [studentToDeactivate, setStudentToDeactivate] = useState<Student | null>(null)
  const [studentToReactivate, setStudentToReactivate] = useState<Student | null>(null)
  const [modalAction, setModalAction] = useState<'deactivate' | 'reactivate'>('deactivate')
  const queryClient = useQueryClient()
  const { data: session } = useSession()

  const { data: students, isLoading, error } = useQuery({
    queryKey: ['admin-students'],
    queryFn: async () => {
      const response = await fetch('/api/admin/students', {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch students')
      return response.json()
    },
  })

  const deactivateStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const response = await fetch(`/api/admin/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false }),
      })
      if (!response.ok) throw new Error('Failed to deactivate student')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] })
      queryClient.invalidateQueries({ queryKey: ['faculty-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['students-for-assignment'] })
    },
  })

  const reactivateStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const response = await fetch(`/api/admin/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: true }),
      })
      if (!response.ok) throw new Error('Failed to reactivate student')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] })
      queryClient.invalidateQueries({ queryKey: ['faculty-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['students-for-assignment'] })
    },
  })

  const filteredStudents = students?.filter((student: Student) => {
    const matchesSearch = 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'with-placement' && (student.studentPlacements?.length ?? 0) > 0) ||
      (statusFilter === 'without-placement' && (!student.studentPlacements || student.studentPlacements.length === 0))
    
    const matchesActiveStatus = showInactive ? !student.active : student.active
    
    return matchesSearch && matchesStatus && matchesActiveStatus
  }) || []

  // Pagination logic
  const itemsPerPage = 25
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handleFilterChange = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1) // Reset to first page when filtering
  }

  const handleDeactivate = (student: Student) => {
    setStudentToDeactivate(student)
    setStudentToReactivate(null)
    setModalAction('deactivate')
    setShowConfirmModal(true)
  }

  const handleReactivate = (student: Student) => {
    setStudentToReactivate(student)
    setStudentToDeactivate(null)
    setModalAction('reactivate')
    setShowConfirmModal(true)
  }

  const confirmDeactivate = () => {
    if (studentToDeactivate) {
      deactivateStudentMutation.mutate(studentToDeactivate.id)
      setShowConfirmModal(false)
      setStudentToDeactivate(null)
    }
  }

  const confirmReactivate = () => {
    if (studentToReactivate) {
      reactivateStudentMutation.mutate(studentToReactivate.id)
      setShowConfirmModal(false)
      setStudentToReactivate(null)
    }
  }

  const cancelModal = () => {
    setShowConfirmModal(false)
    setStudentToDeactivate(null)
    setStudentToReactivate(null)
  }

  const handleDeactivateClick = (e: React.MouseEvent, student: Student) => {
    e.stopPropagation() // Prevent row click
    handleDeactivate(student)
  }

  const handleReactivateClick = (e: React.MouseEvent, student: Student) => {
    e.stopPropagation() // Prevent row click
    handleReactivate(student)
  }

  const getStudentStatus = (student: Student) => {
    if (!student.studentPlacements || student.studentPlacements.length === 0) {
      return { status: 'No Placement', color: 'text-gray-600', icon: ExclamationTriangleIcon }
    }
    
    const activePlacement = student.studentPlacements.find(p => p.status === 'ACTIVE')
    if (activePlacement) {
      return { status: 'Active Placement', color: 'text-green-600', icon: CheckCircleIcon }
    }
    
    const pendingPlacement = student.studentPlacements.find(p => p.status === 'PENDING')
    if (pendingPlacement) {
      return { status: 'Pending Placement', color: 'text-yellow-600', icon: ClockIcon }
    }
    
    return { status: 'Completed', color: 'text-blue-600', icon: CheckCircleIcon }
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
          <p className="text-red-600">Error loading students: {error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
          <p className="text-gray-600">Manage student accounts and placements</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Student
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col gap-3 md:gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm md:text-base"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
            <div className="flex-1">
              <select
                value={statusFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm md:text-base"
              >
                <option value="all">All Students</option>
                <option value="with-placement">With Placement</option>
                <option value="without-placement">Without Placement</option>
              </select>
            </div>
            
            <div className="flex-1 sm:flex-none">
              <button
                onClick={() => setShowInactive(!showInactive)}
                className={`w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm md:text-base ${
                  showInactive
                    ? 'bg-gray-200 text-gray-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {showInactive 
                  ? `Show Active (${students?.filter((s: Student) => s.active).length || 0})` 
                  : `Show Inactive (${students?.filter((s: Student) => !s.active).length || 0})`
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <div className="card">
          <div className="flex items-center">
            <UserIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{students?.filter((s: Student) => s.active).length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">With Placements</p>
              <p className="text-2xl font-bold text-gray-900">
                {students?.filter((s: Student) => s.active && s.studentPlacements && s.studentPlacements.length > 0).length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Without Placements</p>
              <p className="text-2xl font-bold text-gray-900">
                {students?.filter((s: Student) => s.active && (!s.studentPlacements || s.studentPlacements.length === 0)).length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {showInactive ? 'Inactive' : 'Active'} Students ({filteredStudents.length})
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
                  <span className="font-medium">{Math.min(endIndex, filteredStudents.length)}</span> of{' '}
                  <span className="font-medium">{filteredStudents.length}</span> results
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

        {/* Demo Data Notice - Remove in Production */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                <strong>Demo Data Notice:</strong> This system contains demonstration data for testing purposes. 
                All student information shown here is sample data and will be replaced with real data in production.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {paginatedStudents.length > 0 ? (
            paginatedStudents.map((student: Student) => {
              const statusInfo = getStudentStatus(student)
              const StatusIcon = statusInfo.icon
              
              return (
                <div 
                  key={student.id} 
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedStudent(student)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-yellow-600" />
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {student.firstName} {student.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">{student.email}</p>
                        {student.studentProfile?.aNumber && (
                          <p className="text-sm text-gray-500">ID Number: {student.studentProfile.aNumber}</p>
                        )}
                        
                        {student.studentProfile && (
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-gray-500">
                              {student.studentProfile.program} - {student.studentProfile.cohort}
                            </span>
                          </div>
                        )}
                        
                        {/* Faculty Assignment */}
                        {student.studentFacultyAssignments && student.studentFacultyAssignments.length > 0 ? (
                          <div className="mt-1">
                            <span className="text-sm text-gray-500">
                              Faculty: {student.studentFacultyAssignments[0].faculty.facultyProfile?.honorific ? 
                                `${student.studentFacultyAssignments[0].faculty.facultyProfile.honorific} ` : ''}
                              {student.studentFacultyAssignments[0].faculty.firstName} {student.studentFacultyAssignments[0].faculty.lastName}
                            </span>
                          </div>
                        ) : (
                          <div className="mt-1">
                            <span className="text-sm text-red-500">
                              No Faculty Assigned
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                        <span className={`text-sm font-medium ${statusInfo.color}`}>
                          {statusInfo.status}
                        </span>
                      </div>
                      
                      {student.studentPlacements && student.studentPlacements.length > 0 && (
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {student.studentPlacements[0].site.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(student.studentPlacements[0].startDate).toLocaleDateString()} - 
                            {new Date(student.studentPlacements[0].endDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingStudent(student)
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Student"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      
                      {student.active ? (
                        <button
                          onClick={(e) => handleDeactivateClick(e, student)}
                          className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                          disabled={deactivateStudentMutation.isPending}
                          title="Deactivate student"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleReactivateClick(e, student)}
                          className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors"
                          disabled={reactivateStudentMutation.isPending}
                          title="Reactivate student"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-8">
              <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No students have been added to the system yet.'
                }
              </p>
            </div>
          )}
        </div>
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
                <span className="font-medium">{Math.min(endIndex, filteredStudents.length)}</span> of{' '}
                <span className="font-medium">{filteredStudents.length}</span> results
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


      {/* Create Student Form Modal */}
      {showCreateForm && (
        <CreateStudentForm onClose={() => setShowCreateForm(false)} />
      )}

      {/* Edit Student Form Modal */}
      {editingStudent && (
        <EditStudentForm 
          student={editingStudent} 
          onClose={() => setEditingStudent(null)} 
        />
      )}

      {/* Student Details Modal */}
      {selectedStudent && (
        <StudentDetailsModal 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)}
          userRole={session?.user?.role as 'ADMIN' | 'FACULTY' | 'SUPERVISOR' | 'STUDENT'}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        title={modalAction === 'deactivate' ? 'Deactivate Student' : 'Reactivate Student'}
        message={modalAction === 'deactivate' 
          ? <><span className="font-bold text-red-600">Deactivating student will unassign faculty.</span> Are you sure you want to deactivate {studentToDeactivate?.firstName} {studentToDeactivate?.lastName}?</>
          : `Are you sure you want to reactivate ${studentToReactivate?.firstName} ${studentToReactivate?.lastName}? They will be moved back to the active section.`
        }
        confirmText={modalAction === 'deactivate' ? 'Deactivate' : 'Reactivate'}
        cancelText="Cancel"
        onConfirm={modalAction === 'deactivate' ? confirmDeactivate : confirmReactivate}
        onCancel={cancelModal}
        isLoading={modalAction === 'deactivate' ? deactivateStudentMutation.isPending : reactivateStudentMutation.isPending}
        variant={modalAction === 'deactivate' ? 'danger' : 'success'}
      />
    </div>
  )
}
