'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowDownTrayIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface TimesheetEntry {
  id: string
  date: string
  hours: number
  category: string
  notes?: string
  approvedAt?: string
  approvedBy?: {
    firstName: string
    lastName: string
  }
}

interface Placement {
  id: string
  site: {
    name: string
  }
  startDate: string
  endDate: string
}

export function MyHoursReport() {
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  })

  const { data: placements, isLoading: placementsLoading } = useQuery({
    queryKey: ['placements'],
    queryFn: async () => {
      const response = await fetch('/api/placements')
      if (!response.ok) throw new Error('Failed to fetch placements')
      return response.json()
    },
  })

  const { data: timesheetEntries, isLoading: entriesLoading } = useQuery({
    queryKey: ['timesheet-entries', dateRange],
    queryFn: async () => {
      if (!placements || placements.length === 0) return []
      
      const activePlacement = placements.find((p: Placement) => p.status === 'ACTIVE')
      if (!activePlacement) return []

      const params = new URLSearchParams()
      if (dateRange.startDate) params.append('startDate', dateRange.startDate)
      if (dateRange.endDate) params.append('endDate', dateRange.endDate)
      
      const response = await fetch(`/api/placements/${activePlacement.id}/timesheets?${params}`)
      if (!response.ok) throw new Error('Failed to fetch timesheet entries')
      return response.json()
    },
    enabled: !!placements && placements.length > 0,
  })

  const handleExportCSV = () => {
    if (!timesheetEntries || timesheetEntries.length === 0) return

    const csvContent = [
      ['Date', 'Hours', 'Category', 'Notes', 'Status', 'Approved By'].join(','),
      ...timesheetEntries.map((entry: TimesheetEntry) => [
        new Date(entry.date).toLocaleDateString(),
        entry.hours,
        entry.category,
        entry.notes || '',
        entry.approvedAt ? 'Approved' : 'Pending',
        entry.approvedBy ? `${entry.approvedBy.firstName} ${entry.approvedBy.lastName}` : ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `my-hours-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  // Calculate hours with proper type checking
  const totalHours = Array.isArray(timesheetEntries) 
    ? timesheetEntries.reduce((sum: number, entry: TimesheetEntry) => {
        const hours = typeof entry.hours === 'number' ? entry.hours : parseFloat(entry.hours) || 0
        return sum + hours
      }, 0)
    : 0

  const approvedHours = Array.isArray(timesheetEntries)
    ? timesheetEntries
        .filter((entry: TimesheetEntry) => entry.approvedAt)
        .reduce((sum: number, entry: TimesheetEntry) => {
          const hours = typeof entry.hours === 'number' ? entry.hours : parseFloat(entry.hours) || 0
          return sum + hours
        }, 0)
    : 0

  const pendingHours = totalHours - approvedHours

  // Debug logging
  console.log('MyHoursReport - timesheetEntries:', timesheetEntries)
  console.log('MyHoursReport - totalHours:', totalHours)
  console.log('MyHoursReport - approvedHours:', approvedHours)
  console.log('MyHoursReport - pendingHours:', pendingHours)

  // Ensure all values are valid numbers
  const safeTotalHours = Number.isFinite(totalHours) ? totalHours : 0
  const safeApprovedHours = Number.isFinite(approvedHours) ? approvedHours : 0
  const safePendingHours = Number.isFinite(pendingHours) ? pendingHours : 0

  if (placementsLoading || entriesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const activePlacement = placements?.find((p: Placement) => p.status === 'ACTIVE')

  if (!activePlacement) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
          <p className="text-gray-600">Export your practicum placement hours</p>
        </div>
        
        <div className="card">
          <div className="text-center py-8">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Placement</h3>
            <p className="text-gray-600">You need an active practicum placement to view hours reports.</p>
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
          <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
          <p className="text-gray-600">Export your practicum placement hours</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={!timesheetEntries || timesheetEntries.length === 0}
          className="bg-yellow-400 text-black hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 px-4 py-2 rounded-lg font-medium transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Placement Info */}
      <div className="card">
        <div className="flex items-center">
          <CalendarIcon className="h-5 w-5 text-yellow-400 mr-3" />
          <div>
            <h3 className="font-medium text-gray-900">Active Placement</h3>
            <p className="text-sm text-gray-600">{activePlacement.site.name}</p>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter by Date Range</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              id="startDate"
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              id="endDate"
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{safeTotalHours.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Total Hours</div>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{safeApprovedHours.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Approved Hours</div>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{safePendingHours.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Pending Hours</div>
          </div>
        </div>
      </div>

      {/* Hours Table */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hours Log</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {timesheetEntries?.map((entry: TimesheetEntry) => (
                <tr key={entry.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(entry.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.hours}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.category}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {entry.notes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      entry.approvedAt 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {entry.approvedAt ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(!timesheetEntries || timesheetEntries.length === 0) && (
          <div className="text-center py-8">
            <p className="text-gray-500">No hours logged for the selected date range</p>
          </div>
        )}
      </div>
    </div>
  )
}
