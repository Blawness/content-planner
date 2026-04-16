'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'

const DEMO_WEEKS: { week: string; slots: { day: string; theme: string }[] }[] = [
  {
    week: 'Minggu 1',
    slots: [
      { day: 'Senin', theme: 'Edukasi' },
      { day: 'Rabu', theme: 'Storytelling' },
      { day: 'Jumat', theme: 'Promotional' },
    ],
  },
  {
    week: 'Minggu 2',
    slots: [
      { day: 'Selasa', theme: 'Tutorial' },
      { day: 'Kamis', theme: 'Case Study' },
      { day: 'Sabtu', theme: 'Behind The Scene' },
    ],
  },
]

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

export default function CalendarPage() {
  const { isGuest } = useAuth()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Content Calendar</h1>
      {isGuest && (
        <p className="mb-4 text-sm text-amber-700 bg-amber-50 p-2 rounded-lg">
          Mode tamu: menampilkan contoh jadwal. Generate jadwal asli di <strong>AI Schedule</strong> atau login.
        </p>
      )}
      <p className="text-gray-600 mb-6">
        Jadwal konten per minggu. Generate otomatis dari halaman AI Schedule.
      </p>

      <div className="space-y-6">
        {DEMO_WEEKS.map(({ week, slots }) => (
          <Card key={week}>
            <CardHeader className="font-medium text-gray-900">{week}</CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {slots.map((slot, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border border-gray-200 bg-gray-50 flex flex-col"
                  >
                    <span className="font-medium text-gray-900">{slot.day}</span>
                    <span className="text-sm text-gray-600">{slot.theme}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-3">Preview grid (minggu ini)</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {DAYS.map((d) => (
                  <th key={d} className="text-left p-2 font-medium text-gray-700">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {DAYS.map((d, _i) => {
                  const slot = DEMO_WEEKS[0].slots.find((s) => s.day === d)
                  return (
                    <td key={d} className="p-2 border-b border-gray-100 align-top">
                      {slot ? (
                        <span className="inline-block px-2 py-1 rounded bg-blue-50 text-blue-800 text-xs">
                          {slot.theme}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
