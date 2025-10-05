import { requireFacultyOrAdmin } from '@/lib/auth-helpers'
import { StudentDetailView } from '@/components/admin/student-detail-view'

interface StudentDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  await requireFacultyOrAdmin()
  
  const { id } = await params

  return <StudentDetailView studentId={id} />
}
