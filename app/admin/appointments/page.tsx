'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from 'lucide-react'

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAppointments()
  }, [])

  async function loadAppointments() {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(
            user:users(first_name, last_name)
          ),
          doctor:staff(
            user:users(first_name, last_name)
          )
        `)
        .order('appointment_date', { ascending: false })
        .limit(50)

      if (error) throw error
      setAppointments(data || [])
    } catch (error) {
      console.error('Error loading appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading appointments...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
        <p className="text-gray-600 mt-1">View all appointments</p>
      </div>

      <div className="grid gap-4">
        {appointments.map((apt) => (
          <Card key={apt.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">
                    {apt.patient?.user?.first_name} {apt.patient?.user?.last_name}
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Dr. {apt.doctor?.user?.first_name} {apt.doctor?.user?.last_name}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  apt.status === 'completed' ? 'bg-green-100 text-green-800' :
                  apt.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                  apt.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {apt.status}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{new Date(apt.appointment_date).toLocaleDateString()}</span>
                <span>{apt.appointment_time}</span>
              </div>
              {apt.reason_for_visit && (
                <p className="mt-2 text-sm text-gray-700">{apt.reason_for_visit}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
