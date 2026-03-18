'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, User } from 'lucide-react'
import Link from 'next/link'

type Appointment = {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  reason_for_visit: string
  patient: {
    id: string
    user: {
      id: string
      first_name: string
      last_name: string
      phone: string
    }
  }
}

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming'>('all')

  useEffect(() => {
    loadAppointments()
  }, [])

  async function loadAppointments() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: staffData } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!staffData) return

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(
            id,
            user:users(id, first_name, last_name, phone)
          )
        `)
        .eq('doctor_id', staffData.id)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })

      if (error) throw error
      setAppointments(data || [])
    } catch (error) {
      console.error('Error loading appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(appointmentId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId)

      if (error) throw error
      
      alert('Appointment status updated!')
      loadAppointments()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  const filteredAppointments = appointments.filter(apt => {
    const today = new Date().toISOString().split('T')[0]
    const aptDate = apt.appointment_date

    if (filter === 'today') return aptDate === today
    if (filter === 'upcoming') return aptDate >= today
    return true
  })

  if (loading) return <div>Loading appointments...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-600 mt-1">Manage your appointment schedule</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={filter === 'today' ? 'default' : 'outline'}
              onClick={() => setFilter('today')}
              size="sm"
            >
              Today
            </Button>
            <Button
              variant={filter === 'upcoming' ? 'default' : 'outline'}
              onClick={() => setFilter('upcoming')}
              size="sm"
            >
              Upcoming
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {filteredAppointments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No appointments found</p>
            </CardContent>
          </Card>
        ) : (
          filteredAppointments.map((apt) => (
            <Card key={apt.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="h-5 w-5 text-primary-600" />
                      <CardTitle className="text-lg">
                        {apt.patient?.user?.first_name} {apt.patient?.user?.last_name}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(apt.appointment_date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {apt.appointment_time}
                      </span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    apt.status === 'completed' ? 'bg-green-100 text-green-800' :
                    apt.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                    apt.status === 'checked_in' ? 'bg-purple-100 text-purple-800' :
                    apt.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {apt.status.replace('_', ' ')}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {apt.reason_for_visit && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700">Reason for Visit:</p>
                    <p className="text-sm text-gray-600">{apt.reason_for_visit}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Link href={`/doctor/patients/${apt.patient?.id}`}>
                    <Button size="sm" variant="outline">
                      View Patient
                    </Button>
                  </Link>
                  {apt.status === 'scheduled' && (
                    <Button
                      size="sm"
                      onClick={() => updateStatus(apt.id, 'confirmed')}
                    >
                      Confirm
                    </Button>
                  )}
                  {apt.status === 'confirmed' && (
                    <Button
                      size="sm"
                      onClick={() => updateStatus(apt.id, 'checked_in')}
                    >
                      Check In
                    </Button>
                  )}
                  {apt.status === 'checked_in' && (
                    <Button
                      size="sm"
                      onClick={() => updateStatus(apt.id, 'completed')}
                    >
                      Complete
                    </Button>
                  )}
                  {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(apt.id, 'cancelled')}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
