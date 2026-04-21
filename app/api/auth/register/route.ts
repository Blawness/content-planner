import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { message: 'Pendaftaran akun dinonaktifkan. Hubungi admin untuk mendapatkan akses.' },
    { status: 403 }
  )
}
