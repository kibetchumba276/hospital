'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, User, MapPin, Plus } from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatTime } from '@/lib/utils'

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAppointments()
  }, [])

  async function loadAppointments() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: patientData } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!patientData) return

      const { data } = await supabase
        .from('appointments')
        .select(`
          *,
          doctor:staff!appointments_doctor_id_fkey(
            user:users(first_name, last_name),
            specialization
          ),
          department:departments(name)
        `)
        .eq('patient_id', patientData.id)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false })

      setAppointments(data || [])
    } catch (error) {
      console.error('Error loading appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const upcoming = appointments.filter(
    (apt) => new Date(apt.appointment_date) >= new Date() && apt.status !== 'cancelled'
  )
  const past = appointments.filter(
    (apt) => new Date(apt.appointment_date) < new Date() || apt.status === 'cancelled'
  )

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-600 mt-1">View and manage your appointments</p>
        </div>
        <Link href="/patient/appointments/book">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Book Appointment
          </Button>
        </Link>
      </div>

      {/* Upcoming Appointments */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Upcoming Appointments</h2>
        {upcoming.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No upcoming appointments. Book one now!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {upcoming.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
          </div>
        )}
      </div>

      {/* Past Appointments */}
      {past.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Past Appointments</h2>
          <div className="space-y-4">
            {past.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} isPast />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AppointmentCard({ appointment, isPast = false }: any) {
  const statusColors: any = {
    scheduled: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-green-100 text-green-800',
    checked_in: 'bg-purple-100 text-purple-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  return (
    <Card className={isPast ? 'opacity-75' : ''}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div className="space-y-3 flex-1">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-400" />
                  <p className="font-semibold text-lg">
                    Dr. {appointment.doctor.user.first_name} {appointment.doctor.user.last_name}
                  </p>
                </div>
                <p className="text-gray-600 ml-7">{appointment.doctor.specialization}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[appointment.status]}`}>
                {appointment.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600 ml-7">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(appointment.appointment_date)}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatTime(appointment.appointment_time)}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {appointment.department.name}
              </div>
            </div>

            {appointment.reason_for_visit && (
              <div className="ml-7 text-sm">
                <span className="font-medium text-gray-700">Reason:</span>{' '}
                <span className="text-gray-600">{appointment.reason_for_visit}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
