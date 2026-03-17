import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">AI Content Planner</h1>
      <p className="text-gray-600 text-center max-w-md">
        Plan, manage, and analyze content with AI. Generate ideas, schedules, and track productivity.
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800"
        >
          Login
        </Link>
        <Link
          href="/register"
          className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
        >
          Register
        </Link>
      </div>
    </main>
  )
}
