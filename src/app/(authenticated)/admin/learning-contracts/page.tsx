import { requireFacultyOrAdmin } from '@/lib/auth-helpers'
import { LearningContractsManagement } from '@/components/admin/learning-contracts-management'

export default async function LearningContractsPage() {
  await requireFacultyOrAdmin()

  return <LearningContractsManagement />
}
