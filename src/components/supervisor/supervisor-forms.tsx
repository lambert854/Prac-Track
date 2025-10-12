'use client'

import { CheckCircleIcon, ClipboardDocumentListIcon, ClockIcon, DocumentTextIcon, UserGroupIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'

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
        return 'Cell Phone Usage, Confidentiality, Alcohol/Drug Use, and Safety Policy'
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

  const pendingForms = formsData?.pendingForms || []
  const allDocuments = formsData?.allDocuments || []
  const summary = formsData?.summary || { totalForms: 0, pendingForms: 0, uploadedDocuments: 0, totalDocuments: 0 }

  // Separate form submissions from uploaded documents
  const formSubmissions = allDocuments.filter((doc: any) => !doc.type || doc.type === 'FORM_SUBMISSION')
  const uploadedDocuments = allDocuments.filter((doc: any) => doc.type === 'UPLOADED_DOCUMENT' && doc.title === 'Placement Checklist')

  // Group forms by status for better organization
  const formsByStatus = formSubmissions.reduce((acc: any, form: any) => {
    const status = form.displayStatus || form.status
    if (!acc[status]) {
      acc[status] = []
    }
    acc[status].push(form)
    return acc
  }, {} as Record<string, any[]>)

  const statusOrder = ['SUBMITTED', 'APPROVED', 'REJECTED', 'DRAFT']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">My Forms</h1>
        <p className="text-gray-600 mt-2">
          Forms and documents from your assigned students
        </p>
        <div className="mt-4 flex items-center space-x-4">
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {uploadedDocuments.length} Student Document{uploadedDocuments.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Student Information Table - Checklist Documents */}
      {uploadedDocuments.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <DocumentTextIcon className="h-5 w-5 text-blue-600 mr-2" />
              Student Documents
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Documents uploaded by your assigned students
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Site
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {uploadedDocuments.map((doc: any) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserGroupIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {doc.student?.firstName} {doc.student?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {doc.student?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {doc.title}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {doc.siteName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(doc.uploadedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          // If it's already a blob URL, open it directly
                          if (doc.documentPath.startsWith('https://')) {
                            window.open(doc.documentPath, '_blank')
                          } else {
                            // For legacy file paths, use the API route
                            window.open(`/api/uploads/${doc.documentPath}`, '_blank')
                          }
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View Document
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Supervisor Application Section - Placeholder */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <ClipboardDocumentListIcon className="h-5 w-5 text-green-600 mr-2" />
            Supervisor Application
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Application form sent to you for supervisor approval
          </p>
        </div>
        
        <div className="px-6 py-8">
          <div className="text-center">
            <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Application Found</h3>
            <p className="mt-2 text-gray-600">
              Supervisor applications will appear here when they are sent to you.
            </p>
          </div>
        </div>
      </div>

      {/* Forms by Status */}
      {formSubmissions.length > 0 && (
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
                  {statusForms.map((form: any) => (
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
