'use client'

import { SchemaForm, SchemaFormRef } from '@/components/forms/SchemaForm'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EvaluationConfig } from '@/config/evaluation.config'
import evaluationSchema from '@/config/evaluations.schema.json'
import { PrinterIcon } from '@heroicons/react/24/outline'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { use, useEffect, useRef, useState } from 'react'

// Type the evaluation schema to match SchemaForm expectations
interface Field {
  id: string
  type: 'single-select' | 'textarea'
  label: string
  required: boolean
  options?: Array<{ value: number; label: string }>
  maxLength?: number
  placeholder?: string
}

interface Page {
  id: string
  title: string
  description?: string
  fields: Field[]
}

interface EvaluationSchema {
  version: number
  titleStudent: Record<string, string>
  titleSupervisor: Record<string, string>
  pages: Page[]
}

const typedEvaluationSchema = evaluationSchema as EvaluationSchema

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
  const currentAnswersRef = useRef<Record<string, number | string>>({})
  const schemaFormRef = useRef<SchemaFormRef>(null)

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

  // Update ref when data loads
  useEffect(() => {
    if (data?.answers) {
      currentAnswersRef.current = data.answers
    }
  }, [data?.answers])

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
    // Update the ref with current answers
    currentAnswersRef.current = answers
    await saveMutation.mutateAsync({ answers, pageId })
  }

  const handleLock = async () => {
    try {
      // First, trigger a save of the current form state to ensure all answers are captured
      if (schemaFormRef.current) {
        await schemaFormRef.current.saveCurrentPage()
      }
      
      // Get the current answers from the ref (which should now have the latest)
      const currentAnswers = currentAnswersRef.current
      
      // Always save the current answers before locking to ensure we have the latest state
      if (Object.keys(currentAnswers).length > 0) {
        await saveMutation.mutateAsync({ answers: currentAnswers, pageId: undefined })
      }
    } catch (error) {
      console.error('Failed to save before locking:', error)
      // Continue with lock attempt even if save fails
    }
    
    // Then attempt to lock
    lockMutation.mutate()
  }

  const handlePrint = () => {
    // Create a print-friendly version with all pages
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${data?.meta?.title || 'Evaluation'}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              font-size: 28px;
              margin: 0 0 10px 0;
              color: #111;
            }
            .meta-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              font-size: 14px;
            }
            .meta-info span {
              font-weight: 500;
            }
            .page {
              page-break-inside: avoid;
              margin-bottom: 40px;
              padding: 20px;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
            }
            .page-title {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 15px;
              color: #111;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 10px;
            }
            .page-description {
              color: #6b7280;
              margin-bottom: 20px;
              font-style: italic;
            }
            .field {
              margin-bottom: 20px;
            }
            .field-label {
              font-weight: 500;
              margin-bottom: 8px;
              display: block;
            }
            .field-required {
              color: #dc2626;
            }
            .radio-option {
              margin-bottom: 8px;
              padding: 8px 0;
            }
            .radio-option.selected {
              background-color: #f3f4f6;
              padding: 8px 12px;
              border-radius: 4px;
              font-weight: 500;
            }
            .textarea-response {
              background-color: #f9fafb;
              padding: 12px;
              border-radius: 4px;
              border: 1px solid #e5e7eb;
              white-space: pre-wrap;
              min-height: 60px;
            }
            .no-response {
              color: #9ca3af;
              font-style: italic;
            }
            .message-box {
              background-color: #eff6ff;
              border: 1px solid #bfdbfe;
              padding: 15px;
              border-radius: 6px;
              margin-bottom: 20px;
            }
            @media print {
              body { margin: 0; padding: 15px; }
              .page { page-break-inside: avoid; margin-bottom: 30px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${data?.meta?.title || 'Evaluation'}</h1>
            <div class="meta-info">
              <div><span>Student:</span> ${data?.meta?.placement?.studentName || 'N/A'}</div>
              <div><span>Supervisor:</span> ${data?.meta?.placement?.supervisorName || 'N/A'}</div>
              <div><span>Faculty:</span> ${data?.meta?.placement?.facultyName || 'N/A'}</div>
              <div><span>Type:</span> ${data?.meta?.type === 'MIDTERM' ? 'Mid-Term' : 'Final'}</div>
            </div>
            ${data?.meta?.message ? `
              <div class="message-box">
                <strong>Faculty Notes:</strong><br>
                ${data.meta.message}
              </div>
            ` : ''}
          </div>

          ${typedEvaluationSchema.pages.map(page => `
            <div class="page">
              <div class="page-title">${page.title}</div>
              ${page.description ? `<div class="page-description">${page.description}</div>` : ''}
              
              ${page.fields.map(field => {
                const answer = data?.answers?.[field.id]
                let fieldContent = ''
                
                if (field.type === 'single-select' && field.options) {
                  if (answer !== undefined && answer !== null && answer !== '') {
                    const selectedOption = field.options.find(opt => opt.value === answer)
                    fieldContent = `
                      <div class="field">
                        <label class="field-label">
                          ${field.label}
                          ${field.required ? '<span class="field-required">*</span>' : ''}
                        </label>
                        <div class="radio-option selected">
                          ${selectedOption ? selectedOption.label : 'Selected option not found'}
                        </div>
                      </div>
                    `
                  } else {
                    fieldContent = `
                      <div class="field">
                        <label class="field-label">
                          ${field.label}
                          ${field.required ? '<span class="field-required">*</span>' : ''}
                        </label>
                        <div class="no-response">No response provided</div>
                      </div>
                    `
                  }
                } else if (field.type === 'textarea') {
                  fieldContent = `
                    <div class="field">
                      <label class="field-label">
                        ${field.label}
                        ${field.required ? '<span class="field-required">*</span>' : ''}
                      </label>
                      <div class="textarea-response">
                        ${answer || '<span class="no-response">No response provided</span>'}
                      </div>
                    </div>
                  `
                }
                
                return fieldContent
              }).join('')}
            </div>
          `).join('')}
        </body>
      </html>
    `

    try {
      printWindow.document.write(printContent)
      printWindow.document.close()
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        printWindow.print()
        // Don't close immediately, let user see the print dialog
        setTimeout(() => {
          printWindow.close()
        }, 1000)
      }
    } catch (error) {
      console.error('Error creating print content:', error)
      alert('Error creating print preview. Please try again.')
      printWindow.close()
    }
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
        ref={schemaFormRef}
        pages={typedEvaluationSchema.pages}
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
            Use your browser&apos;s print dialog to save this evaluation as a PDF.
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
