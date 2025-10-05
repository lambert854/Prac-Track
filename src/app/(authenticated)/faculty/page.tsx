import { requireFaculty } from '@/lib/auth-helpers'
import { FacultyDashboard } from '@/components/dashboard/faculty-dashboard'

export default async function FacultyPage() {
  const session = await requireFaculty()

  return <FacultyDashboard user={session.user} />
}
