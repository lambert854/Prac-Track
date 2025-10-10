'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { 
  UserGroupIcon, 
  ClockIcon, 
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface SupervisorDashboardProps {
  user: {
    id: string
    name: string
    supervisorProfile?: {
      organizationName: string
      title?: string
    }
  }
}

export function SupervisorDashboard({ user }: SupervisorDashboardProps) {
  const router = useRouter()
  
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['supervisor-dashboard', user.id],
    queryFn: async () => {
      const response = await fetch(`/api/supervisor/${user.id}/dashboard`)
      if (!response.ok) throw new Error('Failed to fetch dashboard data')
      return response.json()
    },
  })

  const handleTaskClick = (task: any) => {
    if (task.type === 'timesheet') {
      router.push('/supervisor/timesheets')
    } else if (task.type === 'form') {
      router.push('/supervisor/forms')
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

  const { 
    assignedStudents = [], 
    pendingTimesheets = [], 
    pendingForms = [], 
    summaryStats = {} 
  } = dashboardData || {}

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="card rounded-lg">
        <h1 className="text-2xl font-bold text-gray-900">Supervisor Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome, {user.name}! 
          {user.supervisorProfile && (
            <span className="ml-2 text-sm">
              {user.supervisorProfile.title ? `${user.supervisorProfile.title} - ` : ''}{user.supervisorProfile.organizationName}
            </span>
          )}
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <button 
          onClick={() => router.push('/supervisor/students')}
          className="card card-hover cursor-pointer"
        >
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Assigned Students</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.assignedStudents || 0}</p>
            </div>
          </div>
        </button>
        
        <button 
          onClick={() => router.push('/supervisor/timesheets')}
          className="card card-hover cursor-pointer"
        >
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Timesheets</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.pendingTimesheets || 0}</p>
            </div>
          </div>
        </button>
        
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card card-hover">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-primary mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Students</h3>
              <p className="text-sm text-gray-600">View assigned students</p>
            </div>
          </div>
          <div className="mt-4">
            <button 
              onClick={() => router.push('/supervisor/students')}
              className="btn-primary w-full text-center block"
            >
              Manage
            </button>
          </div>
        </div>

        <div className="card card-hover">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-primary mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Timesheets</h3>
              <p className="text-sm text-gray-600">Approve timesheets</p>
            </div>
          </div>
          <div className="mt-4">
            <button 
              onClick={() => router.push('/supervisor/timesheets')}
              className="btn-primary w-full text-center block"
            >
              Manage
            </button>
          </div>
        </div>

        <div className="card card-hover">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-primary mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Forms</h3>
              <p className="text-sm text-gray-600">Review evaluations</p>
            </div>
          </div>
          <div className="mt-4">
            <button 
              onClick={() => router.push('/supervisor/forms')}
              className="btn-primary w-full text-center block"
            >
              Manage
            </button>
          </div>
        </div>
      </div>

      {/* Assigned Students */}
      {assignedStudents.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Students</h2>
          <div className="space-y-3">
            {assignedStudents.slice(0, 5).map((student: any) => (
              <button
                key={student.id}
                onClick={() => router.push(`/supervisor/students`)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 hover:shadow-sm transition-all duration-200 text-left cursor-pointer"
              >
                <div className="flex items-center">
                  <UserGroupIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{student.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {student.activePlacement ? (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  ) : student.studentPlacements && student.studentPlacements.length > 0 ? (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      Completed
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      No Placement
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
          {assignedStudents.length > 5 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => router.push('/supervisor/students')}
                className="text-primary hover:text-accent text-sm"
              >
                View all {assignedStudents.length} students
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pending Tasks */}
      {(pendingTimesheets.length > 0 || pendingForms.length > 0) && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Tasks</h2>
          <div className="space-y-3">
            {pendingTimesheets.map((timesheet: any, index: number) => (
              <button
                key={`timesheet-${index}`}
                onClick={() => handleTaskClick({ type: 'timesheet' })}
                className="w-full flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 hover:border-yellow-300 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 text-yellow-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900">
                    Approve timesheet for {timesheet.placement?.student?.firstName} {timesheet.placement?.student?.lastName}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                    High
                  </span>
                  <span className="text-xs text-gray-500">Click to review →</span>
                </div>
              </button>
            ))}
            
            {pendingForms.map((form: any, index: number) => (
              <button
                key={`form-${index}`}
                onClick={() => handleTaskClick({ type: 'form' })}
                className="w-full flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center">
                  <DocumentTextIcon className="h-5 w-5 text-blue-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900">
                    Review {form.template.title} for {form.placement?.student?.firstName} {form.placement?.student?.lastName}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    Medium
                  </span>
                  <span className="text-xs text-gray-500">Click to review →</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}