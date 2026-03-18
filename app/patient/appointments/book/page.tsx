'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function BookAppointmentPage() {
  const router = useRouter()
  const [specializations, setSpecializations] = useState<string[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [selectedSpecialization, setSelectedSpecialization] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadSpecializations()
  }, [])

  useEffect(() => {
    if (selectedSpecialization) {
      loadDoctors()
    }
  }, [selectedSpecialization])

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadAvailableSlots()
    }
  }, [selectedDoctor, selectedDate])

  async function loadSpecializations() {
    try {
      // Get all active departments
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      if (deptError) {
        console.error('Error loading departments:', deptError)
        return
      }

      if (!deptData || deptData.length === 0) {
        console.log('No departments found')
        return
      }

      console.log('Available departments:', deptData.map(d => d.name))
      setSpecializations(deptData.map(d => d.name))
    } catch (error) {
      console.error('Error in loadSpecializations:', error)
    }
  }

  async function loadDoctors() {
    try {
      // Get department ID from selected specialization
      const { data: deptData } = await supabase
        .from('departments')
        .select('id')
        .eq('name', selectedSpecialization)
        .single()

      if (!deptData) {
        console.log('Department not found')
        return
      }

      // Get staff in this department
      const { data, error } = await supabase
        .from('staff')
        .select('id, user_id, consultation_fee')
        .eq('department_id', deptData.id)

      if (error) {
        console.error('Error loading doctors:', error)
        return
      }

      if (!data || data.length === 0) {
        setDoctors([])
        return
      }

      // Get user details for each doctor
      const userIds = data.map(d => d.user_id)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, first_name, last_name, role, is_active')
        .in('id', userIds)
        .eq('role', 'doctor')
        .eq('is_active', true)

      if (usersError) {
        console.error('Error loading user details:', usersError)
        return
      }

      // Combine staff and user data
      const doctorsWithUsers = data.map(staff => {
        const user = usersData?.find(u => u.id === staff.user_id)
        return {
          ...staff,
          users: user || { first_name: 'Unknown', last_name: 'Doctor' }
        }
      }).filter(d => d.users.first_name !== 'Unknown')

      console.log('Loaded doctors:', doctorsWithUsers)
      setDoctors(doctorsWithUsers)
    } catch (error) {
      console.error('Error in loadDoctors:', error)
    }
  }

  async function loadAvailableSlots() {
    try {
      // Get existing appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('doctor_id', selectedDoctor)
        .eq('appointment_date', selectedDate)
        .in('status', ['scheduled', 'confirmed', 'checked_in'])

      // Generate slots from 9 AM to 5 PM
      const slots = []
      for (let hour = 9; hour < 17; hour++) {
        for (let minute of [0, 30]) {
          const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`
          const isBooked = appointments?.some((apt) => apt.appointment_time === timeStr)
          
          if (!isBooked) {
            slots.push({ time: timeStr, available: true })
          }
        }
      }

      setAvailableSlots(slots)
    } catch (error) {
      console.error('Error loading slots:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: patientData } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!patientData) throw new Error('Patient profile not found')

      const { error: insertError } = await supabase
        .from('appointments')
        .insert({
          patient_id: patientData.id,
          doctor_id: selectedDoctor,
          appointment_date: selectedDate,
          appointment_time: selectedTime,
          reason_for_visit: reason,
          status: 'scheduled',
        })

      if (insertError) throw insertError

      router.push('/patient/appointments')
    } catch (error: any) {
      setError(error.message || 'Failed to book appointment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/patient/appointments" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Appointments
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Book New Appointment</h1>
        <p className="text-gray-600 mt-1">Schedule your visit with our doctors</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appointment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department/Specialization
              </label>
              <select
                value={selectedSpecialization}
                onChange={(e) => {
                  setSelectedSpecialization(e.target.value)
                  setSelectedDoctor('')
                  setAvailableSlots([])
                }}
                className="w-full h-10 px-3 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select Department</option>
                {specializations.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>

            {selectedSpecialization && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doctor
                </label>
                <select
                  value={selectedDoctor}
                  onChange={(e) => {
                    setSelectedDoctor(e.target.value)
                    setAvailableSlots([])
                  }}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select Doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.users.first_name} {doctor.users.last_name}
                      {doctor.consultation_fee > 0 && ` - $${doctor.consultation_fee}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedDoctor && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Appointment Date
                </label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value)
                    setSelectedTime('')
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            )}

            {availableSlots.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Time Slots
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => setSelectedTime(slot.time)}
                      className={`p-2 rounded-md border text-sm ${
                        selectedTime === slot.time
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-primary-600'
                      }`}
                    >
                      {slot.time.substring(0, 5)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Visit
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Describe your symptoms or reason for visit..."
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !selectedTime}
            >
              {loading ? 'Booking...' : 'Book Appointment'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
