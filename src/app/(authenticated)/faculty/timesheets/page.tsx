import { requireFacultyOrAdmin } from '@/lib/auth-helpers'
import { FacultyTimesheets } from '@/components/faculty/faculty-timesheets'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function FacultyTimesheetsPage() {
  const session = await requireFacultyOrAdmin()
  
  if (!session) {
    return <div>Unauthorized</div>
  }

  return <FacultyTimesheets facultyId={session.user.id} />
}
