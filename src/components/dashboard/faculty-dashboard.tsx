'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { 
  UserGroupIcon, 
  ClipboardDocumentListIcon, 
  DocumentTextIcon, 
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { PlacementRequestDetailsModal } from './placement-request-details-modal'
import { EvaluationSendButtons } from '@/components/faculty/EvaluationSendButtons'

interface FacultyDashboardProps {
  user: {
    id: string
    name: string
    facultyProfile?: {
      id: string
      title?: string
      officePhone?: string
      honorific?: string
      roomNumber?: string
    }
  }
}

export function FacultyDashboard({ user }: FacultyDashboardProps) {
  const router = useRouter()
  const [viewingPlacement, setViewingPlacement] = useState<any>(null)
  
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['faculty-dashboard', user.id],
    queryFn: async () => {
      const response = await fetch(`/api/faculty/${user.id}/dashboard`)
      if (!response.ok) throw new Error('Failed to fetch dashboard data')
      return response.json()
    },
  })

  const handleTaskClick = (task: any) => {
    if (task.type === 'placement') {
      router.push('/admin/placements')
    } else if (task.type === 'form') {
      router.push('/admin/forms')
    } else if (task.type === 'student') {
      router.push('/admin/students')
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
    pendingPlacements = [], 
    pendingForms = [], 
    classMismatchNotifications = [],
    summaryStats = {} 
  } = dashboardData || {}

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="card rounded-lg p-6 shadow-sm border">
        <h1 className="text-2xl font-bold text-gray-900">Faculty Dashboard</h1>
        <p className="mt-1 text-gray-600">
          Welcome, {user.name}! 
          {user.facultyProfile?.title && (
            <span className="ml-2 text-sm">
              {user.facultyProfile.title}
            </span>
          )}
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <div 
          className="card card-hover cursor-pointer"
          onClick={() => router.push('/faculty/students')}
        >
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <UserGroupIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Assigned Students</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.assignedStudents || 0}</p>
            </div>
          </div>
        </div>
        
        <div 
          className="card card-hover cursor-pointer"
          onClick={() => router.push('/faculty/students?filter=pending-placements')}
        >
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <ClipboardDocumentListIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Pending Placements</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.pendingPlacements || 0}</p>
            </div>
          </div>
        </div>
        
        
        <div className="card">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <DocumentTextIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Pending Evaluations</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.pendingForms || 0}</p>
            </div>
          </div>
        </div>
        
        <div 
          className="card card-hover cursor-pointer"
          onClick={() => router.push('/faculty/students?filter=with-placements')}
        >
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <ClockIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Active Placements</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.approvedPlacements || 0}</p>
            </div>
          </div>
        </div>
        
        <div 
          className="card card-hover cursor-pointer"
          onClick={() => router.push('/admin/sites')}
        >
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Pending Agencies</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.pendingSites || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Evaluation Send Buttons */}
      <EvaluationSendButtons />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card card-hover">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-primary mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">My Students</h3>
              <p className="text-sm text-gray-600">View assigned students</p>
            </div>
          </div>
          <div className="mt-4">
            <button 
              onClick={() => router.push('/faculty/students')}
              className="btn-primary w-full text-center block"
            >
              Manage
            </button>
          </div>
        </div>

        <div className="card card-hover">
          <div className="flex items-center">
            <ClipboardDocumentListIcon className="h-8 w-8 text-primary mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Placements</h3>
              <p className="text-sm text-gray-600">Approve placement requests</p>
            </div>
          </div>
          <div className="mt-4">
            <button 
              onClick={() => router.push('/admin/placements')}
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
              onClick={() => router.push('/admin/forms')}
              className="btn-primary w-full text-center block"
            >
              Manage
            </button>
          </div>
        </div>
      </div>

      {/* Pending Tasks */}
      {(pendingPlacements.length > 0 || pendingForms.length > 0 || classMismatchNotifications.length > 0) && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Tasks</h2>
          <div className="space-y-3">
            {pendingPlacements.map((placement: any, index: number) => (
              <button
                key={`placement-${index}`}
                onClick={() => router.push(`/placements/pending/${placement.id}`)}
                className="w-full flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 hover:border-yellow-300 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center">
                  <ClipboardDocumentListIcon className="h-5 w-5 text-yellow-600 mr-3" />
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      Placement request from {placement.student.firstName} {placement.student.lastName}
                    </span>
                    <p className="text-xs text-gray-600">
                      {placement.site.name} • {placement.class?.name || 'Unknown Class'} • {placement.requiredHours}h
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(placement.startDate).toLocaleDateString()} - {new Date(placement.endDate).toLocaleDateString()}
                    </p>
                    {/* Additional indicators */}
                    <div className="flex items-center space-x-2 mt-1">
                      {placement.pendingSupervisor && placement.pendingSupervisor.status === 'PENDING' && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                          <UserGroupIcon className="h-3 w-3 mr-1" />
                          Supervisor Approval
                        </span>
                      )}
                      {placement.cellPolicy && placement.learningContract ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Files Uploaded
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                          Files Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    placement.status === 'PENDING' ? 'text-red-600 bg-red-100' : 
                    placement.status === 'APPROVED_PENDING_CHECKLIST' && !placement.checklist ? 'text-yellow-600 bg-yellow-100' :
                    placement.status === 'APPROVED_PENDING_CHECKLIST' && placement.checklist ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100'
                  }`}>
                    {placement.status === 'PENDING' ? 'Review Required' : 
                     placement.status === 'APPROVED_PENDING_CHECKLIST' && !placement.checklist ? 'Waiting on checklist' :
                     placement.status === 'APPROVED_PENDING_CHECKLIST' && placement.checklist ? 'Checklist Complete' : 'Pending'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {placement.status === 'APPROVED_PENDING_CHECKLIST' && placement.checklist ? 'Review Final Approval →' : 'Click to review →'}
                  </span>
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
                    Review {form.template.title} for {form.student.firstName} {form.student.lastName}
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
            
            {classMismatchNotifications.map((notification: any, index: number) => (
              <div
                key={`mismatch-${index}`}
                className="w-full flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">
                    High Priority
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Placement Request Details Modal */}
      {viewingPlacement && (
        <PlacementRequestDetailsModal
          placement={viewingPlacement}
          onClose={() => setViewingPlacement(null)}
        />
      )}
    </div>
  )
}