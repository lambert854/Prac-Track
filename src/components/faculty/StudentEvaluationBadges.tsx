'use client'

import { useQuery } from '@tanstack/react-query'
import { EvaluationConfig } from '@/config/evaluation.config'
import Link from 'next/link'

interface StudentEvaluationBadgesProps {
  placementId: string
  studentId: string
}

export function StudentEvaluationBadges({ placementId, studentId }: StudentEvaluationBadgesProps) {
  const { data: evaluations } = useQuery({
    queryKey: ['student-evaluations', placementId, studentId],
    queryFn: async () => {
      const response = await fetch(`/api/placements/${placementId}/evaluations?role=STUDENT`)
      if (!response.ok) return []
      return response.json()
    },
  })

  if (!evaluations || evaluations.length === 0) return null

  const lockedEvaluations = evaluations.filter((ev: any) => ev.status === 'LOCKED')

  return (
    <div className="flex flex-wrap gap-2">
      {lockedEvaluations.map((evaluation: any) => {
        const badgeText = EvaluationConfig.BADGE_TEXT.student[evaluation.type as 'MIDTERM' | 'FINAL']
        const badgeStyles = EvaluationConfig.BADGE_STYLES.student

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
