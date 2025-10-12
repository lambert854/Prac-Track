import { requireFacultyOrAdmin } from '@/lib/auth-helpers'
import { FacultyTimesheets } from '@/components/faculty/faculty-timesheets'

export default async function FacultyTimesheetsPage() {
  const session = await requireFacultyOrAdmin()
  
  if (!session) {
    return <div>Unauthorized</div>
  }

  return <FacultyTimesheets facultyId={session.user.id} />
}
