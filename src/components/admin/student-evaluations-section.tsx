'use client'

import { useQuery } from '@tanstack/react-query'
import { DocumentCheckIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { EvaluationConfig } from '@/config/evaluation.config'
import Link from 'next/link'

interface StudentEvaluationsSectionProps {
  studentId: string
  placements: Array<{
    id: string
    status: string
    site: {
      name: string
    }
  }>
}

export function StudentEvaluationsSection({ studentId, placements }: StudentEvaluationsSectionProps) {
  // Fetch evaluations for all active placements
  const { data: evaluations, isLoading } = useQuery({
    queryKey: ['student-evaluations', studentId],
    queryFn: async () => {
      // Get evaluations for all active placements (same logic as student dashboard)
      const evaluationPromises = placements
        .filter(placement => ['ACTIVE', 'APPROVED', 'APPROVED_PENDING_CHECKLIST'].includes(placement.status))
        .map(placement => 
          fetch(`/api/placements/${placement.id}/evaluations?role=STUDENT`)
            .then(res => res.ok ? res.json() : [])
        )
      
      const results = await Promise.all(evaluationPromises)
      return results.flat()
    },
    enabled: placements.some(p => ['ACTIVE', 'APPROVED', 'APPROVED_PENDING_CHECKLIST'].includes(p.status)),
  })

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    )
  }

  if (!evaluations || evaluations.length === 0) {
    const hasActivePlacements = placements.some(p => ['ACTIVE', 'APPROVED', 'APPROVED_PENDING_CHECKLIST'].includes(p.status))
    
    if (!hasActivePlacements) {
      return (
        <div className="text-center py-8">
          <DocumentCheckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Placements</h3>
          <p className="text-gray-600">
            This student has no active placements, so evaluations are not available.
          </p>
        </div>
      )
    }

    return (
      <div className="text-center py-8">
        <DocumentCheckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Evaluations Yet</h3>
        <p className="text-gray-600">
          No evaluations have been sent for this student&apos;s active placements.
        </p>
      </div>
    )
  }

  // Group evaluations by placement and type
  const groupedEvaluations = evaluations.reduce((acc, evaluation) => {
    const key = `${evaluation.type}_${evaluation.status}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(evaluation)
    return acc
  }, {} as Record<string, any[]>)

  const pendingEvaluations = evaluations.filter(e => e.status !== 'LOCKED')
  const completedEvaluations = evaluations.filter(e => e.status === 'LOCKED')

  return (
    <div className="space-y-4">
      {/* Pending Evaluations */}
      {pendingEvaluations.length > 0 && (
        <div>
          <div className="flex items-center mb-3">
            <ClockIcon className="h-5 w-5 text-yellow-600 mr-2" />
            <h4 className="font-medium text-gray-900">Pending Review</h4>
            <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
              {pendingEvaluations.length}
            </span>
          </div>
          <div className="space-y-2">
            {pendingEvaluations.map((evaluation) => (
              <div key={evaluation.id} className="border border-yellow-200 rounded-lg p-3 bg-yellow-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {evaluation.type === 'MIDTERM' ? 'Mid-Term' : 'Final'} Self-Evaluation
                    </p>
                    <p className="text-sm text-gray-600">
                      Status: <span className="font-medium">
                        {evaluation.status === 'PENDING' ? 'Not Started' : 'In Progress'}
                      </span>
                    </p>
                    {evaluation.lastSavedAt && (
                      <p className="text-xs text-gray-500">
                        Last saved: {new Date(evaluation.lastSavedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      evaluation.status === 'PENDING' 
                        ? 'bg-gray-100 text-gray-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {evaluation.status === 'PENDING' ? 'Not Started' : 'In Progress'}
                    </span>
                    <Link
                      href={`/forms/evaluations/${evaluation.id}`}
                      className="bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                    >
                      {evaluation.status === 'PENDING' ? 'Start' : 'Continue'}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Evaluations */}
      {completedEvaluations.length > 0 && (
        <div>
          <div className="flex items-center mb-3">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
            <h4 className="font-medium text-gray-900">Completed</h4>
            <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
              {completedEvaluations.length}
            </span>
          </div>
          <div className="space-y-2">
            {completedEvaluations.map((evaluation) => (
              <div key={evaluation.id} className="border border-green-200 rounded-lg p-3 bg-green-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {evaluation.type === 'MIDTERM' ? 'Mid-Term' : 'Final'} Self-Evaluation
                    </p>
                    <p className="text-sm text-gray-600">
                      Completed: {new Date(evaluation.lockedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Completed
                    </span>
                    <Link
                      href={`/forms/evaluations/${evaluation.id}`}
                      className="bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Total Evaluations: {evaluations.length}</span>
          <span>
            {completedEvaluations.length} completed, {pendingEvaluations.length} pending
          </span>
        </div>
      </div>
    </div>
  )
}
