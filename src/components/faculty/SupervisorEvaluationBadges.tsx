'use client'

import { useQuery } from '@tanstack/react-query'
import { EvaluationConfig } from '@/config/evaluation.config'
import Link from 'next/link'

interface SupervisorEvaluationBadgesProps {
  placementId: string
  supervisorId: string
}

export function SupervisorEvaluationBadges({ placementId, supervisorId }: SupervisorEvaluationBadgesProps) {
  const { data: evaluations } = useQuery({
    queryKey: ['supervisor-evaluations', placementId, supervisorId],
    queryFn: async () => {
      const response = await fetch(`/api/placements/${placementId}/evaluations?role=SUPERVISOR`)
      if (!response.ok) return []
      return response.json()
    },
  })

  if (!evaluations || evaluations.length === 0) return null

  const lockedEvaluations = evaluations.filter((ev: any) => ev.status === 'LOCKED')

  return (
    <div className="flex flex-wrap gap-2">
      {lockedEvaluations.map((evaluation: any) => {
        const badgeText = EvaluationConfig.BADGE_TEXT.supervisor[evaluation.type as 'MIDTERM' | 'FINAL']
        const badgeStyles = EvaluationConfig.BADGE_STYLES.supervisor

        return (
          <Link
            key={evaluation.id}
            href={`/forms/evaluations/${evaluation.id}`}
            className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${badgeStyles.base} ${badgeStyles.hover} transition-colors`}
          >
            {badgeText}
          </Link>
        )
      })}
    </div>
  )
}
