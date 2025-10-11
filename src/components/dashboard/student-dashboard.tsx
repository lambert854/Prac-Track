'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { ClockIcon, DocumentTextIcon, CheckCircleIcon, ExclamationTriangleIcon, PlusIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline'
import { AddHoursModal } from '@/components/timesheets/add-hours-modal'
import { endOfTodayLocal } from '@/lib/dates'

interface StudentDashboardProps {
  user: {
    id: string
    name: string
    studentProfile?: {
      id: string
      requiredHours: number
      program: string
      cohort: string
    }
  }
}

export function StudentDashboard({ user }: StudentDashboardProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showAddHoursModal, setShowAddHoursModal] = useState(false)
  const [archivePlacementId, setArchivePlacementId] = useState<string | null>(null)
  
  
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['student-dashboard', user.studentProfile?.id],
    queryFn: async () => {
      if (!user.studentProfile?.id) {
        throw new Error('Student profile not found')
      }
      const response = await fetch(`/api/students/${user.studentProfile.id}/dashboard`, {
        credentials: 'include'
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      return response.json()
    },
    enabled: !!user.studentProfile?.id,
  })

  const { mutate: mutateArchive, isPending: isArchiving } = useMutation({
    mutationFn: async (placementId: string) => {
      const res = await fetch(`/api/placements/${placementId}/archive`, { 
        method: "POST",
        credentials: 'include'
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Archive failed")
      }
      return res.json() as Promise<{ studentHasOtherActive: boolean }>
    },
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['studentPlacements'] }),
        queryClient.invalidateQueries({ queryKey: ['student-dashboard', user.id] }),
        queryClient.invalidateQueries({ queryKey: ['supervisorStudents'] }),
        queryClient.invalidateQueries({ queryKey: ['facultyStudents'] }),
      ])
      setArchivePlacementId(null)
    },
    onError: (error) => {
      console.error('Archive error:', error)
      // You might want to show a toast notification here
    }
  })

  const handleTaskClick = (task: any) => {
    if (task.type === 'evaluation') {
      // Navigate directly to the evaluation form using the submission ID
      if (task.evaluationId) {
        router.push(`/forms/evaluations/${task.evaluationId}`)
      } else {
        // Fallback to forms page if no evaluation ID
        router.push('/forms')
      }
    } else if (task.type === 'form') {
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

  if (error) {
    console.error('Dashboard error:', error)
    console.error('User data:', user)
    console.error('Student profile:', user.studentProfile)
    // Temporarily show the dashboard even with errors to debug
    // return (
    //   <div className="space-y-6">
    //     <div className="card">
    //       <div className="text-red-600">
    //         <h2 className="text-lg font-semibold mb-2">Error loading dashboard</h2>
    //         <p className="text-sm">{error.message}</p>
    //         <details className="mt-2">
    //           <summary className="cursor-pointer text-xs text-gray-500">Debug info</summary>
    //           <pre className="text-xs mt-1 p-2 bg-gray-100 rounded overflow-auto">
    //             {JSON.stringify({ 
    //               userId: user.id, 
    //               studentProfileId: user.studentProfile?.id,
    //               hasStudentProfile: !!user.studentProfile,
    //               error: error.message 
    //             }, null, 2)}
    //           </pre>
    //         </details>
    //       </div>
    //     </div>
    //   </div>
    // )
  }

  const { placement, pendingApplications, rejectedPlacement, timesheetSummary, approvedHours, pendingTasks } = dashboardData || {}

  // Debug logging
  console.log('Dashboard data received:', dashboardData)
  console.log('Placement found:', placement)
  console.log('Placement status:', placement?.status)
  console.log('User object:', user)
  console.log('Student Profile ID being used:', user.studentProfile?.id)

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

      {/* Rejection Notice */}
      {rejectedPlacement && (
        <div className="card border-red-200 bg-red-50">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mt-1 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Placement Application Rejected</h3>
              <div className="space-y-2 text-sm text-red-700">
                <p>
                  <strong>Site:</strong> {rejectedPlacement.site?.name || 'Unknown Site'}
                </p>
                <p>
                  <strong>Rejected on:</strong> {rejectedPlacement.declinedAt ? new Date(rejectedPlacement.declinedAt).toLocaleDateString() : 'Unknown date'}
                </p>
                {rejectedPlacement.facultyNotes && (
                  <div className="mt-3">
                    <p className="font-medium">Reason for rejection:</p>
                    <p className="mt-1 p-3 bg-red-100 border border-red-200 rounded text-red-800">
                      {rejectedPlacement.facultyNotes}
                    </p>
                  </div>
                )}
                <p className="mt-3">
                  You can apply for a new placement at any time. The rejection notice will be removed when you submit a new application.
                </p>
              </div>
              <div className="mt-4">
                <a href="/placements/browse" className="btn-primary">
                  Browse Available Sites
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Overview */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Practicum Placement Progress</h2>
        
        {placement ? (
          <div className="space-y-6">
            {/* Active Placement Information */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-green-900">Active Placement</h3>
                {(() => {
                  const remaining = (placement.requiredHours || user.studentProfile?.requiredHours || 0) - (approvedHours || 0)
                  const eligible = remaining <= 0 && new Date(placement.endDate) <= endOfTodayLocal()
                  
                  return eligible && (
                    <button
                      onClick={() => setArchivePlacementId(placement.id)}
                      className="flex items-center px-3 py-1 rounded border bg-white hover:bg-gray-50 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                      disabled={isArchiving}
                    >
                      <ArchiveBoxIcon className="h-4 w-4 mr-1" />
                      {isArchiving ? 'Archiving...' : 'Archive'}
                    </button>
                  )
                })()}
              </div>
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
          <button 
            key={app.id} 
            onClick={() => router.push(`/placements/pending/${app.id}`)}
            className="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-4 hover:bg-yellow-100 hover:border-yellow-300 transition-all duration-200 text-left"
          >
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
                  <div className="mt-2 flex flex-wrap gap-2">
                    {!app.cellPolicy && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                        Fair Use Policies
                      </span>
                    )}
                    {!app.learningContract && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                        Learning Contract
                      </span>
                    )}
                    {!app.checklist && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                        Checklist Required
                      </span>
                    )}
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
              </div>
            </div>
          </button>
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

      {/* Archive Confirmation Modal */}
      {archivePlacementId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full">
                <ArchiveBoxIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="mt-2 px-7 py-3">
                <h3 className="text-lg font-medium text-gray-900 text-center">Archive Placement</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500 text-center">
                    Are you sure you want to archive this placement? This action cannot be undone. 
                    The placement will be removed from your dashboard and moved to <strong>Archived</strong> in My Placements.
                  </p>
                </div>
                <div className="flex justify-center space-x-3 mt-4">
                  <button
                    onClick={() => setArchivePlacementId(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => mutateArchive(archivePlacementId)}
                    disabled={isArchiving}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {isArchiving ? 'Archiving...' : 'Archive'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
