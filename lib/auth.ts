import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || ''

export type JWTPayload = {
  sub: string
  email: string
  isSuperuser?: boolean
}

export function signToken(payload: JWTPayload): string {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not set')
  return jwt.sign(
    { sub: payload.sub, email: payload.email, isSuperuser: payload.isSuperuser ?? false },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token: string): JWTPayload | null {
  if (!JWT_SECRET) return null
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      sub?: string
      email?: string
      isSuperuser?: boolean
    }
    const sub = decoded.sub
    const email = decoded.email
    if (!sub || !email) return null
    return { sub, email, isSuperuser: decoded.isSuperuser ?? false }
  } catch {
    return null
  }
}

export function getBearerToken(request: Request): string | null {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return auth.slice(7).trim() || null
}

export async function requireAuth(request: Request): Promise<JWTPayload> {
  const token = getBearerToken(request)
  const payload = token ? verifyToken(token) : null
  if (!payload) {
    throw new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return payload
}
