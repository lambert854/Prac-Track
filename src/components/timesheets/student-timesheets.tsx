'use client'

import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { CalendarIcon, ClockIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { TimesheetEntryForm } from './timesheet-entry-form'
import { TimesheetWeekView } from './timesheet-week-view'

interface TimesheetEntry {
  id: string
  date: string
  hours: number
  category: string
  notes?: string
  status: string
  submittedAt?: string
  supervisorApprovedAt?: string
  supervisorApprovedBy?: {
    firstName: string
    lastName: string
  }
  facultyApprovedAt?: string
  facultyApprovedBy?: {
    firstName: string
    lastName: string
  }
  locked: boolean
}

interface Placement {
  id: string
  status: string
  site: {
    name: string
  }
}

export function StudentTimesheets() {
  const [showEntryForm, setShowEntryForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [editingEntry, setEditingEntry] = useState<TimesheetEntry | null>(null)
  const queryClient = useQueryClient()

  // Get current user information
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const response = await fetch('/api/auth/session')
      if (!response.ok) throw new Error('Failed to fetch user data')
      return response.json()
    },
  })

  // Get user&apos;s active placements
  const { data: placements, isLoading: placementsLoading } = useQuery({
    queryKey: ['placements'],
    queryFn: async () => {
      const response = await fetch('/api/placements')
      if (!response.ok) throw new Error('Failed to fetch placements')
      return response.json()
    },
  })

  const activePlacement = placements?.find((p: Placement) => 
    p.status === 'ACTIVE' || p.status === 'APPROVED' || p.status === 'APPROVED_PENDING_CHECKLIST'
  )

  // Get timesheet entries for active placement
  const { data: timesheetEntries, isLoading: entriesLoading } = useQuery({
    queryKey: ['timesheet-entries', activePlacement?.id],
    queryFn: async () => {
      if (!activePlacement?.id) {
        console.log('No active placement ID, returning empty array')
        return []
      }
      
      console.log('Fetching timesheet entries for placement:', activePlacement.id)
      const response = await fetch(`/api/placements/${activePlacement.id}/timesheets`)
      if (!response.ok) {
        console.error('Failed to fetch timesheet entries:', response.status, response.statusText)
        throw new Error('Failed to fetch timesheet entries')
      }
      const data = await response.json()
      console.log('Fetched timesheet entries:', data)
      return data
    },
    enabled: !!activePlacement?.id,
  })

  const submitWeekMutation = useMutation({
    mutationFn: async ({ startDate, endDate, journalData }: { startDate: string; endDate: string; journalData?: any }) => {
      if (!activePlacement?.id) throw new Error('No active placement')
      
      // If journal data is provided, submit the journal first
      if (journalData) {
        const journalResponse = await fetch(`/api/placements/${activePlacement.id}/timesheets/journal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startDate,
            endDate,
            ...journalData
          }),
        })
        if (!journalResponse.ok) {
          const errorData = await journalResponse.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to submit journal')
        }
      }
      
      // Then submit the week
      const response = await fetch(`/api/placements/${activePlacement.id}/timesheets/submit-week`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to submit week')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheet-entries'] })
      queryClient.invalidateQueries({ queryKey: ['timesheet-entries', activePlacement?.id] })
      // Also invalidate student dashboard data
      queryClient.invalidateQueries({ queryKey: ['student-dashboard'] })
      
      // Refresh the page to update the UI
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    },
    onError: (error) => {
      console.error('Timesheet submission error:', error)
      // You could add a toast notification here if you have a toast system
    },
  })

  if (placementsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!activePlacement) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timesheets</h1>
          <p className="text-gray-600">Log your practicum placement hours</p>
        </div>
        
        <div className="card">
          <div className="text-center py-8">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Placement</h3>
            <p className="text-gray-600 mb-4">You need an active practicum placement to log hours.</p>
            <a href="/placements/browse" className="btn-primary">
              Browse Available Sites
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timesheets</h1>
          <p className="text-gray-600">Log your practicum placement hours</p>
        </div>
        <button
          onClick={() => {
            setShowEntryForm(true)
          }}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Hours
        </button>
      </div>

      {/* Placement Info */}
      <div className="card">
        <div className="flex items-center">
          <CalendarIcon className="h-5 w-5 text-primary mr-3" />
          <div>
            <h3 className="font-medium text-gray-900">Active Placement</h3>
            <p className="text-sm text-gray-600">{activePlacement.site.name}</p>
          </div>
        </div>
      </div>

      {/* Timesheet Week View */}
      {activePlacement && (
        <TimesheetWeekView
          placementId={activePlacement.id}
          entries={timesheetEntries || []}
          onEditEntry={(entry) => {
            setEditingEntry(entry)
            setShowEntryForm(true)
          }}
          onAddEntry={(date) => {
            setSelectedDate(date)
            setEditingEntry(null)
            setShowEntryForm(true)
          }}
          onSubmitWeek={submitWeekMutation.mutate}
          isSubmittingWeek={submitWeekMutation.isPending}
          studentName={user?.user?.name || 'Student'}
        />
      )}

      {/* Timesheet Entry Form Modal */}
      {showEntryForm && activePlacement && (
        <TimesheetEntryForm
          placementId={activePlacement.id}
          date={selectedDate}
          entry={editingEntry}
          onClose={() => {
            setShowEntryForm(false)
            setSelectedDate(null)
            setEditingEntry(null)
          }}
        />
      )}
    </div>
  )
}
