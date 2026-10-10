import type { ReactNode } from 'react'
import { WorkspaceShell } from '@/components/workspace-shell'
import { getWorkspaceContext } from '@/lib/workspace-context'

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const { restaurant, profile, membership } = await getWorkspaceContext()

  return (
    <WorkspaceShell
      restaurantName={restaurant.name}
      profileName={profile.fullName}
      role={membership.role}
    >
      {children}
    </WorkspaceShell>
  )
}
