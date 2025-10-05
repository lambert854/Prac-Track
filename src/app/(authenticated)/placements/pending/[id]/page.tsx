import { PlacementPendingApplication } from '@/components/placements/placement-pending-application'
import { requireAuth } from '@/lib/auth-helpers'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PendingApplicationPage({ params }: PageProps) {
  const session = await requireAuth()
  const { id } = await params

  return <PlacementPendingApplication placementId={id} userRole={session.user.role} />
}
