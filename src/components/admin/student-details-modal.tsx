'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { XMarkIcon, UserIcon, AcademicCapIcon, BuildingOfficeIcon, ClockIcon, DocumentTextIcon, TrashIcon } from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ConfirmationModal } from './confirmation-modal'
import { PlacementEvaluationsSection } from './placement-evaluations-section'

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

interface TimesheetWeekGroupingProps {
  entries: any[]
}

// Helper component to group timesheet entries by week
function TimesheetWeekGrouping({ entries }: TimesheetWeekGroupingProps) {
  // Helper function to format date without timezone conversion
  const formatDate = (dateString: string) => {
    const datePart = dateString.split('T')[0] // Get YYYY-MM-DD part
    const [year, month, day] = datePart.split('-')
    return `${month}/${day}/${year}`
  }

  // Helper function to get week dates (exactly like timesheet week view)
  const getWeekDates = (startDate: string) => {
    const start = new Date(startDate + 'T00:00:00') // Force local timezone
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      // Use local date formatting to avoid timezone issues
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      dates.push(dateStr)
    }
    return dates
  }

  // Generate work weeks (exactly like timesheet week view)
  const generateWorkWeeks = () => {
    const weeks = []
    const today = new Date()
    const currentWeekStart = new Date(today)
    currentWeekStart.setDate(today.getDate() - today.getDay()) // Go to Sunday
    
    // Generate 11 weeks: 8 weeks before current, current week, 2 weeks after
    for (let i = -8; i <= 2; i++) {
      const weekStart = new Date(currentWeekStart)
      weekStart.setDate(currentWeekStart.getDate() + (i * 7))
      
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6) // Saturday
      
      const weekStartStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`
      const weekEndStr = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`
      
      weeks.push({
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
        weekDates: getWeekDates(weekStartStr)
      })
    }
    return weeks
  }

  // Group entries by week using the same logic as timesheet
  const groupEntriesByWeek = (entries: any[]) => {
    const workWeeks = generateWorkWeeks()
    const weekGroups: { [key: string]: { entries: any[], weekStart: string, weekEnd: string } } = {}
    
    // For each work week, find entries that fall within that week
    workWeeks.forEach(week => {
      const weekEntries = entries.filter(entry => {
        const entryDate = entry.date.split('T')[0] // Extract YYYY-MM-DD part
        return week.weekDates.includes(entryDate)
      })
      
      if (weekEntries.length > 0) {
        weekGroups[week.weekStart] = {
          entries: weekEntries,
          weekStart: week.weekStart,
          weekEnd: week.weekEnd
        }
      }
    })
    
    return Object.values(weekGroups).sort((a, b) => 
      new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime()
    )
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'approved_pending_checklist':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'complete':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const weekGroups = groupEntriesByWeek(entries)

  // Helper function to determine week status
  const getWeekStatus = (entries: any[]) => {
    const hasApprovedEntries = entries.some(entry => entry.status === 'APPROVED')
    const hasPendingSupervisorEntries = entries.some(entry => entry.status === 'PENDING_SUPERVISOR')
    const hasPendingFacultyEntries = entries.some(entry => entry.status === 'PENDING_FACULTY')
    const allApproved = entries.every(entry => entry.status === 'APPROVED')
    const allDraft = entries.every(entry => entry.status === 'DRAFT')

    if (allApproved) {
      return { status: 'Approved', color: 'bg-green-100 text-green-800' }
    } else if (hasPendingFacultyEntries) {
      return { status: 'Pending Faculty', color: 'bg-blue-100 text-blue-800' }
    } else if (hasPendingSupervisorEntries) {
      return { status: 'Pending Supervisor', color: 'bg-yellow-100 text-yellow-800' }
    } else if (allDraft) {
      return { status: 'Draft', color: 'bg-gray-100 text-gray-800' }
    } else {
      return { status: 'Mixed Status', color: 'bg-orange-100 text-orange-800' }
    }
  }

  return (
    <div className="space-y-4">
      {weekGroups.map((week) => {
        const weekTotalHours = week.entries.reduce((sum, entry) => sum + (typeof entry.hours === 'number' ? entry.hours : parseFloat(entry.hours) || 0), 0)
        const weekStatus = getWeekStatus(week.entries)
        
        return (
          <div key={`${week.weekStart}-${week.weekEnd}`} className="border border-gray-200 rounded-lg bg-white">
            {/* Week Summary */}
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-sm font-medium text-gray-900">
                    Week of {formatDate(week.weekStart)} - {formatDate(week.weekEnd)}
                  </h5>
                  <p className="text-xs text-gray-500">
                    {weekTotalHours.toFixed(1)} hours • {week.entries.length} entries
                  </p>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${weekStatus.color}`}>
                  {weekStatus.status}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
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
      console.log('🗑️ Frontend: Starting delete for student ID:', studentId)
      const response = await fetch(`/api/admin/students/${studentId}`, {
        method: 'DELETE',
      })
      console.log('🗑️ Frontend: Response status:', response.status)
      if (!response.ok) {
        const errorData = await response.json()
        console.log('🗑️ Frontend: Error response:', errorData)
        throw new Error(errorData.error || 'Failed to delete student')
      }
      const result = await response.json()
      console.log('🗑️ Frontend: Success response:', result)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] })
      setShowDeleteModal(false) // Close the delete modal
      onClose() // Close the main modal
      router.push('/admin/students') // Navigate back to students list
    },
    onError: (error) => {
      console.error('Delete student error:', error)
      setShowDeleteModal(false) // Close the delete modal to show error
      // You could add a toast notification here if you have one
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
      case 'approved_pending_checklist':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'complete':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'Active Placement'
      case 'pending':
        return 'Pending'
      case 'approved':
        return 'Active Placement'
      case 'approved_pending_checklist':
        return 'Active Placement'
      case 'draft':
        return 'Draft'
      case 'complete':
        return 'Complete'
      default:
        return status
    }
  }

  const handleDelete = () => {
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    deleteStudentMutation.mutate(student.id)
    // Don't close modal here - let the mutation&apos;s onSuccess/onError handle it
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
                              {assignment.faculty.facultyProfile?.honorific && `${assignment.faculty.facultyProfile.honorific} `}{assignment.faculty.firstName} {assignment.faculty.lastName}
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
                    {studentData.studentPlacements?.reduce((total: number, placement: any) => 
                      total + getTotalHours(placement), 0) || 0}
                  </p>
                  <p className="text-sm text-gray-500">Hours Completed</p>
                </div>
                
                <div className="card text-center">
                  <DocumentTextIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">
                    {studentData.studentPlacements?.reduce((total: number, placement: any) => 
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
                              {getStatusLabel(placement.status)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Site Address:</span>
                              <p className="text-gray-900">{placement.site.address}, {placement.site.city}, {placement.site.state} {placement.site.zip}</p>
                            </div>
                            
                            <div>
                              <span className="text-gray-500">Faculty Advisor:</span>
                              <p className="text-gray-900">{placement.faculty.facultyProfile?.honorific && `${placement.faculty.facultyProfile.honorific} `}{placement.faculty.firstName} {placement.faculty.lastName}</p>
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
                        
                        {/* Evaluations Section */}
                        <PlacementEvaluationsSection
                          placementId={placement.id}
                          placementName={placement.site.name}
                          placementStatus={placement.status}
                        />
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
                        <TimesheetWeekGrouping entries={placement.timesheetEntries} />
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
