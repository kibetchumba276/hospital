'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, User, Phone, Mail } from 'lucide-react'

export default function NurseAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAppointments()
  }, [])

  async function loadAppointments() {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(
            id,
            medical_record_number,
            blood_type,
            user:users(first_name, last_name, email, phone_number)
          ),
          doctor:staff!appointments_doctor_id_fkey(
            user:users(first_name, last_name)
          )
        `)
        .gte('appointment_date', today)
        .in('status', ['confirmed', 'checked_in'])
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

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Patient Appointments</h1>
        <p className="text-gray-600 mt-1">View scheduled patient appointments</p>
      </div>

      <div className="space-y-4">
        {appointments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No appointments scheduled
            </CardContent>
          </Card>
        ) : (
          appointments.map((apt) => {
            const patient = apt.patient
            const patientName = `${patient?.user?.first_name || 'Unknown'} ${patient?.user?.last_name || 'Patient'}`
            const doctorName = `${apt.doctor?.user?.first_name || 'Dr.'} ${apt.doctor?.user?.last_name || 'Unknown'}`

            return (
              <Card key={apt.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-primary-600" />
                        <div>
                          <p className="font-semibold text-lg">{patientName}</p>
                          <p className="text-sm text-gray-600">MRN: {patient?.medical_record_number || 'N/A'}</p>
                          <p className="text-xs text-gray-500">Doctor: {doctorName}</p>
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-600 ml-8">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(apt.appointment_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {apt.appointment_time}
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded text-xs font-medium ${
                      apt.status === 'checked_in' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {apt.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
