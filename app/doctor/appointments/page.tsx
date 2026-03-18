'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, User, Phone, Mail, FileText, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('today')

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
            medical_record_number,
            blood_type,
            user:users(
              first_name,
              last_name,
              email,
              phone_number
            )
          ),
          department:departments(name)
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
      
      await loadAppointments()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  const today = new Date().toISOString().split('T')[0]
  
  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'today') {
      return apt.appointment_date === today && apt.status !== 'completed' && apt.status !== 'cancelled'
    } else if (filter === 'upcoming') {
      return apt.appointment_date >= today && apt.status !== 'completed' && apt.status !== 'cancelled'
    } else if (filter === 'completed') {
      return apt.status === 'completed'
    }
    return true
  })

  if (loading) return <div>Loading appointments...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
        <p className="text-gray-600 mt-1">Manage your patient appointments</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setFilter('today')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            filter === 'today'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Today ({appointments.filter(a => a.appointment_date === today && a.status !== 'completed' && a.status !== 'cancelled').length})
        </button>
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            filter === 'upcoming'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Upcoming ({appointments.filter(a => a.appointment_date >= today && a.status !== 'completed' && a.status !== 'cancelled').length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            filter === 'completed'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Completed ({appointments.filter(a => a.status === 'completed').length})
        </button>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No appointments found</p>
            </CardContent>
          </Card>
        ) : (
          filteredAppointments.map((apt) => {
            const patient = apt.patient
            const patientName = `${patient?.user?.first_name || 'Unknown'} ${patient?.user?.last_name || 'Patient'}`
            const patientEmail = patient?.user?.email || 'N/A'
            const patientPhone = patient?.user?.phone_number || 'N/A'
            const mrn = patient?.medical_record_number || 'N/A'
            const bloodType = patient?.blood_type || 'Unknown'

            return (
              <Card key={apt.id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-4">
                        <div className="bg-primary-100 p-3 rounded-full">
                          <User className="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{patientName}</h3>
                          <p className="text-sm text-gray-600">MRN: {mrn}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded font-medium">
                              {bloodType}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded font-medium ${
                              apt.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                              apt.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              apt.status === 'checked_in' ? 'bg-purple-100 text-purple-800' :
                              apt.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {apt.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {new Date(apt.appointment_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <Clock className="h-4 w-4" />
                          {apt.appointment_time}
                        </div>
                      </div>
                    </div>

                    {/* Patient Contact */}
                    <div className="flex gap-6 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {patientEmail}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {patientPhone}
                      </div>
                    </div>

                    {/* Reason for Visit */}
                    {apt.reason_for_visit && (
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-sm font-medium text-blue-900">Reason for Visit:</p>
                        <p className="text-sm text-blue-800 mt-1">{apt.reason_for_visit}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Link href={`/doctor/patients/${patient?.id}`}>
                        <Button size="sm" variant="outline" className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          View Patient
                        </Button>
                      </Link>
                      
                      {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                        <>
                          {apt.status === 'scheduled' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(apt.id, 'confirmed')}
                              className="flex items-center gap-1"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Confirm
                            </Button>
                          )}
                          {(apt.status === 'confirmed' || apt.status === 'scheduled') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(apt.id, 'checked_in')}
                            >
                              Check In
                            </Button>
                          )}
                          {apt.status === 'checked_in' && (
                            <Button
                              size="sm"
                              onClick={() => updateStatus(apt.id, 'completed')}
                              className="flex items-center gap-1"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Complete
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateStatus(apt.id, 'cancelled')}
                            className="flex items-center gap-1"
                          >
                            <XCircle className="h-4 w-4" />
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
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
