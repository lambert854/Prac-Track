import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireRole } from '@/lib/auth-helpers'
import { UserRole } from '@prisma/client'
import { redirect } from 'next/navigation'
import ClassManagement from '@/components/admin/class-management'

export default async function AdminClassesPage() {
  const session = await requireRole([UserRole.ADMIN])
  
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Management</h1>
          <p className="text-gray-600">Manage classes, hours, and faculty assignments</p>
        </div>
      </div>

      <ClassManagement />
    </div>
  )
}
