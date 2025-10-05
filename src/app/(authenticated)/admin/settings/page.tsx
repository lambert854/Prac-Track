import { requireAdmin } from '@/lib/auth-helpers'
import { AdminSettings } from '@/components/admin/admin-settings'

export default async function AdminSettingsPage() {
  await requireAdmin()

  return <AdminSettings />
}
