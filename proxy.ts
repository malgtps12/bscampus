import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const DEV_JWT_SECRET = 'bscampus-dev-only-secret-do-not-use-in-production'

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (secret && secret.length > 0) return new TextEncoder().encode(secret)
  return new TextEncoder().encode(DEV_JWT_SECRET)
}

async function isAdminToken(token: string | undefined): Promise<boolean> {
  if (!token) return false
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    return payload.role === 'admin'
  } catch {
    return false
  }
}

/**
 * Proteksi route server-side: halaman /admin/* hanya bisa diakses
 * dengan cookie admin_token yang valid & ber-role admin.
 */
export default async function proxy(request: NextRequest) {
  const adminToken = request.cookies.get('admin_token')?.value

  if (await isAdminToken(adminToken)) {
    return NextResponse.next()
  }

  const url = request.nextUrl.clone()
  url.pathname = '/admin'
  url.search = ''
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/admin/:path+'],
}
