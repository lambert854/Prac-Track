'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  UserIcon, 
  BuildingOfficeIcon,
  CalendarIcon,
  AcademicCapIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface FacultyTimesheetsProps {
  facultyId: string
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
  weekStart: string
  weekEnd: string
  entries: Array<{
    id: string
    date: string
    hours: number
    category: string
    notes?: string
  }>
  totalHours: number
  status: 'PENDING_FACULTY' | 'PENDING_SUPERVISOR'
  submittedAt?: string
}

export function FacultyTimesheets({ facultyId }: FacultyTimesheetsProps) {
  const [selectedTimesheet, setSelectedTimesheet] = useState<TimesheetGroup | null>(null)
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject' | null>(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
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

  const handleApprove = (timesheet: TimesheetGroup, action: 'approve' | 'reject') => {
    setSelectedTimesheet(timesheet)
    setSelectedAction(action)
    setShowApprovalModal(true)
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
  const totalPendingFaculty = timesheetData?.totalPendingFaculty || 0
  const totalPendingSupervisor = timesheetData?.totalPendingSupervisor || 0

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
                        Approved by {timesheet.supervisorApprovedBy.firstName} {timesheet.supervisorApprovedBy.lastName}
                      </p>
                      <p className="text-xs text-green-700">
                        {formatDate(timesheet.supervisorApprovedAt)}
                      </p>
                    </div>
                  </div>
                </div>

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
    </div>
  )
}
