'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { ClockIcon, DocumentTextIcon, CheckCircleIcon, ExclamationTriangleIcon, PlusIcon } from '@heroicons/react/24/outline'
import { AddHoursModal } from '@/components/timesheets/add-hours-modal'

interface StudentDashboardProps {
  user: {
    id: string
    name: string
    studentProfile?: {
      requiredHours: number
      program: string
      cohort: string
    }
  }
}

export function StudentDashboard({ user }: StudentDashboardProps) {
  const router = useRouter()
  const [showAddHoursModal, setShowAddHoursModal] = useState(false)
  
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['student-dashboard', user.id],
    queryFn: async () => {
      const response = await fetch(`/api/students/${user.id}/dashboard`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch dashboard data')
      return response.json()
    },
  })

  const handleTaskClick = (task: any) => {
    if (task.type === 'form') {
      router.push('/forms')
    } else if (task.type === 'timesheet') {
      router.push('/timesheets')
    } else {
      // Default to forms page for other task types
      router.push('/forms')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="card">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  const { placement, pendingApplications, timesheetSummary, pendingTasks } = dashboardData || {}

  const requiredHours = placement?.requiredHours || user.studentProfile?.requiredHours || 0
  const progressPercentage = requiredHours 
    ? Math.min((timesheetSummary?.approvedHours || 0) / requiredHours * 100, 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="card rounded-lg p-6 shadow-sm border">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}!</h1>
        <p className="mt-1 text-gray-600">
          {user.studentProfile?.program} - {user.studentProfile?.cohort} Cohort
        </p>
      </div>

      {/* Progress Overview */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Practicum Placement Progress</h2>
        
        {placement ? (
          <div className="space-y-6">
            {/* Active Placement Information */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2">Active Placement</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-green-800"><strong>Site:</strong> {placement.site?.name}</p>
                  <p className="text-green-800"><strong>Supervisor:</strong> {placement.supervisor ? `${placement.supervisor.firstName} ${placement.supervisor.lastName}` : 'Not Assigned'}</p>
                </div>
                <div>
                  <p className="text-green-800"><strong>Class:</strong> {placement.class?.name || 'Unknown Class'}</p>
                  <p className="text-green-800"><strong>Required Hours:</strong> {placement.requiredHours || user.studentProfile?.requiredHours || 0}</p>
                </div>
              </div>
            </div>

            {/* Hours Progress */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Hours Completed</span>
                <span className="text-sm text-gray-600">
                  {timesheetSummary?.approvedHours || 0} / {placement.requiredHours || user.studentProfile?.requiredHours || 0} hours
                </span>
              </div>
              
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{timesheetSummary?.approvedHours || 0}</div>
                  <div className="text-sm text-gray-600">Approved Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{timesheetSummary?.pendingHours || 0}</div>
                  <div className="text-sm text-gray-600">Pending Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {Math.max(0, (placement.requiredHours || user.studentProfile?.requiredHours || 0) - (timesheetSummary?.approvedHours || 0))}
                  </div>
                  <div className="text-sm text-gray-600">Remaining Hours</div>
                </div>
              </div>
            </div>
          </div>
        ) : pendingApplications && pendingApplications.length > 0 ? (
          <div className="space-y-4">
            <div className="text-center py-4">
              <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Pending Applications</h3>
              <p className="text-gray-600 mb-4">You have placement applications under review.</p>
            </div>
            
        {pendingApplications.map((app: any) => (
          <div key={app.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{app.site.name}</h4>
                <p className="text-sm text-gray-600">
                  {app.status === 'PENDING' ? 'Pending Review' : 'Approved'}
                </p>
                <p className="text-xs text-gray-500">
                  {app.class?.name || 'Unknown Class'} • {app.requiredHours} hours
                </p>
                {app.status === 'APPROVED_PENDING_CHECKLIST' && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                      Checklist Required
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  app.status === 'PENDING' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {app.status === 'PENDING' ? 'Pending' : 'Approved'}
                </span>
                    <a 
                      href={`/placements/pending/${app.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details
                    </a>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="text-center">
              <a href="/placements/browse" className="btn-primary">
                Browse More Sites
              </a>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Placement</h3>
            <p className="text-gray-600 mb-4">You don't have an active practicum placement yet.</p>
            <a href="/placements/browse" className="btn-primary">
              Browse Available Sites
            </a>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card card-hover">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-primary mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Log Hours</h3>
              <p className="text-sm text-gray-600">Record your field hours</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <button
              onClick={() => setShowAddHoursModal(true)}
              className="btn-primary w-full flex items-center justify-center"
              disabled={!placement?.id}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Hours
            </button>
            <a href="/timesheets" className="btn-outline w-full text-center block">
              Manage All
            </a>
          </div>
        </div>

        <div className="card card-hover">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-primary mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Submitted Forms</h3>
              <p className="text-sm text-gray-600">Document Library</p>
            </div>
          </div>
          <div className="mt-4">
            <a href="/forms" className="btn-primary w-full text-center block">
              Manage
            </a>
          </div>
        </div>

        <div className="card card-hover">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-primary mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">My Reports</h3>
              <p className="text-sm text-gray-600">Export timesheet data</p>
            </div>
          </div>
          <div className="mt-4">
            <a href="/reports/my-hours" className="btn-primary w-full text-center block">
              Manage
            </a>
          </div>
        </div>
      </div>

      {/* Pending Tasks */}
      {pendingTasks && pendingTasks.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Tasks</h2>
          <div className="space-y-3">
            {pendingTasks.map((task: any, index: number) => (
              <button
                key={index}
                onClick={() => handleTaskClick(task)}
                className="w-full flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 hover:border-yellow-300 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900">{task.title}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                    {task.priority}
                  </span>
                  <span className="text-xs text-gray-500">Click to complete →</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add Hours Modal */}
      {placement?.id && (
        <AddHoursModal
          isOpen={showAddHoursModal}
          onClose={() => setShowAddHoursModal(false)}
          placementId={placement.id}
        />
      )}
    </div>
  )
}
