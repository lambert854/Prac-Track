'use client'

import { useQuery } from '@tanstack/react-query'
import { 
  UserGroupIcon, 
  BuildingOfficeIcon, 
  ClipboardDocumentListIcon, 
  ChartBarIcon, 
  CogIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

interface AdminDashboardProps {
  user: {
    id: string
    name: string
  }
}

interface DashboardData {
  summary: {
    totalStudents: number
    totalSites: number
    totalPlacements: number
    totalFaculty: number
    totalSupervisors: number
  }
  alerts: {
    pendingPlacements: number
    studentsWithoutPlacements: number
    expiredAgreements: number
    expiringAgreements: number
    pendingTimesheets: number
  }
  activity: {
    newUsersThisWeek: number
  }
  notifications?: {
    classMismatches: any[]
  }
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const { data: dashboardData, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/admin/dashboard', {
        credentials: 'include'
      })
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }
      return response.json()
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  if (error) {
    console.error('Dashboard error:', error)
  }
  return (
    <div className="space-y-6">
      <div className="card rounded-lg p-6 shadow-sm border">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-gray-600">Welcome, {user.name}!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <div className="card card-hover flex flex-col h-full">
          <div className="flex items-center flex-grow">
            <UserGroupIcon className="h-8 w-8 text-primary mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Students</h3>
              <p className="text-sm text-gray-600">Manage student roster</p>
            </div>
          </div>
          <div className="mt-4">
            <a href="/admin/students" className="btn-primary w-full text-center block whitespace-nowrap">
              Manage
            </a>
          </div>
        </div>

        <div className="card card-hover flex flex-col h-full">
          <div className="flex items-center flex-grow">
            <BuildingOfficeIcon className="h-8 w-8 text-primary mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Sites</h3>
              <p className="text-sm text-gray-600">Manage field sites</p>
            </div>
          </div>
          <div className="mt-4">
            <a href="/admin/sites" className="btn-primary w-full text-center block whitespace-nowrap">
              Manage
            </a>
          </div>
        </div>

        <div className="card card-hover flex flex-col h-full">
          <div className="flex items-center flex-grow">
            <ClipboardDocumentListIcon className="h-8 w-8 text-primary mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Placements</h3>
              <p className="text-sm text-gray-600">Approve placements</p>
            </div>
          </div>
          <div className="mt-4">
            <a href="/admin/placements" className="btn-primary w-full text-center block whitespace-nowrap">
              Manage
            </a>
          </div>
        </div>

        <div className="card card-hover flex flex-col h-full">
          <div className="flex items-center flex-grow">
            <AcademicCapIcon className="h-8 w-8 text-primary mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Class Management</h3>
              <p className="text-sm text-gray-600">Manage classes & terms</p>
            </div>
          </div>
          <div className="mt-4">
            <a href="/admin/classes" className="btn-primary w-full text-center block whitespace-nowrap">
              Manage
            </a>
          </div>
        </div>

        <div className="card card-hover flex flex-col h-full">
          <div className="flex items-center flex-grow">
            <ChartBarIcon className="h-8 w-8 text-primary mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Reports</h3>
              <p className="text-sm text-gray-600">Generate reports</p>
            </div>
          </div>
          <div className="mt-4">
            <a href="/admin/reports" className="btn-primary w-full text-center block whitespace-nowrap">
              Manage
            </a>
          </div>
        </div>

        <div className="card card-hover flex flex-col h-full">
          <div className="flex items-center flex-grow">
            <CogIcon className="h-8 w-8 text-primary mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">User Management</h3>
              <p className="text-sm text-gray-600">Manage user accounts</p>
            </div>
          </div>
          <div className="mt-4">
            <a href="/admin/settings" className="btn-primary w-full text-center block whitespace-nowrap">
              Manage
            </a>
          </div>
        </div>
      </div>

      {/* System Status & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attention Required */}
        <div className="card">
          <div className="flex items-center mb-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">🚨 Attention Required</h2>
          </div>
          
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ) : (
            <ul className="space-y-3">
              {dashboardData?.alerts.expiredAgreements ? (
                <li className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <a href="/admin/sites" className="text-red-700 hover:text-red-900 font-medium">
                      {dashboardData.alerts.expiredAgreements} Site agreement{dashboardData.alerts.expiredAgreements !== 1 ? 's' : ''} expired
                    </a>
                    <p className="text-sm text-gray-600">Action needed: Renew expired agreements</p>
                  </div>
                </li>
              ) : null}
              
              {dashboardData?.alerts.expiringAgreements ? (
                <li className="flex items-start">
                  <ClockIcon className="h-5 w-5 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <a href="/admin/sites" className="text-orange-700 hover:text-orange-900 font-medium">
                      {dashboardData.alerts.expiringAgreements} Site agreement{dashboardData.alerts.expiringAgreements !== 1 ? 's' : ''} expiring this month
                    </a>
                    <p className="text-sm text-gray-600">Consider sending renewal reminders</p>
                  </div>
                </li>
              ) : null}
              
              {dashboardData?.alerts.studentsWithoutPlacements ? (
                <li className="flex items-start">
                  <UserGroupIcon className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <a href="/admin/students" className="text-yellow-700 hover:text-yellow-900 font-medium">
                      {dashboardData.alerts.studentsWithoutPlacements} Student{dashboardData.alerts.studentsWithoutPlacements !== 1 ? 's' : ''} without placements
                    </a>
                    <p className="text-sm text-gray-600">Students need placement assignments</p>
                  </div>
                </li>
              ) : null}
              
              {dashboardData?.alerts.pendingPlacements ? (
                <li className="flex items-start">
                  <ClipboardDocumentListIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <a href="/admin/placements" className="text-blue-700 hover:text-blue-900 font-medium">
                      {dashboardData.alerts.pendingPlacements} Placement{dashboardData.alerts.pendingPlacements !== 1 ? 's' : ''} pending approval
                    </a>
                    <p className="text-sm text-gray-600">Review and approve pending placements</p>
                  </div>
                </li>
              ) : null}
              
              
              {dashboardData?.alerts.pendingTimesheets ? (
                <li className="flex items-start">
                  <ClockIcon className="h-5 w-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-purple-700 font-medium">
                      {dashboardData.alerts.pendingTimesheets} Timesheet{dashboardData.alerts.pendingTimesheets !== 1 ? 's' : ''} pending approval
                    </span>
                    <p className="text-sm text-gray-600">Supervisors and faculty need to review timesheets</p>
                  </div>
                </li>
              ) : null}
              
              {dashboardData?.notifications?.classMismatches?.length ? (
                <li className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <a href="/admin/faculty-assignments" className="text-red-700 hover:text-red-900 font-medium">
                      {dashboardData.notifications.classMismatches.length} Faculty-class mismatch{dashboardData.notifications.classMismatches.length !== 1 ? 'es' : ''} detected
                    </a>
                    <p className="text-sm text-gray-600">Students applied for classes not taught by their assigned faculty</p>
                  </div>
                </li>
              ) : null}
              
              {!dashboardData?.alerts.expiredAgreements && 
               !dashboardData?.alerts.expiringAgreements && 
               !dashboardData?.alerts.studentsWithoutPlacements && 
               !dashboardData?.alerts.pendingPlacements && 
               !dashboardData?.alerts.pendingTimesheets && 
               !dashboardData?.notifications?.classMismatches?.length && (
                <li className="flex items-start text-green-700">
                  <InformationCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <span>No urgent items requiring attention</span>
                </li>
              )}
            </ul>
          )}
        </div>

        {/* This Week's Activity */}
        <div className="card">
          <div className="flex items-center mb-4">
            <InformationCircleIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">📈 System Overview</h2>
          </div>
          
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">This Week's Activity</h3>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    <span className="font-medium mr-1">{dashboardData?.activity.newUsersThisWeek || 0}</span>
                    <span className="text-gray-600">New user{dashboardData?.activity.newUsersThisWeek !== 1 ? 's' : ''} registered</span>
                  </li>
                </ul>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">System Summary</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between text-sm">
                    <span className="text-gray-600">Active Students:</span>
                    <span className="font-medium">{dashboardData?.summary.totalStudents || 0}</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span className="text-gray-600">Active Sites:</span>
                    <span className="font-medium">{dashboardData?.summary.totalSites || 0}</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span className="text-gray-600">Approved Placements:</span>
                    <span className="font-medium">{dashboardData?.summary.totalPlacements || 0}</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span className="text-gray-600">Faculty Members:</span>
                    <span className="font-medium">{dashboardData?.summary.totalFaculty || 0}</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span className="text-gray-600">Supervisors:</span>
                    <span className="font-medium">{dashboardData?.summary.totalSupervisors || 0}</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
