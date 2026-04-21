import { prisma } from '@/lib/prisma'

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
