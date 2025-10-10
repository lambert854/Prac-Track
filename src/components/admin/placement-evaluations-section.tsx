'use client'

import { useQuery } from '@tanstack/react-query'
import { DocumentCheckIcon, ClockIcon, CheckCircleIcon, EyeIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

interface PlacementEvaluationsSectionProps {
  placementId: string
  placementName: string
  placementStatus: string
}

export function PlacementEvaluationsSection({ 
  placementId, 
  placementName, 
  placementStatus 
}: PlacementEvaluationsSectionProps) {
  // Only fetch evaluations for active placements (ACTIVE, APPROVED, APPROVED_PENDING_CHECKLIST)
  const { data: evaluations, isLoading } = useQuery({
    queryKey: ['placement-evaluations', placementId],
    queryFn: async () => {
      if (!['ACTIVE', 'APPROVED', 'APPROVED_PENDING_CHECKLIST'].includes(placementStatus)) return []
      
      const response = await fetch(`/api/placements/${placementId}/evaluations`)
      if (!response.ok) return []
      return response.json()
    },
    enabled: ['ACTIVE', 'APPROVED', 'APPROVED_PENDING_CHECKLIST'].includes(placementStatus),
  })

  if (!['ACTIVE', 'APPROVED', 'APPROVED_PENDING_CHECKLIST'].includes(placementStatus)) {
    return (
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
          <DocumentCheckIcon className="h-4 w-4 mr-2 text-gray-400" />
          Evaluations
        </h4>
        <p className="text-sm text-gray-500">
          Evaluations are only available for active placements.
        </p>
      </div>
    )
  }

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
          No evaluations have been sent for this placement yet.
        </p>
      </div>
    )
  }

  // Separate student and supervisor evaluations
  const studentEvaluations = evaluations.filter(e => e.role === 'STUDENT')
  const supervisorEvaluations = evaluations.filter(e => e.role === 'SUPERVISOR')

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
        <DocumentCheckIcon className="h-4 w-4 mr-2 text-gray-400" />
        Evaluations
      </h4>
      
      <div className="space-y-3">
        {/* Student Self-Evaluations */}
        {studentEvaluations.length > 0 && (
          <div>
            <h5 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
              Student Self-Evaluations
            </h5>
            <div className="space-y-2">
              {studentEvaluations.map((evaluation) => (
                <div key={evaluation.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      evaluation.status === 'LOCKED' ? 'bg-green-500' : 
                      evaluation.status === 'IN_PROGRESS' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {evaluation.type === 'MIDTERM' ? 'Mid-Term' : 'Final'} Self-Evaluation
                      </p>
                      <p className="text-xs text-gray-500">
                        {evaluation.status === 'LOCKED' ? 'Completed' :
                         evaluation.status === 'IN_PROGRESS' ? 'In Progress' : 'Not Started'}
                        {evaluation.lockedAt && ` • ${new Date(evaluation.lockedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      evaluation.status === 'LOCKED' ? 'bg-green-100 text-green-800' :
                      evaluation.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {evaluation.status === 'LOCKED' ? 'Completed' :
                       evaluation.status === 'IN_PROGRESS' ? 'In Progress' : 'Not Started'}
                    </span>
                    <Link
                      href={`/forms/evaluations/${evaluation.id}`}
                      className="bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 px-2 py-1 rounded text-xs font-medium transition-colors flex items-center"
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

        {/* Supervisor Evaluations */}
        {supervisorEvaluations.length > 0 && (
          <div>
            <h5 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
              Supervisor Evaluations
            </h5>
            <div className="space-y-2">
              {supervisorEvaluations.map((evaluation) => (
                <div key={evaluation.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      evaluation.status === 'LOCKED' ? 'bg-green-500' : 
                      evaluation.status === 'IN_PROGRESS' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {evaluation.type === 'MIDTERM' ? 'Mid-Term' : 'Final'} Supervisor Evaluation
                      </p>
                      <p className="text-xs text-gray-500">
                        {evaluation.status === 'LOCKED' ? 'Completed' :
                         evaluation.status === 'IN_PROGRESS' ? 'In Progress' : 'Not Started'}
                        {evaluation.lockedAt && ` • ${new Date(evaluation.lockedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      evaluation.status === 'LOCKED' ? 'bg-green-100 text-green-800' :
                      evaluation.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {evaluation.status === 'LOCKED' ? 'Completed' :
                       evaluation.status === 'IN_PROGRESS' ? 'In Progress' : 'Not Started'}
                    </span>
                    <Link
                      href={`/forms/evaluations/${evaluation.id}`}
                      className="bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 px-2 py-1 rounded text-xs font-medium transition-colors flex items-center"
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
              {evaluations.filter(e => e.status === 'LOCKED').length} completed, {' '}
              {evaluations.filter(e => e.status !== 'LOCKED').length} pending
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
