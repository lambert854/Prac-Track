import { requireStudent } from '@/lib/auth-helpers'
import { StudentForms } from '@/components/forms/student-forms'

export default async function FormsPage() {
  await requireStudent()

  return <StudentForms />
}
