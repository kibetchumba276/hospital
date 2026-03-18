'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, CheckCircle, Calendar, Clock, User } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'

export default function CheckInPage() {
  const [email, setEmail] = useState('')
  const [searching, setSearching] = useState(false)
  const [appointments, setAppointments] = useState<any[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function searchAppointments() {
    if (!email) {
      setError('Please enter patient email')
      return
    }

    setSearching(true)
    setError('')
    setSuccess('')
    setAppointments([])

    try {
      const today = new Date().toISOString().split('T')[0]

      // Search for patient by email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, phone')
        .eq('email', email.toLowerCase())
        .eq('role', 'patient')
        .single()

      if (userError || !userData) {
        setError('Patient not found with this email')
        return
      }

      // Get patient record
      const { data: patientData } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', userData.id)
        .single()

      if (!patientData) {
        setError('Patient profile not found')
        return
      }

      // Get today's appointments
      const { data: appointmentsData, error: apptError } = await supabase
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
        .eq('appointment_date', today)
        .in('status', ['scheduled', 'confirmed'])
        .order('appointment_time', { ascending: true })

      if (apptError) throw apptError

      if (!appointmentsData || appointmentsData.length === 0) {
        setError('No appointments found for today')
        return
      }

      setAppointments(appointmentsData.map(apt => ({
        ...apt,
        patient: userData
      })))

    } catch (error: any) {
      console.error('Search error:', error)
      setError(error.message || 'Failed to search appointments')
    } finally {
      setSearching(false)
    }
  }

  async function checkInPatient(appointment: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Update appointment status
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          status: 'checked_in',
          checked_in_at: new Date().toISOString(),
          checked_in_by: user.id
        })
        .eq('id', appointment.id)

      if (updateError) throw updateError

      // Add to patient queue
      const { error: queueError } = await supabase
        .from('patient_queue')
        .insert({
          appointment_id: appointment.id,
          patient_id: appointment.patient_id,
          doctor_id: appointment.doctor_id,
          status: 'waiting',
          checked_in_at: new Date().toISOString()
        })

      if (queueError) throw queueError

      setSuccess(`${appointment.patient.first_name} ${appointment.patient.last_name} checked in successfully!`)
      
      // Remove from list
      setAppointments(appointments.filter(a => a.id !== appointment.id))

    } catch (error: any) {
      console.error('Check-in error:', error)
      setError(error.message || 'Failed to check in patient')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Patient Check-In</h1>
        <p className="text-gray-600 mt-1">Search and check in patients for their appointments</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Patient</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                type="email"
                placeholder="Enter patient email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchAppointments()}
              />
            </div>
            <Button onClick={searchAppointments} disabled={searching}>
              <Search className="h-4 w-4 mr-2" />
              {searching ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 bg-green-50 text-green-600 p-3 rounded-md text-sm">
              {success}
            </div>
          )}
        </CardContent>
      </Card>

      {appointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Today's Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-gray-500" />
                        <span className="font-semibold text-lg">
                          {appointment.patient.first_name} {appointment.patient.last_name}
                        </span>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(appointment.appointment_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>{formatTime(appointment.appointment_time)}</span>
                        </div>
                      </div>

                      <div className="text-sm">
                        <p className="text-gray-600">
                          <span className="font-medium">Doctor:</span> Dr. {appointment.doctor.user.first_name} {appointment.doctor.user.last_name}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Specialization:</span> {appointment.doctor.specialization}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Department:</span> {appointment.department.name}
                        </p>
                        {appointment.reason_for_visit && (
                          <p className="text-gray-600 mt-1">
                            <span className="font-medium">Reason:</span> {appointment.reason_for_visit}
                          </p>
                        )}
                      </div>

                      <div className="text-sm text-gray-500">
                        <p>Email: {appointment.patient.email}</p>
                        {appointment.patient.phone && <p>Phone: {appointment.patient.phone}</p>}
                      </div>
                    </div>

                    <Button
                      onClick={() => checkInPatient(appointment)}
                      className="ml-4"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Check In
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
