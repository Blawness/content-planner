import { prisma } from '@/lib/prisma'
import { WorkspaceRole } from '@prisma/client'

export { WorkspaceRole }

// Role hierarchy — higher index = more privilege
const ROLE_HIERARCHY: WorkspaceRole[] = ['member', 'admin', 'owner']

/**
 * Returns the role of a user in a workspace, or null if not a member.
 */
export async function getWorkspaceRole(
  userId: string,
  workspaceId: string
): Promise<WorkspaceRole | null> {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { role: true },
  })
  return member?.role ?? null
}

/**
 * Returns true if `role` meets or exceeds `minRole` in the hierarchy.
 */
export function hasRole(role: WorkspaceRole, minRole: WorkspaceRole): boolean {
  return ROLE_HIERARCHY.indexOf(role) >= ROLE_HIERARCHY.indexOf(minRole)
}

/**
 * Throws a 403 Response if the user does not have the required workspace role.
 * Also allows superusers to bypass workspace role checks.
 */
export async function requireWorkspaceRole(
  userId: string,
  workspaceId: string,
  minRole: WorkspaceRole
): Promise<WorkspaceRole> {
  // Superusers bypass workspace role restrictions
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperuser: true },
  })
  if (user?.isSuperuser) return 'owner' // grant max rights

  const role = await getWorkspaceRole(userId, workspaceId)
  if (!role || !hasRole(role, minRole)) {
    throw new Response(
      JSON.stringify({ message: 'Forbidden: insufficient workspace role' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )
  }
  return role
}

/**
 * Throws a 403 Response if the user is not a superuser.
 */
export async function requireSuperuser(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperuser: true },
  })
  if (!user?.isSuperuser) {
    throw new Response(
      JSON.stringify({ message: 'Forbidden: superuser access required' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

/**
 * Returns the userId's workspace IDs where they are a member (any role).
 */
export async function getUserWorkspaceIds(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperuser: true },
  })

  if (user?.isSuperuser) {
    // Superuser can see all workspaces
    const all = await prisma.workspace.findMany({ select: { id: true } })
    return all.map((w) => w.id)
  }

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    select: { workspaceId: true },
  })
  return memberships.map((m) => m.workspaceId)
}
