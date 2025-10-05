import { requireFacultyOrAdmin } from '@/lib/auth-helpers'
import { SiteDetailView } from '@/components/admin/site-detail-view'

interface SiteDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function SiteDetailPage({ params }: SiteDetailPageProps) {
  await requireFacultyOrAdmin()
  
  const { id } = await params

  return <SiteDetailView siteId={id} />
}
