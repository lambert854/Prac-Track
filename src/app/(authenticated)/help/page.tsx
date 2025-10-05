import { requireAuth } from '@/lib/auth-helpers'
import { HelpGuide } from '@/components/help-guide'

export default async function HelpPage() {
  const session = await requireAuth()

  return <HelpGuide user={session.user} />
}
