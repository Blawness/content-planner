'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormActions, FormField, FormSection } from '@/components/ui/form-layout'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageHeader, PageShell } from '@/components/ui/page-shell'
import { createProject } from '@/lib/api/projects'

export default function NewProjectPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { token } = useAuth()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setError('')
    setLoading(true)
    try {
      const project = await createProject({ name, description: description || undefined }, token)
      router.push(`/dashboard/projects/${project.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat proyek')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell className="max-w-3xl">
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Projects', href: '/dashboard/projects' },
          { label: 'Buat Proyek' },
        ]}
        eyebrow="Superuser Lab"
        title="Buat Proyek Baru"
        description="Gunakan proyek untuk kebutuhan koordinasi internal yang belum menjadi bagian dari flow utama Content Plan."
      />

      <form onSubmit={handleSubmit}>
        <FormSection title="Informasi proyek" description="Nama dan deskripsi proyek akan membantu saat task produksi mulai bertambah.">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <FormField label="Nama proyek" htmlFor="name" required>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-10" />
          </FormField>

          <FormField label="Deskripsi" htmlFor="description" description="Opsional, tetapi disarankan untuk memberi konteks singkat.">
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </FormField>

          <FormActions>
            <Link href="/dashboard/projects">
              <Button type="button" variant="outline">Batal</Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? 'Membuat...' : 'Buat Proyek'}
            </Button>
          </FormActions>
        </FormSection>
      </form>
    </PageShell>
  )
}
