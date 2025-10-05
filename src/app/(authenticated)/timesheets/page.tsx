import { requireStudent } from '@/lib/auth-helpers'
import { StudentTimesheets } from '@/components/timesheets/student-timesheets'

export default async function TimesheetsPage() {
  await requireStudent()

  return <StudentTimesheets />
}
