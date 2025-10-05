import { requireStudent } from '@/lib/auth-helpers'
import { StudentPlacements } from '@/components/placements/student-placements'

export default async function PlacementsPage() {
  console.log('PlacementsPage: Starting to render')
  await requireStudent()
  console.log('PlacementsPage: Auth check passed, rendering StudentPlacements')

  return <StudentPlacements />
}
