'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, User, Search, CheckCircle } from 'lucide-react'

export default function ReceptionistAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('today')

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
            medical_record_number,
            user:users(first_name, last_name, phone_number, email)
          ),
          doctor:staff!appointments_doctor_id_fkey(
            user:users(first_name, last_name)
          ),
          department:departments(name)
        `)
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

  async function checkInPatient(appointmentId: string) {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'checked_in' })
        .eq('id', appointmentId)

      if (error) throw error
      await loadAppointments()
    } catch (error) {
      console.error('Error checking in patient:', error)
      alert('Failed to check in patient')
    }
  }

  const today = new Date().toISOString().split('T')[0]
  
  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = searchTerm === '' || 
      apt.patient?.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patient?.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patient?.medical_record_number?.toLowerCase().includes(searchTerm.toLowerCase())

    if (filter === 'today') {
      return matchesSearch && apt.appointment_date === today
    } else if (filter === 'upcoming') {
      return matchesSearch && apt.appointment_date >= today
    }
    return matchesSearch
  })

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
        <p className="text-gray-600 mt-1">Manage patient appointments and check-ins</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
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
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No appointments found
            </CardContent>
          </Card>
        ) : (
          filteredAppointments.map((apt) => {
            const patientName = `${apt.patient?.user?.first_name || 'Unknown'} ${apt.patient?.user?.last_name || 'Patient'}`
            const doctorName = `Dr. ${apt.doctor?.user?.first_name || ''} ${apt.doctor?.user?.last_name || 'Unknown'}`

            return (
              <Card key={apt.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-primary-600" />
                        <div>
                          <p className="font-semibold text-lg">{patientName}</p>
                          <p className="text-sm text-gray-600">MRN: {apt.patient?.medical_record_number || 'N/A'}</p>
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
                      <p className="text-sm text-gray-600 ml-8">With: {doctorName}</p>
                      <p className="text-sm text-gray-600 ml-8">Department: {apt.department?.name || 'N/A'}</p>
                    </div>
                    <div className="text-right space-y-2">
                      <span className={`px-3 py-1 rounded text-xs font-medium ${
                        apt.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        apt.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        apt.status === 'checked_in' ? 'bg-purple-100 text-purple-800' :
                        apt.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {apt.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {(apt.status === 'scheduled' || apt.status === 'confirmed') && (
                        <div>
                          <Button
                            size="sm"
                            onClick={() => checkInPatient(apt.id)}
                            className="w-full"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Check In
                          </Button>
                        </div>
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
