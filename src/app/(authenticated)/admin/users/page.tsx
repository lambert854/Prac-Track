import { requireAdmin } from '@/lib/auth-helpers'
import { AdminUserManagement } from '@/components/admin/admin-user-management'

export default async function AdminUsersPage() {
  await requireAdmin()

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-1">
          Manage system users, roles, and permissions
        </p>
      </div>

      <AdminUserManagement />
    </div>
  )
}
