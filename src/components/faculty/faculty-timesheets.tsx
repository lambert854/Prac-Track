'use client'

import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
    AcademicCapIcon,
    BuildingOfficeIcon,
    CalendarIcon,
    CheckCircleIcon,
    CheckIcon,
    ClockIcon,
    EnvelopeIcon,
    ExclamationTriangleIcon,
    UserIcon,
    XCircleIcon
} from '@heroicons/react/24/outline'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

interface FacultyTimesheetsProps {
  facultyId: string
}

// Helper function to get competency description from code
function getCompetencyDescription(code: string): string {
  // Based on user examples, create a mapping for the specific codes
  const competencyMap: Record<string, string> = {
    '2.1.4': 'Uses reflection and self-regulation to manage personal values and maintain professionalism in practice situations',
    '2.1.6': 'Uses supervision and consultation to guide professional judgment and behavior',
    '2.1.8': 'Uses technology ethically and appropriately to facilitate practice outcomes',
    // Add more mappings as needed
  }
  
  return competencyMap[code] || code
}

// Helper function to get practice behavior description from code
function getPracticeBehaviorDescription(code: string): string {
  // Create a mapping for practice behavior codes
  const practiceBehaviorMap: Record<string, string> = {
    'pb1': 'Practice Behavior 1 Description',
    'pb2': 'Practice Behavior 2 Description', 
    'pb3': 'Practice Behavior 3 Description',
    'pb4': 'Practice Behavior 4 Description',
    'pb5': 'Practice Behavior 5 Description',
    // Add more mappings as needed
  }
  
  return practiceBehaviorMap[code] || code
}

interface TimesheetGroup {
  student: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  supervisor: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  site: {
    id: string
    name: string
  }
  supervisorApprovedBy?: {
    firstName: string
    lastName: string
  }
  supervisorApprovedAt?: string
  rejectedBy?: {
    firstName: string
    lastName: string
  }
  rejectedAt?: string
  rejectionReason?: string
  weekStart: string
  weekEnd: string
  entries: Array<{
    id: string
    date: string
    hours: number
    category: string
    notes?: string
    status: string
    rejectionReason?: string
    rejectedAt?: string
    rejectedBy?: {
      firstName: string
      lastName: string
    }
  }>
  totalHours: number
  status: 'PENDING_FACULTY' | 'PENDING_SUPERVISOR' | 'REJECTED'
  submittedAt?: string
  journal?: {
    id: string
    startDate: string
    endDate: string
    tasksSummary: string
    highLowPoints?: string
    competencies: string[]
    practiceBehaviors: string[]
    reaction: string
    otherComments?: string
    submittedAt: string
  }
}

export function FacultyTimesheets({ facultyId }: FacultyTimesheetsProps) {
  const [selectedTimesheet, setSelectedTimesheet] = useState<TimesheetGroup | null>(null)
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject' | null>(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showJournalModal, setShowJournalModal] = useState(false)
  const [approvalNotes, setApprovalNotes] = useState('')
  const queryClient = useQueryClient()

  // Fetch pending timesheets
  const { data: timesheetData, isLoading, error } = useQuery({
    queryKey: ['faculty-timesheets', facultyId],
    queryFn: async () => {
      const response = await fetch(`/api/faculty/${facultyId}/timesheets`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch timesheets')
      return response.json()
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Approve timesheet mutation
  const approveTimesheetMutation = useMutation({
    mutationFn: async ({ timesheet, action, notes }: { timesheet: TimesheetGroup, action: 'approve' | 'reject', notes?: string }) => {
      const response = await fetch(`/api/faculty/${facultyId}/timesheets/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          entryIds: timesheet.entries.map(entry => entry.id),
          action,
          notes,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to approve timesheet')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-timesheets', facultyId] })
      setShowApprovalModal(false)
      setSelectedTimesheet(null)
      setSelectedAction(null)
      setApprovalNotes('')
    },
  })

  // Mark rejected timesheet as viewed mutation
  const markViewedMutation = useMutation({
    mutationFn: async ({ timesheet }: { timesheet: TimesheetGroup }) => {
      const response = await fetch(`/api/faculty/${facultyId}/timesheets/mark-viewed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          entryIds: timesheet.entries.map(entry => entry.id),
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to mark timesheet as viewed')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-timesheets', facultyId] })
    },
  })

  const handleApprove = (timesheet: TimesheetGroup, action: 'approve' | 'reject') => {
    setSelectedTimesheet(timesheet)
    setSelectedAction(action)
    setShowApprovalModal(true)
  }

  const handleMarkViewed = (timesheet: TimesheetGroup) => {
    markViewedMutation.mutate({ timesheet })
  }

  const confirmAction = () => {
    if (selectedTimesheet && selectedAction) {
      approveTimesheetMutation.mutate({
        timesheet: selectedTimesheet,
        action: selectedAction,
        notes: approvalNotes || undefined,
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatWeekRange = (weekStart: string, weekEnd: string) => {
    const start = new Date(weekStart)
    const end = new Date(weekEnd)
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-gray-600">Loading timesheets...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading timesheets: {error.message}</p>
      </div>
    )
  }

  const facultyTimesheets = timesheetData?.facultyTimesheets || []
  const supervisorTimesheets = timesheetData?.supervisorTimesheets || []
  const rejectedTimesheets = timesheetData?.rejectedTimesheets || []
  const totalPendingFaculty = timesheetData?.totalPendingFaculty || 0
  const totalPendingSupervisor = timesheetData?.totalPendingSupervisor || 0
  const totalRejected = timesheetData?.totalRejected || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Timesheets</h1>
            <p className="text-gray-600 mt-1">
              Review and approve timesheets from your assigned students
            </p>
          </div>
          <div className="flex space-x-6">
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{totalPendingFaculty}</div>
              <div className="text-sm text-gray-600">Pending Faculty Approval</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-600">{totalPendingSupervisor}</div>
              <div className="text-sm text-gray-600">Pending Supervisor Approval</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Supervisor Approval Timesheets */}
      {supervisorTimesheets.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
            Pending Supervisor Approval
          </h2>
          {supervisorTimesheets.map((timesheet: TimesheetGroup, index: number) => (
            <div key={`supervisor_${timesheet.student.id}_${timesheet.weekStart}`} className="bg-yellow-50 border border-yellow-200 rounded-lg shadow">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <UserIcon className="h-8 w-8 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {timesheet.student.firstName} {timesheet.student.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{timesheet.student.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-600">{timesheet.totalHours}</div>
                    <div className="text-sm text-gray-600">Hours</div>
                  </div>
                </div>

                {/* Week Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Week</p>
                      <p className="text-sm text-gray-600">
                        {formatWeekRange(timesheet.weekStart, timesheet.weekEnd)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Site</p>
                      <p className="text-sm text-gray-600">{timesheet.site.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AcademicCapIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Supervisor</p>
                      <p className="text-sm text-gray-600">
                        {timesheet.supervisor.firstName} {timesheet.supervisor.lastName}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Badge and Email Button */}
                <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="text-sm font-medium text-yellow-900">
                          Pending Supervisor Approval
                        </p>
                        <p className="text-xs text-yellow-700">
                          Submitted {timesheet.submittedAt ? formatDate(timesheet.submittedAt) : 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const subject = `Timesheet Approval Reminder - ${timesheet.student.firstName} ${timesheet.student.lastName}`
                        const body = `Dear ${timesheet.supervisor.firstName},\n\nThis is a gentle reminder that ${timesheet.student.firstName} ${timesheet.student.lastName} has submitted a timesheet for the week of ${formatWeekRange(timesheet.weekStart, timesheet.weekEnd)} (${timesheet.totalHours} hours) that is awaiting your approval.\n\nPlease log into the system to review and approve the timesheet at your earliest convenience.\n\nThank you,\nFaculty`
                        window.open(`mailto:${timesheet.supervisor.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
                      }}
                      className="inline-flex items-center px-3 py-2 border border-yellow-300 shadow-sm text-sm font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 cursor-pointer"
                    >
                      <EnvelopeIcon className="h-4 w-4 mr-2" />
                      Email Reminder
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending Faculty Approval Timesheets */}
      {facultyTimesheets.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
            Ready for Faculty Approval
          </h2>
          {facultyTimesheets.map((timesheet: TimesheetGroup, index: number) => (
            <div key={`faculty_${timesheet.student.id}_${timesheet.weekStart}`} className="bg-white rounded-lg shadow">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <UserIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {timesheet.student.firstName} {timesheet.student.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{timesheet.student.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">{timesheet.totalHours}</div>
                    <div className="text-sm text-gray-600">Hours</div>
                  </div>
                </div>

                {/* Week Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Week</p>
                      <p className="text-sm text-gray-600">
                        {formatWeekRange(timesheet.weekStart, timesheet.weekEnd)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Site</p>
                      <p className="text-sm text-gray-600">{timesheet.site.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AcademicCapIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Supervisor</p>
                      <p className="text-sm text-gray-600">
                        {timesheet.supervisor.firstName} {timesheet.supervisor.lastName}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Supervisor Approval Info */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        Approved by {timesheet.supervisorApprovedBy?.firstName} {timesheet.supervisorApprovedBy?.lastName}
                      </p>
                      <p className="text-xs text-green-700">
                        {timesheet.supervisorApprovedAt && formatDate(timesheet.supervisorApprovedAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Student Journal */}
                {timesheet.journal ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5 text-blue-600">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-blue-900">Student Journal Entry Available</p>
                          <p className="text-xs text-blue-700">Submitted {formatDate(timesheet.journal.submittedAt)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedTimesheet(timesheet)
                          setShowJournalModal(true)
                        }}
                        className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4 mr-1">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                        View Journal
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center space-x-2">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="text-sm font-medium text-yellow-900">
                          No Journal Entry Found
                        </p>
                        <p className="text-xs text-yellow-700">
                          Student has not submitted a journal entry for this week
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleApprove(timesheet, 'reject')}
                    disabled={approveTimesheetMutation.isPending}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <XCircleIcon className="h-4 w-4 mr-2" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(timesheet, 'approve')}
                    disabled={approveTimesheetMutation.isPending}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Timesheets Message */}
      {facultyTimesheets.length === 0 && supervisorTimesheets.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Timesheets Pending</h3>
          <p className="text-gray-600">
            There are currently no timesheets awaiting approval from your assigned students.
          </p>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedTimesheet && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowApprovalModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {selectedAction === 'approve' ? 'Approve' : 'Reject'} Timesheet
                </h3>
                <p className="text-gray-600 mb-4">
                  {selectedAction === 'approve' 
                    ? `Approve ${selectedTimesheet.totalHours} hours for ${selectedTimesheet.student.firstName} ${selectedTimesheet.student.lastName}?`
                    : `Reject the timesheet for ${selectedTimesheet.student.firstName} ${selectedTimesheet.student.lastName}?`
                  }
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    rows={3}
                    className="form-input"
                    placeholder="Add any notes about this approval..."
                  />
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setShowApprovalModal(false)}
                    disabled={approveTimesheetMutation.isPending}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  {selectedAction === 'approve' ? (
                    <button
                      onClick={confirmAction}
                      disabled={approveTimesheetMutation.isPending}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {approveTimesheetMutation.isPending ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          Approve
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={confirmAction}
                      disabled={approveTimesheetMutation.isPending}
                      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {approveTimesheetMutation.isPending ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Rejecting...
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="h-4 w-4 mr-2" />
                          Reject
                        </>
                      )}
                    </button>
                  )}
                </div>

                {approveTimesheetMutation.error && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-800 text-sm">
                      Error: {approveTimesheetMutation.error.message}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Journal Modal */}
      {showJournalModal && selectedTimesheet?.journal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowJournalModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Student Journal Entry
                  </h3>
                  <button
                    onClick={() => setShowJournalModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-6 w-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5 text-blue-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        {selectedTimesheet.student.firstName} {selectedTimesheet.student.lastName}
                      </p>
                      <p className="text-xs text-blue-700">
                        Week of {formatWeekRange(selectedTimesheet.weekStart, selectedTimesheet.weekEnd)} • Submitted {formatDate(selectedTimesheet.journal.submittedAt)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4 mr-2 text-gray-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      Tasks Summary
                    </h4>
                    <p className="text-xs text-gray-600 mb-3 italic">What tasks and activities did you complete this week?</p>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border">
                      {selectedTimesheet.journal.tasksSummary}
                    </p>
                  </div>
                  
                  {selectedTimesheet.journal.highLowPoints && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4 mr-2 text-gray-600">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        High & Low Points
                      </h4>
                      <p className="text-xs text-gray-600 mb-3 italic">What were your high points and low points this week?</p>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border">
                        {selectedTimesheet.journal.highLowPoints}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4 mr-2 text-gray-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      Competencies Demonstrated
                    </h4>
                    <p className="text-xs text-gray-600 mb-3 italic">Which competencies did you demonstrate this week?</p>
                    <div className="space-y-2">
                      {selectedTimesheet.journal.competencies.map((competency, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="flex-shrink-0 mt-1">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4 text-blue-600">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded border">
                              {getCompetencyDescription(competency)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4 mr-2 text-gray-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      Practice Behaviors
                    </h4>
                    <p className="text-xs text-gray-600 mb-3 italic">Which practice behaviors did you demonstrate this week?</p>
                    <div className="space-y-2">
                      {selectedTimesheet.journal.practiceBehaviors.map((behavior, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="flex-shrink-0 mt-1">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4 text-green-600">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded border">
                              {getPracticeBehaviorDescription(behavior)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4 mr-2 text-gray-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      Student Reaction
                    </h4>
                    <p className="text-xs text-gray-600 mb-3 italic">How do you feel about your experience this week?</p>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border">
                      {selectedTimesheet.journal.reaction}
                    </p>
                  </div>
                  
                  {selectedTimesheet.journal.otherComments && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4 mr-2 text-gray-600">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        Additional Comments
                      </h4>
                      <p className="text-xs text-gray-600 mb-3 italic">Any additional thoughts or comments?</p>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border">
                        {selectedTimesheet.journal.otherComments}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-end mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowJournalModal(false)}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Rejected Timesheets */}
      {rejectedTimesheets.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <XCircleIcon className="h-5 w-5 text-red-600 mr-2" />
            Rejected Timesheets
          </h2>
          {rejectedTimesheets.map((timesheet: TimesheetGroup, index: number) => (
            <div key={`rejected_${timesheet.student.id}_${timesheet.weekStart}`} className="bg-red-50 border border-red-200 rounded-lg shadow">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="bg-red-100 rounded-full p-3">
                      <UserIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {timesheet.student.firstName} {timesheet.student.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{timesheet.student.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-600">{timesheet.totalHours}</div>
                    <div className="text-sm text-gray-600">Hours</div>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Week</p>
                      <p className="text-sm text-gray-600">
                        {formatWeekRange(timesheet.weekStart, timesheet.weekEnd)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Site</p>
                      <p className="text-sm text-gray-600">{timesheet.site.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AcademicCapIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Supervisor</p>
                      <p className="text-sm text-gray-600">
                        {timesheet.supervisor.firstName} {timesheet.supervisor.lastName}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rejection Information */}
                <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-red-800 text-sm font-medium mb-1">
                        Rejected by {timesheet.rejectedBy ? `${timesheet.rejectedBy.firstName} ${timesheet.rejectedBy.lastName}` : 'Supervisor'}
                        {timesheet.rejectedAt && (
                          <span className="text-red-600 text-xs ml-2">
                            ({formatDate(timesheet.rejectedAt)})
                          </span>
                        )}
                      </p>
                      <p className="text-red-700 text-sm">
                        <strong>Reason:</strong> {timesheet.rejectionReason || 'No reason provided'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="bg-red-100 rounded-full p-2">
                      <XCircleIcon className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-900">
                        Rejected
                      </p>
                      <p className="text-xs text-red-700">
                        Rejected {timesheet.rejectedAt ? formatDate(timesheet.rejectedAt) : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleMarkViewed(timesheet)}
                    disabled={markViewedMutation.isPending}
                    className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {markViewedMutation.isPending ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-1" />
                        Marking...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4 mr-1" />
                        Mark as Viewed
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
