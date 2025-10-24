'use client'

import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
    ArrowDownTrayIcon,
    CheckCircleIcon,
    ClockIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon,
    EyeIcon
} from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

interface FormSubmission {
  id: string
  template: {
    id: string
    key: string
    title: string
  }
  placement: {
    id: string
    site: {
      name: string
    }
  }
  role: string
  status: string
  locked: boolean
  createdAt: string
  updatedAt: string
  approver?: {
    firstName: string
    lastName: string
  }
  type?: 'FORM_SUBMISSION'
}

interface UploadedDocument {
  id: string
  type: 'UPLOADED_DOCUMENT'
  title: string
  siteName: string
  documentPath: string
  uploadedAt: string
  placementId: string
}

interface EvaluationDocument {
  id: string
  type: 'EVALUATION'
  title: string
  siteName: string
  documentPath: string
  uploadedAt: string
  placementId: string
  submissionUrl: string
}

type DocumentItem = FormSubmission | UploadedDocument | EvaluationDocument

export function StudentForms() {
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null)

  const { data: allDocuments, isLoading, error } = useQuery({
    queryKey: ['form-submissions'],
    queryFn: async () => {
      const response = await fetch('/api/forms/submissions')
      if (!response.ok) throw new Error('Failed to fetch form submissions')
      return response.json()
    },
  })

  // Helper functions
  const isUploadedDocument = (item: DocumentItem): item is UploadedDocument => {
    return item.type === 'UPLOADED_DOCUMENT'
  }

  const isFormSubmission = (item: DocumentItem): item is FormSubmission => {
    return !('type' in item) || item.type === 'FORM_SUBMISSION' // backward compatibility
  }

  const isEvaluationDocument = (item: DocumentItem): item is EvaluationDocument => {
    return 'type' in item && item.type === 'EVALUATION'
  }

  const getStatusIcon = (item: DocumentItem) => {
    if (isUploadedDocument(item)) {
      return <CheckCircleIcon className="h-5 w-5 text-green-600" />
    }
    
    if (isEvaluationDocument(item)) {
      return <CheckCircleIcon className="h-5 w-5 text-green-600" />
    }
    
    if (isFormSubmission(item)) {
      if (item.locked) {
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      }
      
      switch (item.status) {
        case 'DRAFT':
          return <ClockIcon className="h-5 w-5 text-yellow-600" />
        case 'SUBMITTED':
          return <ClockIcon className="h-5 w-5 text-blue-600" />
        case 'APPROVED':
          return <CheckCircleIcon className="h-5 text-green-600" />
        case 'REJECTED':
          return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
        default:
          return <ClockIcon className="h-5 w-5 text-gray-600" />
      }
    }
    
    return <ClockIcon className="h-5 w-5 text-gray-600" />
  }

  const getStatusBadge = (item: DocumentItem) => {
    if (isUploadedDocument(item)) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          Uploaded
        </span>
      )
    }
    
    if (isEvaluationDocument(item)) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          Completed
        </span>
      )
    }
    
    if (isFormSubmission(item)) {
      if (item.locked) {
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            Locked
          </span>
        )
      }

      const statusClasses = {
        DRAFT: 'bg-gray-100 text-gray-800',
        SUBMITTED: 'bg-blue-100 text-blue-800',
        APPROVED: 'bg-green-100 text-green-800',
        REJECTED: 'bg-red-100 text-red-800',
      }
      
      return (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[item.status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
          {item.status}
        </span>
      )
    }
    
    return null
  }

  const handleViewDocument = (document: DocumentItem) => {
    setSelectedDocument(document)
  }

  const handleViewEvaluation = (submissionUrl: string) => {
    window.open(submissionUrl, '_blank')
  }

  const handleViewUploadedDocument = (documentPath: string) => {
    // If it's already a blob URL, open it directly
    if (documentPath.startsWith('https://')) {
      window.open(documentPath, '_blank')
    } else if (documentPath.startsWith('/api/documents/')) {
      // If it already starts with /api/documents/, use it as-is
      window.open(documentPath, '_blank')
    } else {
      // For legacy file paths, use the API route
      window.open(`/api/documents/${documentPath}`, '_blank')
    }
  }

  const handleDownloadPDF = (document: DocumentItem) => {
    if (isFormSubmission(document) && document.locked) {
      // In a real app, this would download the PDF
      console.log('Downloading PDF for form:', document.id)
      alert('PDF download would be implemented here')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-red-600">Error loading forms: {error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Forms</h1>
        <p className="text-gray-600">View and manage your practicum placement forms and evaluations</p>
      </div>

      {/* Documents List */}
      {allDocuments?.length > 0 ? (
        <div className="space-y-4">
          {allDocuments.map((document: DocumentItem) => (
            <div key={document.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(document)}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {isUploadedDocument(document) || isEvaluationDocument(document) 
                        ? document.title 
                        : document.template.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {isUploadedDocument(document) || isEvaluationDocument(document) 
                        ? document.siteName 
                        : document.placement.site.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {isUploadedDocument(document) 
                        ? 'Uploaded Document' 
                        : isEvaluationDocument(document)
                        ? 'Self-Evaluation'
                        : document.role === 'STUDENT' ? 'Student Section' : 'Supervisor Section'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {getStatusBadge(document)}
                  
                  <div className="flex space-x-2">
                    {isUploadedDocument(document) ? (
                      <button
                        onClick={() => handleViewUploadedDocument(document.documentPath)}
                        className="bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>
                    ) : isEvaluationDocument(document) ? (
                      <button
                        onClick={() => handleViewEvaluation(document.submissionUrl)}
                        className="bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View & Print
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleViewDocument(document)}
                          className="bg-yellow-400 text-black hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View
                        </button>
                        
                        {document.locked && (
                          <button
                            onClick={() => handleDownloadPDF(document)}
                            className="bg-gray-600 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                            PDF
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm text-gray-600">
                  {isUploadedDocument(document) ? (
                    <>
                      <span>Uploaded: {new Date(document.uploadedAt).toLocaleDateString()}</span>
                      <span>Type: Document Upload</span>
                    </>
                  ) : isEvaluationDocument(document) ? (
                    <>
                      <span>Completed: {new Date(document.uploadedAt).toLocaleDateString()}</span>
                      <span>Type: Self-Evaluation</span>
                    </>
                  ) : (
                    <>
                      <span>Created: {new Date(document.createdAt).toLocaleDateString()}</span>
                      <span>Updated: {new Date(document.updatedAt).toLocaleDateString()}</span>
                      {document.approver && (
                        <span>Approved by: {document.approver.firstName} {document.approver.lastName}</span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="text-center py-8">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Forms Yet</h3>
            <p className="text-gray-600">
              Forms will appear here once you have an active placement and forms are assigned.
            </p>
          </div>
        </div>
      )}

      {/* Document Detail Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isUploadedDocument(selectedDocument) || isEvaluationDocument(selectedDocument)
                    ? selectedDocument.title 
                    : selectedDocument.template.title
                  }
                </h3>
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Placement</p>
                  <p className="text-sm text-gray-600">
                    {isUploadedDocument(selectedDocument) || isEvaluationDocument(selectedDocument)
                      ? selectedDocument.siteName 
                      : selectedDocument.placement.site.name
                    }
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700">Status</p>
                  <div className="mt-1">
                    {getStatusBadge(selectedDocument)}
                  </div>
                </div>
                
                {isUploadedDocument(selectedDocument) ? (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Document Information</p>
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        This is an uploaded document that you can view and download. 
                        It was uploaded on {new Date(selectedDocument.uploadedAt).toLocaleDateString()}.
                      </p>
                    </div>
                  </div>
                ) : isEvaluationDocument(selectedDocument) ? (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Evaluation Information</p>
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        This is your completed self-evaluation. You can view and print the evaluation 
                        by clicking the "View & Print" button. It was completed on {new Date(selectedDocument.uploadedAt).toLocaleDateString()}.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Form Data</p>
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        Form data would be displayed here. In a real implementation, this would show the actual form fields and responses.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                {isUploadedDocument(selectedDocument) ? (
                  <button
                    onClick={() => handleViewUploadedDocument(selectedDocument.documentPath)}
                    className="bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
                  >
                    <EyeIcon className="h-4 w-4 mr-2" />
                    View Document
                  </button>
                ) : isEvaluationDocument(selectedDocument) ? (
                  <button
                    onClick={() => handleViewEvaluation(selectedDocument.submissionUrl)}
                    className="bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
                  >
                    <EyeIcon className="h-4 w-4 mr-2" />
                    View & Print Evaluation
                  </button>
                ) : selectedDocument.locked && (
                  <button
                    onClick={() => handleDownloadPDF(selectedDocument)}
                    className="bg-gray-600 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Download PDF
                  </button>
                )}
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="bg-yellow-400 text-black hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
