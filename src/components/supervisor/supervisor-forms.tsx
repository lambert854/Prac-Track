'use client'

import { useQuery } from '@tanstack/react-query'
import { DocumentTextIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline'

interface SupervisorFormsProps {
  supervisorId: string
}

interface FormSubmission {
  id: string
  type: string
  status: string
  displayStatus: string
  student: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  placement: {
    site: {
      id: string
      name: string
    }
  }
  faculty: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
  submittedAt: Date | null
  supervisorSignedAt: Date | null
  facultySignedAt: Date | null
  createdAt: Date
  updatedAt: Date
  metadata: any
}

export function SupervisorForms({ supervisorId }: SupervisorFormsProps) {
  // Fetch supervisor forms
  const { data: formsData, isLoading, error } = useQuery({
    queryKey: ['supervisor-forms', supervisorId],
    queryFn: async () => {
      const response = await fetch(`/api/supervisor/${supervisorId}/forms`)
      if (!response.ok) {
        throw new Error('Failed to fetch forms')
      }
      return response.json()
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Not provided'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending Signature':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'Supervisor Signed':
        return <CheckCircleIcon className="h-5 w-5 text-blue-500" />
      case 'Faculty Signed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'Completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'Rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending Signature':
        return 'bg-yellow-100 text-yellow-800'
      case 'Supervisor Signed':
        return 'bg-blue-100 text-blue-800'
      case 'Faculty Signed':
        return 'bg-green-100 text-green-800'
      case 'Completed':
        return 'bg-green-100 text-green-800'
      case 'Rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getFormTypeDisplayName = (type: string) => {
    switch (type) {
      case 'LEARNING_CONTRACT':
        return 'Student Learning Contract'
      case 'CELL_PHONE_POLICY':
        return 'Cell Phone Usage Policy'
      case 'PLACEMENT_CHECKLIST':
        return 'Placement Checklist'
      case 'EVALUATION':
        return 'Evaluation Form'
      case 'TIMESHEET':
        return 'Timesheet'
      default:
        return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
    }
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
        <p className="text-red-800">Error loading forms: {error.message}</p>
      </div>
    )
  }

  const forms: FormSubmission[] = formsData?.forms || []
  const totalForms = formsData?.totalForms || 0

  // Group forms by status for better organization
  const formsByStatus = forms.reduce((acc, form) => {
    const status = form.displayStatus
    if (!acc[status]) {
      acc[status] = []
    }
    acc[status].push(form)
    return acc
  }, {} as Record<string, FormSubmission[]>)

  const statusOrder = ['Pending Signature', 'Supervisor Signed', 'Faculty Signed', 'Completed', 'Rejected']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">My Forms</h1>
        <p className="text-gray-600 mt-2">
          Forms that have been sent to you or signed by you
        </p>
        <div className="mt-4 flex items-center space-x-4">
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {totalForms} Total Forms
          </div>
        </div>
      </div>

      {/* Forms by Status */}
      {forms.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="text-gray-500 text-lg mt-4">No forms found</p>
          <p className="text-gray-400 mt-2">Forms sent to you or signed by you will appear here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {statusOrder.map(status => {
            const statusForms = formsByStatus[status]
            if (!statusForms || statusForms.length === 0) return null

            return (
              <div key={status} className="bg-white shadow rounded-lg">
                {/* Status Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(status)}
                    <h2 className="text-lg font-medium text-gray-900">{status}</h2>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
                      {statusForms.length} form{statusForms.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Forms List */}
                <div className="divide-y divide-gray-200">
                  {statusForms.map((form) => (
                    <div key={form.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                            <div>
                              <h3 className="text-sm font-medium text-gray-900">
                                {getFormTypeDisplayName(form.type)}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Student: {form.student.firstName} {form.student.lastName}
                              </p>
                              <p className="text-sm text-gray-500">
                                Site: {form.placement.site.name}
                              </p>
                              {form.faculty && (
                                <p className="text-sm text-gray-500">
                                  Faculty: {form.faculty.firstName} {form.faculty.lastName}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(form.displayStatus)}`}>
                            {form.displayStatus}
                          </span>
                          <div className="text-xs text-gray-500 text-right">
                            {form.submittedAt && (
                              <div>Submitted: {formatDate(form.submittedAt)}</div>
                            )}
                            {form.supervisorSignedAt && (
                              <div>You signed: {formatDate(form.supervisorSignedAt)}</div>
                            )}
                            {form.facultySignedAt && (
                              <div>Faculty signed: {formatDate(form.facultySignedAt)}</div>
                            )}
                            {!form.submittedAt && !form.supervisorSignedAt && !form.facultySignedAt && (
                              <div>Created: {formatDate(form.createdAt)}</div>
                            )}
                          </div>
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
