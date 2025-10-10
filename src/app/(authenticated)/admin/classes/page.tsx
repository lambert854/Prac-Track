import { requireAdmin } from '@/lib/auth-helpers'
import ClassManagement from '@/components/admin/class-management'

export default async function AdminClassesPage() {
  await requireAdmin()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Class Management</h1>
        <p className="text-gray-600">Manage classes, terms, and faculty assignments</p>
      </div>

      {/* Class Management Component */}
      <ClassManagement />
    </div>
  )
}