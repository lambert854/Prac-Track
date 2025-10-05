'use client'

import { useState, useEffect } from 'react'
import { PencilIcon, CheckIcon, ClockIcon } from '@heroicons/react/24/outline'

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

interface TimesheetWeekViewProps {
  placementId: string
  entries: TimesheetEntry[]
  onEditEntry: (entry: TimesheetEntry) => void
  onAddEntry: (date: string) => void
  onSubmitWeek: (data: { startDate: string; endDate: string }) => void
  isSubmittingWeek: boolean
}

export function TimesheetWeekView({
  placementId,
  entries,
  onEditEntry,
  onAddEntry,
  onSubmitWeek,
  isSubmittingWeek,
}: TimesheetWeekViewProps) {
  // Generate work weeks for the dropdown
  const generateWorkWeeks = () => {
    const weeks = []
    const today = new Date()
    const currentWeekStart = new Date(today)
    currentWeekStart.setDate(today.getDate() - today.getDay()) // Go to Sunday
    
    // Generate 12 weeks: 6 weeks before current, current week, 5 weeks after
    for (let i = -6; i <= 5; i++) {
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
    // Use UTC methods to avoid timezone conversion issues
    const entryDateObj = new Date(entry.date)
    const entryDate = `${entryDateObj.getUTCFullYear()}-${String(entryDateObj.getUTCMonth() + 1).padStart(2, '0')}-${String(entryDateObj.getUTCDate()).padStart(2, '0')}`
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
      // Use UTC methods to avoid timezone conversion issues
      const entryDateObj = new Date(entry.date)
      const entryDate = `${entryDateObj.getUTCFullYear()}-${String(entryDateObj.getUTCMonth() + 1).padStart(2, '0')}-${String(entryDateObj.getUTCDate()).padStart(2, '0')}`
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
    onSubmitWeek({ startDate, endDate })
  }

  const totalHours = weekEntries.reduce((sum, entry) => {
    const hours = typeof entry.hours === 'number' ? entry.hours : parseFloat(entry.hours) || 0
    console.log(`Adding hours: ${hours} from entry:`, entry)
    return sum + hours
  }, 0)
  
  // Ensure totalHours is a valid number
  const safeTotalHours = Number.isFinite(totalHours) ? totalHours : 0
  
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
                        {!entry.locked && (
                          <button
                            onClick={() => onEditEntry(entry)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <PencilIcon className="h-3 w-3" />
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
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center">
                  <button
                    onClick={() => onAddEntry(date)}
                    className="text-gray-400 hover:text-gray-600 text-sm"
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
    </div>
  )
}
