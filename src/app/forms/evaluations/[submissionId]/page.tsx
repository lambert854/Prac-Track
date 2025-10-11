'use client'

import { useState, use } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { SchemaForm } from '@/components/forms/SchemaForm'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import evaluationSchema from '@/config/evaluations.schema.json'
import { EvaluationConfig } from '@/config/evaluation.config'
import { PrinterIcon } from '@heroicons/react/24/outline'

interface PageProps {
  params: Promise<{
    submissionId: string
  }>
}

export default function EvaluationFormPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const { submissionId } = resolvedParams
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showLockModal, setShowLockModal] = useState(false)

  // Fetch submission data
  const { data, isLoading, error } = useQuery({
    queryKey: ['evaluation-submission', submissionId],
    queryFn: async () => {
      const response = await fetch(`/api/evaluations/submissions/${submissionId}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load evaluation')
      }
      return response.json()
    },
    refetchOnWindowFocus: false,
  })

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async ({ answers, pageId }: { answers: Record<string, number | string>, pageId?: string }) => {
      const response = await fetch(`/api/evaluations/submissions/${submissionId}/save`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, pageId }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluation-submission', submissionId] })
    },
  })

  // Lock mutation
  const lockMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/evaluations/submissions/${submissionId}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluation-submission', submissionId] })
      queryClient.invalidateQueries({ queryKey: ['studentForms'] })
      queryClient.invalidateQueries({ queryKey: ['supervisorForms'] })
      setShowLockModal(false)
    },
  })

  const handleSave = async (answers: Record<string, number | string>, pageId?: string) => {
    await saveMutation.mutateAsync({ answers, pageId })
  }

  const handleLock = () => {
    lockMutation.mutate()
  }

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Evaluation</h2>
          <p className="text-red-700">{(error as Error).message}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const isLocked = data?.meta?.status === 'LOCKED'

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          ← Back
        </button>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {data?.meta?.title}
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Student:</span>
              <span className="ml-2 text-gray-900">{data?.meta?.placement?.studentName}</span>
            </div>
            {data?.meta?.placement?.supervisorName && (
              <div>
                <span className="font-medium text-gray-700">Supervisor:</span>
                <span className="ml-2 text-gray-900">{data?.meta?.placement?.supervisorName}</span>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-700">Faculty:</span>
              <span className="ml-2 text-gray-900">{data?.meta?.placement?.facultyName}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Type:</span>
              <span className="ml-2 text-gray-900">{data?.meta?.type === 'MIDTERM' ? 'Mid-Term' : 'Final'}</span>
            </div>
          </div>

          {data?.meta?.message && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">{data.meta.message}</p>
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      <SchemaForm
        pages={evaluationSchema.pages}
        initialAnswers={data?.answers || {}}
        onSave={handleSave}
        isLocked={isLocked}
        lastSavedAt={data?.meta?.lastSavedAt ? new Date(data.meta.lastSavedAt) : null}
      />

      {/* Submit/Print Actions */}
      {!isLocked && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ready to Submit?</h3>
          <p className="text-gray-600 mb-4">
            Once you submit this evaluation, it will be locked and you will not be able to make any changes.
            Please review all pages before submitting.
          </p>
          <button
            onClick={() => setShowLockModal(true)}
            className="w-full md:w-auto px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Submit & Lock Evaluation
          </button>
        </div>
      )}

      {isLocked && EvaluationConfig.SHOW_PRINT_BUTTON && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <button
            onClick={handlePrint}
            className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            <PrinterIcon className="h-5 w-5 mr-2" />
            Print / Save as PDF
          </button>
          <p className="text-sm text-gray-600 mt-2">
            Use your browser's print dialog to save this evaluation as a PDF.
          </p>
        </div>
      )}

      {/* Lock Confirmation Modal */}
      {showLockModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Submit Evaluation?
            </h3>
            <p className="text-gray-600 mb-6">
              After submitting, this evaluation will be locked and read-only. You will not be able to make any further changes. Are you sure you want to continue?
            </p>
            
            {lockMutation.isError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  {(lockMutation.error as Error).message}
                </p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setShowLockModal(false)}
                disabled={lockMutation.isPending}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLock}
                disabled={lockMutation.isPending}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {lockMutation.isPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit & Lock'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
