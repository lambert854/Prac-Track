import { requireStudent } from '@/lib/auth-helpers'
import { BrowseSites } from '@/components/placements/browse-sites'

export default async function BrowseSitesPage() {
  await requireStudent()

  return <BrowseSites />
}
