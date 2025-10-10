'use client'

import { useQuery } from '@tanstack/react-query'
import { DocumentCheckIcon, ClockIcon, CheckCircleIcon, EyeIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

interface SupervisorEvaluationsSectionProps {
  supervisorId: string
}

export function SupervisorEvaluationsSection({ supervisorId }: SupervisorEvaluationsSectionProps) {
  // Fetch evaluations for this supervisor
  const { data: evaluations, isLoading } = useQuery({
    queryKey: ['supervisor-evaluations', supervisorId],
    queryFn: async () => {
      const response = await fetch(`/api/supervisors/${supervisorId}/evaluations`)
      if (!response.ok) return []
      return response.json()
    },
  })

  if (isLoading) {
    return (
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
          <DocumentCheckIcon className="h-4 w-4 mr-2 text-gray-400" />
          Evaluations
        </h4>
        <div className="animate-pulse space-y-2">
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!evaluations || evaluations.length === 0) {
    return (
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
          <DocumentCheckIcon className="h-4 w-4 mr-2 text-gray-400" />
          Evaluations
        </h4>
        <p className="text-sm text-gray-500">
          No evaluations have been submitted yet.
        </p>
      </div>
    )
  }

  // Separate pending and completed evaluations
  const pendingEvaluations = evaluations.filter(e => e.status !== 'LOCKED')
  const completedEvaluations = evaluations.filter(e => e.status === 'LOCKED')

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
        <DocumentCheckIcon className="h-4 w-4 mr-2 text-gray-400" />
        Evaluations
      </h4>
      
      <div className="space-y-3">
        {/* Pending Evaluations */}
        {pendingEvaluations.length > 0 && (
          <div>
            <div className="flex items-center mb-2">
              <ClockIcon className="h-4 w-4 text-yellow-600 mr-2" />
              <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                Pending
              </h5>
              <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                {pendingEvaluations.length}
              </span>
            </div>
            <div className="space-y-2">
              {pendingEvaluations.map((evaluation) => (
                <div key={evaluation.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {evaluation.type === 'MIDTERM' ? 'Mid-Term' : 'Final'} Evaluation
                      </p>
                      <p className="text-xs text-gray-500">
                        Student: {evaluation.studentName || 'Unknown'}
                        {evaluation.lastSavedAt && ` • Last saved: ${new Date(evaluation.lastSavedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {evaluation.status === 'PENDING' ? 'Not Started' : 'In Progress'}
                    </span>
                    <Link
                      href={`/forms/evaluations/${evaluation.id}`}
                      className="bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 px-2 py-1 rounded text-xs font-medium transition-colors flex items-center"
                    >
                      <EyeIcon className="h-3 w-3 mr-1" />
                      {evaluation.status === 'PENDING' ? 'Start' : 'Continue'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Evaluations */}
        {completedEvaluations.length > 0 && (
          <div>
            <div className="flex items-center mb-2">
              <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
              <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                Completed
              </h5>
              <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                {completedEvaluations.length}
              </span>
            </div>
            <div className="space-y-2">
              {completedEvaluations.map((evaluation) => (
                <div key={evaluation.id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {evaluation.type === 'MIDTERM' ? 'Mid-Term' : 'Final'} Evaluation
                      </p>
                      <p className="text-xs text-gray-500">
                        Student: {evaluation.studentName || 'Unknown'}
                        {evaluation.lockedAt && ` • Completed: ${new Date(evaluation.lockedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Completed
                    </span>
                    <Link
                      href={`/forms/evaluations/${evaluation.id}`}
                      className="bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 px-2 py-1 rounded text-xs font-medium transition-colors flex items-center"
                    >
                      <EyeIcon className="h-3 w-3 mr-1" />
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Total: {evaluations.length} evaluations</span>
            <span>
              {completedEvaluations.length} completed, {pendingEvaluations.length} pending
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
