import { requireFacultyOrAdmin } from '@/lib/auth-helpers'
import { SitesManagement } from '@/components/admin/sites-management'

export default async function AdminSitesPage() {
  await requireFacultyOrAdmin()

  return <SitesManagement />
}
