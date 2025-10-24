'use client'

import { CheckIcon, ClockIcon, EyeIcon, PencilIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { TimesheetJournalForm } from './timesheet-journal-form'

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
  rejectedAt?: string
  rejector?: {
    firstName: string
    lastName: string
    role: string
  }
  rejectionReason?: string
  locked: boolean
}

interface TimesheetWeekViewProps {
  placementId: string
  entries: TimesheetEntry[]
  onEditEntry: (entry: TimesheetEntry) => void
  onAddEntry: (date: string) => void
  onSubmitWeek: (data: { startDate: string; endDate: string; journalData?: any }) => void
  isSubmittingWeek: boolean
  studentName: string
}

export function TimesheetWeekView({
  placementId,
  entries,
  onEditEntry,
  onAddEntry,
  onSubmitWeek,
  isSubmittingWeek,
  studentName,
}: TimesheetWeekViewProps) {
  const [showJournalForm, setShowJournalForm] = useState(false)
  const [pendingSubmission, setPendingSubmission] = useState<{ startDate: string; endDate: string } | null>(null)
  // Generate work weeks for the dropdown
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
      const displayLabel = `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      
      weeks.push({
        value: weekStartStr,
        label: displayLabel,
        isCurrent: i === 0
      })
      
    }
    return weeks
  }

  const workWeeks = generateWorkWeeks()
  
  // Initialize with the current week (which should be the first option in the dropdown)
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const currentWeek = workWeeks.find(week => week.isCurrent)
    const defaultWeek = currentWeek ? currentWeek.value : workWeeks[0].value
    return defaultWeek
  })

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

  const weekDates = getWeekDates(selectedWeek)
  
  const weekEntries = entries.filter(entry => {
    // Parse the date string and extract just the date part (YYYY-MM-DD)
    const entryDate = entry.date.split('T')[0]
    const isIncluded = weekDates.includes(entryDate)
    console.log(`Entry date: ${entry.date} -> ${entryDate}, Week dates includes: ${isIncluded}`)
    return isIncluded
  })
  
  // Debug logging
  console.log('=== TIMESHEET WEEK VIEW DEBUG ===')
  console.log('Selected week:', selectedWeek)
  console.log('Week dates:', weekDates)
  console.log('All entries:', entries)
  console.log('Week entries (filtered):', weekEntries)
  console.log('Total entries count:', entries.length)
  console.log('Week entries count:', weekEntries.length)

  const getEntriesForDate = (date: string) => {
    return weekEntries.filter(entry => {
      // Parse the date string and extract just the date part (YYYY-MM-DD)
      const entryDate = entry.date.split('T')[0]
      return entryDate === date
    })
  }

  const getStatusBadge = (entry: TimesheetEntry | undefined) => {
    if (!entry) return null
    
    // Check the status field for the most accurate status
    switch (entry.status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            <CheckIcon className="h-3 w-3 mr-1" />
            Approved
          </span>
        )
      case 'PENDING_FACULTY':
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
            Faculty Review
          </span>
        )
      case 'PENDING_SUPERVISOR':
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Supervisor Review
          </span>
        )
      case 'REJECTED':
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            Rejected
          </span>
        )
      case 'SUBMITTED':
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Pending
          </span>
        )
      case 'DRAFT':
      default:
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            Draft
          </span>
        )
    }
  }

  const canSubmitWeek = () => {
    const weekHasEntries = weekEntries.length > 0
    const allEntriesSubmitted = weekEntries.every(entry => entry.status !== 'DRAFT')
    const hasUnsubmittedEntries = weekEntries.some(entry => entry.status === 'DRAFT')
    
    return weekHasEntries && hasUnsubmittedEntries
  }

  const handleSubmitWeek = () => {
    const startDate = weekDates[0]
    const endDate = weekDates[6]
    
    setPendingSubmission({ startDate, endDate })
    setShowJournalForm(true)
  }

  const handleJournalSubmit = (journalData: any) => {
    console.log('handleJournalSubmit called with:', journalData)
    if (pendingSubmission) {
      console.log('Submitting week with:', {
        startDate: pendingSubmission.startDate,
        endDate: pendingSubmission.endDate,
        journalData
      })
      onSubmitWeek({
        startDate: pendingSubmission.startDate,
        endDate: pendingSubmission.endDate,
        journalData
      })
      setShowJournalForm(false)
      setPendingSubmission(null)
    }
  }

  const handleJournalCancel = () => {
    setShowJournalForm(false)
    setPendingSubmission(null)
  }

  const totalHours = weekEntries.reduce((sum, entry) => {
    const hours = typeof entry.hours === 'number' ? entry.hours : parseFloat(entry.hours) || 0
    console.log(`Adding hours: ${hours} from entry:`, entry)
    return sum + hours
  }, 0)
  
  // Ensure totalHours is a valid number
  const safeTotalHours = Number.isFinite(totalHours) ? totalHours : 0
  
  // Check if any entries in this week have been submitted
  const hasSubmittedEntries = weekEntries.some(entry => entry.submittedAt)
  
  console.log('Calculated total hours:', totalHours)
  console.log('Safe total hours:', safeTotalHours)

  return (
    <div className="card">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Weekly Timesheet</h2>
          <p className="text-sm text-gray-600">
            Week of {new Date(selectedWeek).toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center text-sm text-gray-600 whitespace-nowrap">
            <ClockIcon className="h-4 w-4 mr-1" />
            Total: {safeTotalHours.toFixed(1)} hours
          </div>
          
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="form-input"
          >
            {workWeeks.map((week) => (
              <option key={week.value} value={week.value}>
                {week.label} {week.isCurrent ? '(Current)' : ''}
              </option>
            ))}
          </select>
          
          {canSubmitWeek() && (
            <button
              onClick={handleSubmitWeek}
              disabled={isSubmittingWeek}
              className="btn-primary"
            >
              {isSubmittingWeek ? 'Submitting...' : 'Submit Week'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDates.map((date) => {
          const entries = getEntriesForDate(date)
          const today = new Date()
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
          const isToday = date === todayStr
          const dateObj = new Date(date + 'T00:00:00')
          const dayOfWeek = dateObj.getDay()
          
          // HARDCODED weekend detection to bypass any logic issues
          let shouldShowWeekendLabel = false
          
          // Parse the date to determine weekend status
          const dateStr = date // Format: YYYY-MM-DD
          const [year, month, day] = dateStr.split('-').map(Number)
          const dateForWeekday = new Date(year, month - 1, day) // month is 0-indexed
          const weekday = dateForWeekday.getDay()
          
          // Sunday (0) or Saturday (6) = weekend
          if (weekday === 0 || weekday === 6) {
            shouldShowWeekendLabel = true
          }
          
          // Weekend detection is working correctly
          const dayTotalHours = entries.reduce((sum, entry) => {
            const hours = typeof entry.hours === 'number' ? entry.hours : parseFloat(entry.hours) || 0
            return sum + hours
          }, 0)
          
          // Format date for display
          const displayDate = new Date(date + 'T00:00:00') // Force local timezone
          const displayDateStr = displayDate.toLocaleDateString('en-US', { 
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          })
          
          return (
            <div
              key={date}
              className={`border rounded-lg p-3 ${
                isToday ? 'border-primary bg-primary/5' : 'border-gray-200'
              } ${shouldShowWeekendLabel ? 'bg-gray-50' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-900">
                  {displayDateStr}
                </div>
                {shouldShowWeekendLabel && (
                  <span className="text-xs text-gray-500">Weekend</span>
                )}
              </div>

              {entries.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">
                      {dayTotalHours}h
                    </span>
                    <button
                      onClick={() => onAddEntry(date)}
                      className="text-gray-400 hover:text-gray-600 text-xs"
                      disabled={hasSubmittedEntries}
                      title={hasSubmittedEntries ? "Cannot add entries to submitted week" : "Add entry"}
                    >
                      + Add
                    </button>
                  </div>
                  
                  {entries.map((entry, index) => (
                    <div key={entry.id} className="text-xs border-l-2 border-gray-200 pl-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {typeof entry.hours === 'number' ? entry.hours : parseFloat(entry.hours) || 0}h {entry.category}
                        </span>
                        {!entry.locked && !entry.submittedAt && (
                          <button
                            onClick={() => onEditEntry(entry)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <PencilIcon className="h-3 w-3" />
                          </button>
                        )}
                        {entry.submittedAt && (
                          <button
                            onClick={() => onEditEntry(entry)}
                            className="text-blue-400 hover:text-blue-600"
                            title="View submitted entry (read-only)"
                          >
                            <EyeIcon className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      
                      {entry.notes && (
                        <div className="text-gray-500 truncate">
                          {entry.notes}
                        </div>
                      )}
                      
                      <div className="pt-1">
                        {getStatusBadge(entry)}
                      </div>
                      
                      {entry.rejectionReason && (
                        <div className="pt-1">
                          <div className={`border rounded p-2 text-xs ${
                            entry.rejector?.role === 'FACULTY'
                              ? 'bg-yellow-50 border-yellow-200' 
                              : 'bg-red-50 border-red-200'
                          }`}>
                            <div className={`font-medium mb-1 ${
                              entry.rejector?.role === 'FACULTY'
                                ? 'text-yellow-800' 
                                : 'text-red-800'
                            }`}>
                              Rejected by {entry.rejector ? `${entry.rejector.firstName} ${entry.rejector.lastName}` : 'Supervisor'}
                            </div>
                            <div className={`${
                              entry.rejector?.role === 'FACULTY'
                                ? 'text-yellow-700' 
                                : 'text-red-700'
                            }`}>
                              <strong>Reason:</strong> {entry.rejectionReason}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center">
                  <button
                    onClick={() => onAddEntry(date)}
                    className="text-gray-400 hover:text-gray-600 text-sm"
                    disabled={hasSubmittedEntries}
                    title={hasSubmittedEntries ? "Cannot add entries to submitted week" : "Add hours"}
                  >
                    Add Hours
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {weekEntries.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hours logged for this week
        </div>
      )}

      {/* Journal Form */}
      {showJournalForm && (
        <TimesheetJournalForm
          studentName={studentName}
          onSubmit={handleJournalSubmit}
          onCancel={handleJournalCancel}
          isSubmitting={isSubmittingWeek}
        />
      )}
    </div>
  )
}
