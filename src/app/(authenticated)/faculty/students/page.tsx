import { requireFacultyOrAdmin } from '@/lib/auth-helpers'
import { FacultyStudentsView } from '@/components/faculty/faculty-students-view'

export default async function FacultyStudentsPage() {
  await requireFacultyOrAdmin()

  return <FacultyStudentsView />
}
