'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckIcon, XMarkIcon, EyeIcon } from '@heroicons/react/24/outline'

interface SupervisorTimesheetsProps {
  supervisorId: string
}

interface TimesheetEntry {
  id: string
  date: string
  hours: number
  description: string
  status: string
}

interface TimesheetGroup {
  student: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  site: {
    id: string
    name: string
  }
  weekStart: string
  weekEnd: string
  entries: TimesheetEntry[]
  totalHours: number
}

export function SupervisorTimesheets({ supervisorId }: SupervisorTimesheetsProps) {
  const [selectedTimesheets, setSelectedTimesheets] = useState<Set<string>>(new Set())
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // Fetch pending timesheets
  const { data: timesheetsData, isLoading, error } = useQuery({
    queryKey: ['supervisor-timesheets', supervisorId],
    queryFn: async () => {
      const response = await fetch(`/api/supervisor/${supervisorId}/timesheets`)
      if (!response.ok) {
        throw new Error('Failed to fetch timesheets')
      }
      return response.json()
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Approve/reject timesheets mutation
  const approveTimesheetsMutation = useMutation({
    mutationFn: async ({ action }: { action: 'approve' | 'reject' }) => {
      const timesheetIds = Array.from(selectedTimesheets)
      const response = await fetch(`/api/supervisor/${supervisorId}/timesheets/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timesheetIds,
          action,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${action} timesheets`)
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisor-timesheets', supervisorId] })
      setSelectedTimesheets(new Set())
      setSelectedGroup(null)
    },
  })

  const handleSelectAll = (groupKey: string, entries: TimesheetEntry[]) => {
    if (selectedGroup === groupKey) {
      // Deselect all
      setSelectedTimesheets(new Set())
      setSelectedGroup(null)
    } else {
      // Select all in this group
      const entryIds = entries.map(entry => entry.id)
      setSelectedTimesheets(new Set(entryIds))
      setSelectedGroup(groupKey)
    }
  }

  const handleSelectEntry = (entryId: string) => {
    const newSelected = new Set(selectedTimesheets)
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId)
    } else {
      newSelected.add(entryId)
    }
    setSelectedTimesheets(newSelected)
    
    // Clear group selection if individual entries are selected
    if (newSelected.size > 0) {
      setSelectedGroup(null)
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
    const start = new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const end = new Date(weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${start} - ${end}`
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
        <p className="text-red-800">Error loading timesheets: {error.message}</p>
      </div>
    )
  }

  const timesheets: TimesheetGroup[] = timesheetsData?.timesheets || []
  const totalPending = timesheetsData?.totalPending || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">Timesheet Approvals</h1>
        <p className="text-gray-600 mt-2">
          Review and approve timesheet entries from your assigned students
        </p>
        <div className="mt-4 flex items-center space-x-4">
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
            {totalPending} Pending Approval
          </div>
        </div>
      </div>

      {/* Action Bar */}
      {selectedTimesheets.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-blue-800 font-medium">
              {selectedTimesheets.size} timesheet{selectedTimesheets.size !== 1 ? 's' : ''} selected
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => approveTimesheetsMutation.mutate({ action: 'approve' })}
                disabled={approveTimesheetsMutation.isPending}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                Approve Selected
              </button>
              <button
                onClick={() => approveTimesheetsMutation.mutate({ action: 'reject' })}
                disabled={approveTimesheetsMutation.isPending}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Reject Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timesheet Groups */}
      {timesheets.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500 text-lg">No timesheets pending approval</p>
          <p className="text-gray-400 mt-2">Timesheets from your assigned students will appear here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {timesheets.map((group, groupIndex) => {
            const groupKey = `${group.student.id}_${group.weekStart}`
            const isGroupSelected = selectedGroup === groupKey
            const allEntriesSelected = group.entries.every(entry => selectedTimesheets.has(entry.id))
            
            return (
              <div key={groupKey} className="bg-white shadow rounded-lg">
                {/* Group Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {group.student.firstName} {group.student.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {group.site.name} • Week of {formatWeekRange(group.weekStart, group.weekEnd)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Total Hours: <span className="font-medium">{group.totalHours}</span>
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleSelectAll(groupKey, group.entries)}
                        className={`px-4 py-2 text-sm font-medium rounded-md ${
                          isGroupSelected || allEntriesSelected
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {isGroupSelected || allEntriesSelected ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Timesheet Entries */}
                <div className="divide-y divide-gray-200">
                  {group.entries.map((entry) => (
                    <div key={entry.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <input
                            type="checkbox"
                            checked={selectedTimesheets.has(entry.id)}
                            onChange={() => handleSelectEntry(entry.id)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDate(entry.date)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {entry.description || 'No description provided'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-medium text-gray-900">
                            {entry.hours} hour{entry.hours !== 1 ? 's' : ''}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            entry.status === 'PENDING_SUPERVISOR'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {entry.status === 'PENDING_SUPERVISOR' ? 'Pending' : entry.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
