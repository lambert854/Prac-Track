import { requireFacultyOrAdmin } from '@/lib/auth-helpers'
import { PlacementsManagement } from '@/components/admin/placements-management'

export default async function AdminPlacementsPage() {
  await requireFacultyOrAdmin()

  return <PlacementsManagement />
}
