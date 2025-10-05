import { requireStudent } from '@/lib/auth-helpers'
import { MyHoursReport } from '@/components/reports/my-hours-report'

export default async function MyHoursPage() {
  await requireStudent()

  return <MyHoursReport />
}
